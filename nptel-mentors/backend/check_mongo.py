
from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    client.admin.command('ping')
    print("MongoDB Connected Successfully!")
except Exception as e:
    print(f"MongoDB Connection Failed: {e}")
    sys.exit(1)
