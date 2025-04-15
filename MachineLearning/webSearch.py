import requests
import json
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError
BATCH_SIZE = 50

load_dotenv()

url = "https://api.langsearch.com/v1/web-search"
web_search_key = os.getenv("WEB_SEARCH_API_KEY")

azure_mongo = os.getenv("AZURE_MONGO")
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