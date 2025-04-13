import os
import sys
from dotenv import load_dotenv
# import base64 # Not used
from openai import AzureOpenAI, OpenAIError # Import OpenAIError for better exception handling
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ConnectionFailure

# --- Basic Setup ---
print("--- Script Starting ---")

# --- Load Environment Variables ---
print("Loading environment variables from .env file...")
load_dotenv()

# --- Environment Variable Validation ---
print("Validating environment variables...")
AZURE_MONGO = os.getenv("AZURE_MONGO")
NEWS_GEN_ENDPOINT = os.getenv("NEWS_GEN_ENDPOINT")
NEWS_GEN_API_KEY = os.getenv("NEWS_GEN_API_KEY")
NEWS_GEN_DEPLOYMENT_NAME = os.getenv("NEWS_GEN_DEPLOYMENT_NAME", "gpt-4o") # Default if not set

missing_vars = []
if not AZURE_MONGO: missing_vars.append("AZURE_MONGO")
if not NEWS_GEN_ENDPOINT: missing_vars.append("NEWS_GEN_ENDPOINT")
if not NEWS_GEN_API_KEY: missing_vars.append("NEWS_GEN_API_KEY")

if missing_vars:
    print(f"ERROR: Missing required environment variables: {', '.join(missing_vars)}")
    sys.exit(1)
else:
    print("Environment variables loaded successfully.")

# --- MongoDB Connection ---
print(f"Attempting to connect to MongoDB using connection string from AZURE_MONGO...")
try:
    mongo_client = MongoClient(AZURE_MONGO, serverSelectionTimeoutMS=5000) # Add timeout
    # The ismaster command is cheap and does not require auth.
    mongo_client.admin.command('ismaster')
    print("MongoDB connection successful. Server info:")
    # print(mongo_client.server_info()) # Can be verbose, enable if needed
    db = mongo_client.test # Select the database
    news_collection = db.news # Original news articles collection
    summary_collection = db.news_summarize # Summaries collection
    print(f"Using database 'test', collections '{news_collection.name}' and '{summary_collection.name}'.")
except ConnectionFailure as e:
    print(f"ERROR: MongoDB connection failed: {e}")
    sys.exit(1)
except PyMongoError as e:
    print(f"ERROR: An error occurred during MongoDB setup: {e}")
    sys.exit(1)

# --- Azure OpenAI Client Initialization ---
print(f"Initializing Azure OpenAI client...")
print(f"  Endpoint: {NEWS_GEN_ENDPOINT}")
print(f"  Deployment: {NEWS_GEN_DEPLOYMENT_NAME}")
try:
    openai_client = AzureOpenAI(
        azure_endpoint=NEWS_GEN_ENDPOINT,
        api_key=NEWS_GEN_API_KEY,
        api_version="2024-05-01-preview", # Check if this API version is suitable
    )
    print("Azure OpenAI client initialized successfully.")
except Exception as e:
    print(f"ERROR: Failed to initialize Azure OpenAI client: {e}")
    sys.exit(1)

# --- Main Processing Loop ---
print("\n--- Starting News Article Processing ---")

# Counters
total_articles_found = 0
articles_processed = 0
articles_skipped_existing = 0
articles_skipped_no_desc = 0
articles_failed_summarization = 0
articles_failed_db_insert = 0

# Find ALL documents in the news collection
try:
    news_cursor = news_collection.find()
    # Get count for logging - Note: may be slow on very large collections without an index
    total_articles_found = news_collection.count_documents({})
    print(f"Found {total_articles_found} total articles in '{news_collection.name}'. Processing...")

    for news_doc in news_cursor:
        print("\n----------------------------------------")
        # Safely get _id and title (for logging)
        original_id = news_doc.get('_id')
        original_title = news_doc.get('title', 'N/A')

        if not original_id:
            print(f"WARNING: Skipping article with missing '_id'. Title: {original_title}")
            continue # Skip if no ID

        print(f"Processing Article - ID: {original_id}, Title: '{original_title}'")

        # 1. Check if summary already exists
        try:
            existing_summary = summary_collection.find_one({'original_doc_id': original_id})
            if existing_summary:
                print(f"INFO: Summary already exists for this article (Summary ID: {existing_summary.get('_id')}). Skipping.")
                articles_skipped_existing += 1
                continue # Skip to the next article
            else:
                print("INFO: No existing summary found. Checking description...")
        except PyMongoError as e:
             print(f"WARNING: Failed to check for existing summary for Article ID {original_id}. Error: {e}. Skipping article.")
             articles_skipped_existing += 1 # Count as skipped due to check failure
             continue

        # 2. Check for 'description' field
        description = news_doc.get('description')
        if not description or not isinstance(description, str) or len(description.strip()) == 0:
            print(f"INFO: Article ID {original_id} has no valid 'description' field or it is empty. Skipping.")
            articles_skipped_no_desc += 1
            continue # Skip to the next article
        else:
             print(f"INFO: Found description (length: {len(description)} chars). Proceeding with summarization...")
             # print(f"   Description snippet: {description[:100]}...") # Optional: print snippet

        # 3. Summarize the description
        task = "Please provide a concise summary of the following news description: "
        prompt_content = task + description
        messages = [{"role": "user", "content": prompt_content}]

        try:
            print(f"INFO: Sending request to Azure OpenAI for Article ID {original_id}...")
            completion = openai_client.chat.completions.create(
                model=NEWS_GEN_DEPLOYMENT_NAME,
                messages=messages,
                max_tokens=150, # Increased max_tokens for description summary
                temperature=0.3, # Slightly higher temp might be okay for descriptions
                top_p=0.95,
                frequency_penalty=0,
                presence_penalty=0,
                stop=None,
                stream=False
            )

            if completion.choices:
                summary_text = completion.choices[0].message.content.strip()
                print(f"INFO: Summary received successfully for Article ID {original_id}.")
                # print(f"   Summary: {summary_text}") # Optional: print full summary
            else:
                print(f"WARNING: OpenAI response did not contain choices for Article ID {original_id}. Skipping.")
                articles_failed_summarization += 1
                continue

        except OpenAIError as e:
            print(f"ERROR: Azure OpenAI API call failed for Article ID {original_id}. Error: {e}")
            articles_failed_summarization += 1
            continue # Skip to next article on API failure
        except Exception as e:
            print(f"ERROR: An unexpected error occurred during summarization for Article ID {original_id}. Error: {e}")
            articles_failed_summarization += 1
            continue


        # 4. Store the summary in MongoDB
        try:
            print(f"INFO: Attempting to insert summary for Article ID {original_id} into '{summary_collection.name}'...")
            news_summary_doc = {
                "original_doc_id": original_id, # Link back to the original article
                "news_title": original_title, # Store original title for context
                "summary": summary_text,
                "summarized_field": "description" # Indicate what was summarized
                # Add a timestamp? e.g., "summarized_at": datetime.datetime.now(datetime.timezone.utc)
            }
            result = summary_collection.insert_one(news_summary_doc)
            print(f"SUCCESS: Summary insert successful. New Summary Doc ID: {result.inserted_id}")
            articles_processed += 1
        except PyMongoError as e:
            print(f"ERROR: MongoDB insert failed for summary of Article ID {original_id}. Error: {e}")
            articles_failed_db_insert += 1
            # Don't 'continue' here, error is logged, loop proceeds.

except PyMongoError as e:
    print(f"\nERROR: A database error occurred while iterating through news articles: {e}")
except Exception as e:
    print(f"\nERROR: An unexpected error occurred during the main processing loop: {e}")
finally:
    # Close the MongoDB connection if it was opened
    if 'mongo_client' in locals() and mongo_client:
        print("\nClosing MongoDB connection...")
        mongo_client.close()
        print("MongoDB connection closed.")

# --- Final Summary ---
print("\n--- Processing Complete ---")
print(f"Total articles found in '{news_collection.name}': {total_articles_found}")
print("----------------------------------------")
print(f"Successfully summarized and stored: {articles_processed}")
print(f"Skipped (summary already existed): {articles_skipped_existing}")
print(f"Skipped (no/empty description):    {articles_skipped_no_desc}")
print(f"Failed (OpenAI summarization error): {articles_failed_summarization}")
print(f"Failed (MongoDB insert error):     {articles_failed_db_insert}")
print("--- Script Finished ---")