import os
import sys
import asyncio
import datetime
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI, OpenAIError
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError, ConnectionFailure, BulkWriteError

# --- Configuration ---
# Adjust these based on your Azure OpenAI plan's rate limits and system resources
MAX_CONCURRENT_API_CALLS = 10  # How many OpenAI requests to make at once
MONGO_BATCH_INSERT_SIZE = 100  # How many summaries to insert into MongoDB at once
# Check if this API version is current and suitable for your deployment/model
AZURE_OPENAI_API_VERSION = "2024-05-01-preview"
DEFAULT_DEPLOYMENT_NAME = "gpt-4o" # Default model if not set in .env
# OpenAI request parameters
MAX_TOKENS_SUMMARY = 150
TEMPERATURE_SUMMARY = 0.3

# --- Basic Setup ---
print("--- Async Script Starting ---")

# --- Load Environment Variables ---
print("Loading environment variables from .env file...")
load_dotenv()

# --- Environment Variable Validation ---
print("Validating environment variables...")
AZURE_MONGO = os.getenv("AZURE_MONGO")
NEWS_GEN_ENDPOINT = os.getenv("NEWS_GEN_ENDPOINT")
NEWS_GEN_API_KEY = os.getenv("NEWS_GEN_API_KEY")
NEWS_GEN_DEPLOYMENT_NAME = os.getenv("NEWS_GEN_DEPLOYMENT_NAME", DEFAULT_DEPLOYMENT_NAME)

missing_vars = []
if not AZURE_MONGO: missing_vars.append("AZURE_MONGO")
if not NEWS_GEN_ENDPOINT: missing_vars.append("NEWS_GEN_ENDPOINT")
if not NEWS_GEN_API_KEY: missing_vars.append("NEWS_GEN_API_KEY")

if missing_vars:
    print(f"ERROR: Missing required environment variables: {', '.join(missing_vars)}")
    sys.exit(1)
else:
    print("Environment variables loaded successfully.")

# --- Initialize Async Clients ---
print("Initializing asynchronous clients...")
try:
    # MongoDB Async Client
    mongo_client = AsyncIOMotorClient(AZURE_MONGO, serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth. Check connection.
    # await mongo_client.admin.command('ismaster') # Check connection in main() async context
    db = mongo_client.test
    news_collection = db.news
    summary_collection = db.news_summarize
    print("MongoDB async client configured.")
    print(f"Using database '{db.name}', collections '{news_collection.name}' and '{summary_collection.name}'.")

    # Azure OpenAI Async Client
    print(f"Initializing Azure OpenAI async client...")
    print(f"  Endpoint: {NEWS_GEN_ENDPOINT}")
    print(f"  Deployment: {NEWS_GEN_DEPLOYMENT_NAME}")
    openai_client = AsyncAzureOpenAI(
        azure_endpoint=NEWS_GEN_ENDPOINT,
        api_key=NEWS_GEN_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION,
    )
    print("Azure OpenAI async client initialized successfully.")

except ConnectionFailure as e:
     print(f"ERROR: MongoDB connection check failed during init: {e}")
     sys.exit(1)
except PyMongoError as e:
     print(f"ERROR: An error occurred during MongoDB async setup: {e}")
     sys.exit(1)
except Exception as e:
    print(f"ERROR: Failed to initialize clients: {e}")
    sys.exit(1)


# --- Core Processing Function ---
async def summarize_article(news_doc, semaphore, p_openai_client, p_deployment_name):
    """
    Processes a single news article: summarizes description via OpenAI asynchronously.

    Args:
        news_doc (dict): The news document {_id, title, description}.
        semaphore (asyncio.Semaphore): To limit concurrent API calls.
        p_openai_client (AsyncAzureOpenAI): The OpenAI client instance.
        p_deployment_name (str): The deployment name (model).

    Returns:
        dict: The summary document to be inserted, or None if processing failed.
    """
    original_id = news_doc.get('_id')
    original_title = news_doc.get('title', 'N/A')
    description = news_doc.get('description') # Should be valid due to pre-filtering

    if not original_id:
        print(f"WARNING: Skipping article with missing '_id'. Title: {original_title}")
        return None # Should not happen if _id exists

    # Acquire semaphore before making API call
    async with semaphore:
        print(f"INFO: Processing Article ID: {original_id} Title: '{original_title}'")
        try:
            task = "Please provide a concise summary of the following news description, excluding any sexual, violent or graphic language: "
            prompt_content = task + description
            messages = [{"role": "user", "content": prompt_content}]

            print(f"  -> Sending request to Azure OpenAI for Article ID {original_id}...")
            completion = await p_openai_client.chat.completions.create(
                model=p_deployment_name,
                messages=messages,
                max_tokens=MAX_TOKENS_SUMMARY,
                temperature=TEMPERATURE_SUMMARY,
                top_p=0.95,
                frequency_penalty=0,
                presence_penalty=0,
                stop=None,
                stream=False
            )

            if completion.choices:
                summary_text = completion.choices[0].message.content.strip()
                if not summary_text: # Handle empty summary response
                     print(f"WARNING: OpenAI returned an empty summary for Article ID {original_id}. Skipping.")
                     return None

                print(f"  <- Summary received successfully for Article ID {original_id}.")
                summary_doc = {
                    "original_doc_id": original_id,
                    "news_title": original_title,
                    "summary": summary_text,
                    "summarized_field": "description",
                    "summarized_at": datetime.datetime.now(datetime.timezone.utc) # Add timestamp
                }
                return summary_doc
            else:
                print(f"WARNING: OpenAI response did not contain choices for Article ID {original_id}. Skipping.")
                return None

        except OpenAIError as e:
            print(f"ERROR: Azure OpenAI API call failed for Article ID {original_id}. Status={e.status_code} Err={e.response}")
            return None
        except Exception as e:
            print(f"ERROR: An unexpected error occurred during summarization for Article ID {original_id}. Error: {e}")
            return None

# --- Main Asynchronous Function ---
async def main():
    """
    Main orchestration function. Finds articles, processes them concurrently, and batch inserts results.
    """
    print("\n--- Starting Async News Article Processing ---")
    start_time = datetime.datetime.now()

    # Counters
    total_articles_found_initial = 0
    articles_needing_summary = 0
    summaries_generated = 0
    summaries_inserted = 0
    articles_failed_summarization = 0
    articles_failed_db_insert = 0 # Primarily tracks batch insert failures

    try:
        # Check MongoDB connection before proceeding
        await mongo_client.admin.command('ismaster')
        print("MongoDB connection successful.")

        # 1. Find IDs of articles already summarized
        print("Finding existing summaries...")
        existing_summary_ids_cursor = summary_collection.find({}, {'original_doc_id': 1}) # Find returns the async cursor
        # Await fetching all documents into a list, then create the set
        existing_summary_docs = await existing_summary_ids_cursor.to_list(length=None) # length=None fetches all documents
        existing_summary_ids = set(doc['original_doc_id'] for doc in existing_summary_docs if 'original_doc_id' in doc) # Build set from list, ensure key exists
        count_existing = len(existing_summary_ids)
        print(f"Found {count_existing} existing summary documents.")

        # 2. Find articles in the news collection that need summarization
        print("Finding articles needing summarization...")
        query = {
            '_id': {'$nin': list(existing_summary_ids)}, # Exclude already summarized
            'description': {'$exists': True, '$ne': None, '$ne': '', '$type': 'string'} # Valid description needed
        }
        projection = {'_id': 1, 'title': 1, 'description': 1} # Fetch only needed fields

        # Get a count for logging (optional, can be slow on massive collections without indexed query fields)
        try:
            articles_needing_summary = await news_collection.count_documents(query)
            print(f"Found {articles_needing_summary} articles requiring summarization.")
        except PyMongoError as e:
            print(f"Warning: Could not count documents needing summary: {e}. Proceeding without exact count.")
            articles_needing_summary = -1 # Indicate unknown count

        if articles_needing_summary == 0:
            print("No articles found needing summarization. Exiting.")
            return # Exit early if nothing to do

        # 3. Create concurrent tasks for summarization
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_API_CALLS)
        tasks = []
        print(f"Creating summarization tasks (concurrency limit: {MAX_CONCURRENT_API_CALLS})...")
        news_cursor = news_collection.find(query, projection)
        async for news_doc in news_cursor:
            tasks.append(summarize_article(news_doc, semaphore, openai_client, NEWS_GEN_DEPLOYMENT_NAME))

        # 4. Run tasks concurrently and gather results
        print(f"Running {len(tasks)} tasks...")
        results = await asyncio.gather(*tasks, return_exceptions=True) # Capture exceptions from tasks

        # 5. Process results and prepare for batch insert
        summaries_to_insert = []
        for result in results:
            if isinstance(result, dict): # Successful summary
                summaries_to_insert.append(result)
                summaries_generated += 1
            elif isinstance(result, Exception): # Exception caught by asyncio.gather
                print(f"ERROR: Task failed with exception: {result}")
                articles_failed_summarization += 1
            elif result is None: # Task indicated failure/skip internally
                articles_failed_summarization += 1
            # else: should not happen

        print(f"Generated {summaries_generated} summaries. {articles_failed_summarization} articles failed summarization.")

        # 6. Batch insert summaries into MongoDB
        if summaries_to_insert:
            print(f"Attempting to batch insert {len(summaries_to_insert)} summaries (batch size: {MONGO_BATCH_INSERT_SIZE})...")
            total_inserted_count = 0
            for i in range(0, len(summaries_to_insert), MONGO_BATCH_INSERT_SIZE):
                batch = summaries_to_insert[i : i + MONGO_BATCH_INSERT_SIZE]
                print(f"  Inserting batch {i // MONGO_BATCH_INSERT_SIZE + 1} ({len(batch)} docs)...")
                try:
                    insert_result = await summary_collection.insert_many(batch, ordered=False) # ordered=False allows partial success on errors
                    inserted_count = len(insert_result.inserted_ids)
                    total_inserted_count += inserted_count
                    print(f"  SUCCESS: Inserted {inserted_count} summaries in this batch.")
                except BulkWriteError as bwe:
                    inserted_count = bwe.details['nInserted']
                    failed_count = len(batch) - inserted_count
                    total_inserted_count += inserted_count
                    articles_failed_db_insert += failed_count
                    print(f"  ERROR: Bulk write error during batch insert. Details: {bwe.details}")
                    print(f"    Successfully inserted: {inserted_count}, Failed: {failed_count}")
                except PyMongoError as e:
                    failed_count = len(batch)
                    articles_failed_db_insert += failed_count
                    print(f"  ERROR: MongoDB error during batch insert: {e}")
                    print(f"    Failed this batch: {failed_count}")
                except Exception as e:
                    failed_count = len(batch)
                    articles_failed_db_insert += failed_count
                    print(f"  ERROR: Unexpected error during batch insert: {e}")
                    print(f"    Failed this batch: {failed_count}")
            summaries_inserted = total_inserted_count
            print(f"Total summaries inserted across all batches: {summaries_inserted}")
        else:
            print("No valid summaries were generated to insert.")

    except PyMongoError as e:
        print(f"\nERROR: A critical MongoDB error occurred: {e}")
    except Exception as e:
        print(f"\nERROR: An unexpected critical error occurred in main loop: {e}")
    finally:
        # Always try to close the client
        if mongo_client:
            print("\nClosing MongoDB connection...")
            mongo_client.close()
            print("MongoDB connection closed.")

        # --- Final Summary ---
        end_time = datetime.datetime.now()
        duration = end_time - start_time
        print("\n--- Async Processing Complete ---")
        print(f"Duration: {duration}")
        print("----------------------------------------")
        # print(f"Initial articles found needing summary (approx): {articles_needing_summary if articles_needing_summary != -1 else 'Unknown'}") # Might be confusing if count failed
        print(f"Total summaries successfully generated: {summaries_generated}")
        print(f"Total summaries successfully inserted:  {summaries_inserted}")
        print(f"Articles failed during summarization (API/Error): {articles_failed_summarization}")
        print(f"Summaries failed during DB insert: {articles_failed_db_insert}")
        print("--- Async Script Finished ---")

# --- Run the Async Main Function ---
if __name__ == "__main__":
    # On Windows, the default event loop policy might need adjustment for motor/asyncio
    # if sys.platform == "win32":
    #    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
        sys.exit(1)