import requests
import json
import os
# from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError
BATCH_SIZE = 50
# test

# load_dotenv()
NEWS_API_KEY="f9fa966a09b117644338ae57e6ff635d"
NEWS_API_ENDPOINT="http://api.mediastack.com/v1/news"
AZURE_MONGO="mongodb+srv://affairs:Online41ver@affairsdb.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
NEWS_GEN_ENDPOINT="https://newsaggregator7983660224.openai.azure.com/"
NEWS_GEN_DEPLOYMENT_NAME="gpt-4o"
NEWS_GEN_API_KEY="55gPPjfMszfUyfzI0Ty70VFgj4HuzgHHFbvso6RANBBmd9oySIvPJQQJ99BCACYeBjFXJ3w3AAAAACOGCfs7"
WEB_SEARCH_API_KEY="sk-f788bd3867a8416694affdd159b73a0e"
url = "https://api.langsearch.com/v1/web-search"
#url = os.getenv("WEB_SEARCH_API_URL")
web_search_key = WEB_SEARCH_API_KEY

azure_mongo = AZURE_MONGO
mongo_client = MongoClient(azure_mongo)
print(mongo_client.list_database_names())
db = mongo_client.test
web_search = db.web_search
#news = db.news
news = db.test
summary_query = {"summary" : { "$exists": False}}
print(f"news count: {news.count_documents({})}")
#lack_summarize = news.find(summary_query, no_cursor_timeout=True)

headers = {
    'Authorization': web_search_key,
    'Content-Type': 'application/json'
}

n = BATCH_SIZE
while n == BATCH_SIZE:
    n = 0
    lack_summarize = news.find(summary_query, no_cursor_timeout=True)
    try:
        for doc in lack_summarize:
            n += 1
            prompt = doc['title']
            print(f"Processing prompt {n}: {prompt}")

            payload = json.dumps({
                # "query": "News title is: 'Around 50 firefighters tackle 'severe' house blaze in Tipton', please summary.",
                "query": prompt,
                "freshness": "noLimit",
                "summary": True,
                "count": 1
            })
            response = requests.request("POST", url, headers=headers, data=payload)
            summary = response.json()["data"]["webPages"]["value"][0]["summary"]
            print(f"summary: {summary[0: 20]} ...")

            news.update_one({"_id": doc["_id"]},
                            {"$set": {"summary": summary}})

            if n >= BATCH_SIZE:
                break

    except Exception as e:
        print(f"Skip the error: {str(e)}")
        #n = BATCH_SIZE
        continue