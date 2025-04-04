import os
from dotenv import load_dotenv
import base64
from openai import AzureOpenAI
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
import pandas as pd

load_dotenv()

azure_mongo = os.getenv("AZURE_MONGO")
mongo_client = MongoClient(azure_mongo)
print(mongo_client.list_database_names())
db = mongo_client.test
test_table = db.news
news_sum = db.news_summarize
news_js = test_table.find({'author': "Flo Clifford"})

# myclient = MongoClient("mongodb://localhost:27017")
# # myclient = MongoClient('localhost',27017)
# print(myclient.list_database_names())
# db = myclient.newsDB
# news_table = db.news
# news_summary_table = db.news_summarize
# news_js = news_table.find({'author': "Joanne Gould"})


news_gen_endpoint = os.getenv("NEWS_GEN_ENDPOINT")
news_gen_deployment = os.getenv("NEWS_GEN_DEPLOYMENT_NAME", "gpt-4o")
news_gen_subscription_key = os.getenv("NEWS_GEN_API_KEY")

# Initialize Azure OpenAI Service client with key-based authentication
client = AzureOpenAI(
    azure_endpoint=news_gen_endpoint,
    api_key=news_gen_subscription_key,
    api_version="2024-05-01-preview",
)


# IMAGE_PATH = "YOUR_IMAGE_PATH"
# encoded_image = base64.b64encode(open(IMAGE_PATH, 'rb').read()).decode('ascii')

# Prepare the chat prompt
task = "Please summarize the news: "
news_content = news_js[0]['title']
task_news_content = task + news_content
# chat_prompt = [ {"role": "user", "content": "How are you?"}]
chat_prompt = [{"role": "user", "content": task_news_content}]
# Include speech result if speech is enabled
messages = chat_prompt

#Generate the completion
completion = client.chat.completions.create(
    model=news_gen_deployment,
    messages=messages,
    max_tokens=30, # control the number of the outputs
    temperature=0.2, # 0 <- More stable answer, 1 <- More variety answer
    top_p=0.95, # Choice the next word which the probability more than 95%
    frequency_penalty=0,
    presence_penalty=0, # 0 <- More relate topic answer, 1 <- More variety answer
    stop=None,
    stream=False
)

summary = completion.choices[0].message.content
print(f"The summary is: {summary}")
try:
    news_summary = {
        "news_title": news_content,
        "summary": summary
    }
    #result = news_summary_table.insert_one(news_summary)
    # print(f"insert success, Doc ID: {result.inserted_id}")
    # print("The number of current document:", news_summary_table.count_documents({}))
    result = news_sum.insert_one(news_summary)
    print(f"insert sucess, Doc ID: {result.inserted_id}")
    print("The number of current document: ", news_sum.count_documents())
except PyMongoError as e:
    print(f"MongoDB insert failed: {e}")