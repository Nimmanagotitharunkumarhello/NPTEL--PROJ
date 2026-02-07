
from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client['course_enrollment'] # Assuming this is the DB name from config, checking app.py... 
    # Wait, app.py uses client.get_database() which uses valid default from URI.
    # Config default is mongodb://localhost:27017/nptel_db in many flask apps, but let's check config.py
    
    # Let's try to list databases first to be sure
    print("Databases:", client.list_database_names())
    
    # Checking 'nptel_project' or similar. 
    # I'll check config.py content first to be sure of DB name, but I can't view it right now easily without a tool call.
    # I'll just list databases and guess, or check the 'mentors' in all likely DBs.
    
    with open("db_content.txt", "w", encoding="utf-8") as f:
        dbs = client.list_database_names()
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']: continue
            f.write(f"\n--- Database: {db_name} ---\n")
            db = client[db_name]
            if 'mentors' in db.list_collection_names():
                count = db.mentors.count_documents({})
                f.write(f"Mentors count: {count}\n")
                for mentor in db.mentors.find():
                    f.write(str(mentor) + "\n")
            else:
                f.write("No 'mentors' collection found.\n")
    print("Done writing to db_content.txt")

except Exception as e:
    print(f"Error: {e}")
