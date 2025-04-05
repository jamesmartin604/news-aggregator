import requests
import json
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()

url = "https://api.langsearch.com/v1/web-search"
web_search_key = os.getenv("WEB_SEARCH_API_KEY")

azure_mongo = os.getenv("AZURE_MONGO")
mongo_client = MongoClient(azure_mongo)
print(mongo_client.list_database_names())
db = mongo_client.test
web_search = db.web_search


payload = json.dumps({
  "query": "News title is: 'Around 50 firefighters tackle 'severe' house blaze in Tipton', please summary.",
  "freshness": "noLimit",
  "summary": True,
  "count": 5
})
headers = {
    'Authorization': web_search_key,
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)
web_search.insert_one(response.json())
