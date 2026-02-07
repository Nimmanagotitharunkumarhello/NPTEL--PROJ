
from pymongo import MongoClient
from passlib.context import CryptContext
from config import Config
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin(email, password, name="Admin"):
    try:
        client = MongoClient(Config.MONGO_URI)
        db = client.get_database() # Uses database from URI
        users = db.users
        
        existing_user = users.find_one({"email": email})
        
        hashed_password = pwd_context.hash(password)
        
        if existing_user:
            logging.info(f"User {email} exists. Updating to Admin role.")
            users.update_one(
                {"email": email},
                {"$set": {"role": "admin", "password": hashed_password, "name": name}}
            )
        else:
            logging.info(f"Creating new Admin user: {email}")
            users.insert_one({
                "name": name,
                "email": email,
                "password": hashed_password,
                "role": "admin"
            })
            
        logging.info("Admin user setup complete.")
        
    except Exception as e:
        logging.error(f"Error setting up admin: {e}")

if __name__ == "__main__":
    create_admin("adminsist@gmail.com", "admin2026")
