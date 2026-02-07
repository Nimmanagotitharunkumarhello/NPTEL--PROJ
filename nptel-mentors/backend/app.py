from flask import Flask, request, jsonify, send_file
from flask_mail import Mail, Message
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError
from passlib.context import CryptContext
from bson.objectid import ObjectId
from werkzeug.utils import secure_filename
import jwt
import datetime
import logging
import os
import re
import pandas as pd
import io
import hashlib

# Import Configuration
from config import Config

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Flask App
app = Flask(__name__)
app.config.from_object(Config)

# Improved CORS configuration
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize Mail
mail = Mail(app)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB Connection with Retry Logic
client = None
max_retries = 3
retry_delay = 2

for attempt in range(max_retries):
    try:
        logging.info(f"Connecting to MongoDB (Attempt {attempt + 1}/{max_retries})...")
        client = MongoClient(app.config['MONGO_URI'], serverSelectionTimeoutMS=5000)
        # Trigger a connection check
        client.admin.command('ping')
        logging.info("Connected to MongoDB successfully!")
        break
    except ConnectionFailure:
        logging.error(f"Failed to connect to MongoDB (Attempt {attempt + 1}). Retrying in {retry_delay}s...")
        import time
        time.sleep(retry_delay)
    except Exception as e:
        logging.error(f"Unexpected error connecting to MongoDB: {e}")

if not client:
    logging.error("Could not connect to MongoDB after multiple attempts. Application may not function correctly.")
    # Fallback to local if URI fails? Or just proceed and let routes fail.
    # Proceeding allows the app to start, but routes needing DB will 500.


if not client:
    logging.error("Could not connect to MongoDB after multiple attempts. Application may not function correctly.")
    db = None
    users_collection = None
    mentors_collection = None
    students_collection = None
    chat_collection = None
else:
    # Database Initialization
    try:
        db = client.get_database() # Uses the database from the URI
        users_collection = db['users']
        mentors_collection = db['mentors']
        students_collection = db['students']
        chat_collection = db['chats']
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        db = None
        users_collection = None
        mentors_collection = None
        students_collection = None
        chat_collection = None

def init_db():
    """Initialize database indexes."""
    if users_collection is None:
        logging.warning("Database not connected. Skipping index creation.")
        return
    try:
        users_collection.create_index("email", unique=True)
        # users_collection.create_index("registrationNumber", unique=True, sparse=True) # Optional for future
        students_collection.create_index("regNo", unique=True)
        students_collection.create_index("emailId", unique=True)
        mentors_collection.create_index("erpId", unique=True)
        mentors_collection.create_index("emailId", unique=True)
        logging.info("Database indexes created successfully.")
    except Exception as e:
        logging.error(f"Error creating indexes: {e}")

def sync_mentor_counts():
    """Sync currentStudentCount in mentors collection based on actual students."""
    if mentors_collection is None:
         return
    try:
        mentors = list(mentors_collection.find({}))
        for mentor in mentors:
            faculty_name = mentor.get("facultyName")
            course_name = mentor.get("courseName")
            if faculty_name and course_name:
                count = students_collection.count_documents({"facultyName": faculty_name, "courseName": course_name})
                mentors_collection.update_one(
                    {"_id": mentor["_id"]},
                    {"$set": {"currentStudentCount": count}}
                )
        logging.info("Mentor student counts synced successfully.")
    except Exception as e:
        logging.error(f"Error syncing mentor counts: {e}")

# Run DB Initialization
init_db()
sync_mentor_counts()

# Helper Functions
def make_response(message, status_code):
    """Standardized JSON response format."""
    return jsonify({"message": message}), status_code

def is_email_valid(email):
    """Validate email format."""
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))

def verify_scrypt_password(password, stored_password):
    try:
        # Extract scrypt parameters and hash from stored password
        params = stored_password.split('$')
        salt = params[2]
        stored_hash = params[3]

        # Recreate the scrypt hash and compare with stored hash
        computed_hash = hashlib.scrypt(password.encode(), salt=salt.encode(), n=32768, r=8, p=1).hex()
        
        return computed_hash == stored_hash
    except Exception as e:
        logging.error(f"Error verifying scrypt password: {e}")
        return False

def get_faculty_email(faculty_name):
    """Fetch faculty email from database."""
    faculty = mentors_collection.find_one({"facultyName": faculty_name})
    if faculty:
        return faculty.get("emailId")
    return None

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# --- ROUTES ---

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify DB connectivity."""
    try:
        client.admin.command('ping')
        return jsonify({"status": "healthy", "db": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "db": str(e)}), 500

@app.route('/')
def home():
    """Root route."""
    return jsonify({"message": "Welcome to the Course Enrollment API!"})

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/signup', methods=['POST'])
def signup():
    if users_collection is None:
        return make_response("Database connection failed. Please ensure MongoDB is running.", 503)
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get("password")
        confirmPassword = data.get("confirmPassword")

        if not all([name, email, password, confirmPassword]):
            return make_response("All fields are required", 400)
        if password != confirmPassword:
            return make_response("Passwords do not match", 400)
        if not is_email_valid(email):
            return make_response("Invalid email address", 400)

        # Confirm user doesn't already exist (Redundant with unique index but good usage feedback)
        if users_collection.find_one({"email": email}):
             return make_response("User already exists with this email", 409)

        # Hash password and save
        hashed_password = pwd_context.hash(password)

        # Default role is 'student'
        role = "student" 

        users_collection.insert_one({
            "name": name,
            "email": email,
            "password": hashed_password,
            "role": role,
            "createdAt": datetime.datetime.utcnow()
        })

        return make_response("User registered successfully", 201)
    except DuplicateKeyError:
        return make_response("User already exists with this email", 409)
    except Exception as e:
        logging.error(f"Error in signup: {str(e)}")
        return make_response(f"An error occurred: {str(e)}", 500)

@app.route('/login', methods=['POST'])
def login():
    if users_collection is None:
        return make_response("Database connection failed. Please ensure MongoDB is running.", 503)
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return make_response("Email and password are required", 400)

        user = users_collection.find_one({"email": email})
        if not user:
            return make_response("Invalid email or password", 401)
        
        stored_password = user["password"]

        valid_password = False
        # Check if the password is hashed using bcrypt
        if stored_password.startswith('$2b$'):
            if pwd_context.verify(password, stored_password):
                valid_password = True
        # Handle scrypt hashed password (Legacy support)
        elif stored_password.startswith('scrypt:'):
            if verify_scrypt_password(password, stored_password):
                 valid_password = True
                 # Migrate to bcrypt
                 bcrypt_hash = pwd_context.hash(password)
                 users_collection.update_one({"email": email}, {"$set": {"password": bcrypt_hash}})
                 logging.info(f"Password for {email} migrated to bcrypt")

        if not valid_password:
             return make_response("Invalid email or password", 401)

        # Return user details including role
        return jsonify({
            "message": "Login successful",
            "token": "dummy-token", # In a real app, generate JWT here
            "user": {
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role", "student") # Default to student if role missing
            }
        }), 200

    except Exception as e:
        logging.error(f"Error in login: {str(e)}")
        return make_response(f"An error occurred: {str(e)}", 500)

@app.route('/api/admin/delete-mentor/<mentor_id>', methods=['DELETE'])
def delete_mentor(mentor_id):
    try:
        # Check if mentor exists
        if not ObjectId.is_valid(mentor_id):
             return jsonify({"message": "Invalid mentor ID"}), 400
             
        result = mentors_collection.delete_one({"_id": ObjectId(mentor_id)})
        
        if result.deleted_count == 1:
            return jsonify({"message": "Mentor deleted successfully"}), 200
        else:
            return jsonify({"message": "Mentor not found"}), 404
    except Exception as e:
        logging.error(f"Error deleting mentor: {e}")
        return jsonify({"message": "Error deleting mentor"}), 500



@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    # In a real app, verify user exists. 
    # For security (user enumeration prevention), we might always say "If email exists..."
    # But let's check for our own logic.
    user = users_collection.find_one({"email": email})
    if not user:
         # Consistent security response
         return jsonify({"message": "If the email exists, a reset link has been sent."}), 200
    
    reset_token = jwt.encode(
        {
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        },
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    # Ideally frontend URL from config
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

    try:
        msg = Message(
            "Password Reset Request",
            sender=app.config['MAIL_DEFAULT_SENDER'],
            recipients=[email]
        )
        msg.body = f"Click the link below to reset your password:\n{reset_link}"
        mail.send(msg)
        return jsonify({"message": "If the email exists, a reset link has been sent."}), 200

    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return jsonify({"message": "Failed to send reset link. Please try again later."}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({"message": "Token and new password are required"}), 400

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        email = decoded.get('email')

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"message": "User not found"}), 404

        hashed_password = pwd_context.hash(new_password)

        users_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )

        return jsonify({"message": "Password reset successfully"}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Reset token has expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid reset token"}), 400

@app.route('/enroll-mentor', methods=['GET', 'POST'])
def enroll_mentor():
    if request.method == 'GET':
        try:
            mentors = list(mentors_collection.find({}, {"_id": 0}))
            if not mentors:
                return make_response("No mentors found", 404)
            return jsonify(mentors), 200
        except Exception as e:
            logging.error(f"Error in GET enroll_mentor: {str(e)}")
            return make_response(f"An error occurred: {str(e)}", 500)

    elif request.method == 'POST':
        try:
            data = request.get_json()
            faculty_name = data.get("facultyName")
            erp_id = data.get("erpId")
            department = data.get("department")
            email_id = data.get("emailId")
            course_name = data.get("courseName")
            instructor_name = data.get("instructorName")
            duration = data.get("duration")

            if not all([faculty_name, erp_id, department, email_id, course_name, instructor_name, duration]):
                return make_response("All fields are required", 400)
            if not is_email_valid(email_id):
                return make_response("Invalid email address", 400)

            if mentors_collection.find_one({"$or": [{"erpId": erp_id}, {"emailId": email_id}]}):
                return make_response("Mentor already exists", 409)

            mentors_collection.insert_one({
                "facultyName": faculty_name,
                "erpId": erp_id,
                "department": department,
                "emailId": email_id,
                "courseName": course_name,
                "instructorName": instructor_name,
                "duration": duration,
                "createdAt": datetime.datetime.utcnow()
            })

            return make_response("Mentor enrolled successfully", 201)
        except Exception as e:
            logging.error(f"Error in POST enroll_mentor: {str(e)}")
            return make_response(f"An error occurred: {str(e)}", 500)

@app.route('/get-faculties', methods=['GET'])
def get_faculties():
    try:
        # Fetch mentors
        if request.args:
             query = request.args.to_dict()
             # Simple filter, be careful with security in prod
             mentors = list(mentors_collection.find(query))
        else:
             mentors = list(mentors_collection.find())

        faculties = [
            {
                "facultyName": mentor.get("facultyName", "Unknown Faculty"),
                "courseName": mentor.get("courseName", "Unknown Course"),
                "instructorName": mentor.get("instructorName", "Unknown Instructor"),
                "duration": mentor.get("duration", "Unknown Duration"),
                "currentStudentCount": mentor.get("currentStudentCount", 0),
                "maxStudents": mentor.get("maxStudents", 25),
                "_id": str(mentor["_id"])
            }
            for mentor in mentors
        ]
        return jsonify({"faculties": faculties}), 200
    except Exception as e:
        logging.error(f"Error fetching faculties: {e}")
        return make_response(f"An error occurred: {str(e)}", 500)

@app.route('/enroll-student', methods=['POST'])
def enroll_student():
    try:
        # Check if it's a multipart/form-data request (File Upload)
        if 'paymentScreenshot' in request.files:
            data = request.form
            file = request.files['paymentScreenshot']
        else:
            # Fallback for old JSON requests (for backward compatibility if needed, though we should enforce upload)
            data = request.get_json()
            file = None

        logging.info(f"Received enrollment data: {data}")

        student_name = data.get("name").strip() if data.get("name") else None
        reg_no = data.get("regNo").strip() if data.get("regNo") else None
        year = data.get("year").strip() if data.get("year") else None
        email_id = data.get("email").strip() if data.get("email") else None
        course_name = data.get("courseName").strip() if data.get("courseName") else None
        duration = data.get("duration").strip() if data.get("duration") else None
        instructor_name = data.get("instructorName").strip() if data.get("instructorName") else None
        faculty_name = data.get("facultyName").strip() if data.get("facultyName") else None

        logging.info(f"Processing Enrollment: Faculty='{faculty_name}', Course='{course_name}'")

        if not all([student_name, reg_no, year, email_id, course_name, duration, instructor_name, faculty_name]):
            return make_response("All fields are required", 400)
        if not is_email_valid(email_id):
            return make_response("Invalid email address", 400)

        # Check for duplicate entry
        if students_collection.find_one({"emailId": email_id}):
            return make_response("Student already enrolled (Email exists)", 409)
        if students_collection.find_one({"regNo": reg_no}):
             return make_response("Student already enrolled (RegNo exists)", 409)

        # Handle File Upload
        payment_screenshot_path = None
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Create directory structure: uploads/regNo/
            student_dir = os.path.join(app.config['UPLOAD_FOLDER'], reg_no)
            if not os.path.exists(student_dir):
                os.makedirs(student_dir)
            
            filepath = os.path.join(student_dir, filename)
            file.save(filepath)
            payment_screenshot_path = filepath
        elif file:
             return make_response("Invalid file type. Allowed: png, jpg, jpeg, pdf", 400)
        else:
             return make_response("Payment screenshot is required", 400)

        # Check faculty capacity and reserve spot atomically
        # We find the mentor and increment count IF count < maxStudents
        # Default maxStudents is 25
        
        mentor = mentors_collection.find_one({"facultyName": faculty_name, "courseName": course_name})
        if not mentor:
             return make_response("Faculty not found for this course", 404)

        max_students = mentor.get("maxStudents", 25)
        
        # Atomic update: Increment currentStudentCount only if it is less than max_students
        query = {
            "facultyName": faculty_name, 
            "courseName": course_name, 
            "currentStudentCount": {"$lt": max_students}
        }
        update_result = mentors_collection.update_one(query, {"$inc": {"currentStudentCount": 1}})

        if update_result.modified_count == 0:
            logging.error(f"Failed to reserve spot. Query: {query}")
            # Check if it was because it's full or because it doesn't exist (already checked existence)
            # So it must be full.
            current_mentor = mentors_collection.find_one({"facultyName": faculty_name, "courseName": course_name})
            if current_mentor:
                curr = current_mentor.get("currentStudentCount")
                logging.error(f"Current Mentor State: Count={curr}, Max={max_students}")
                
            if current_mentor and current_mentor.get("currentStudentCount", 0) >= max_students:
                 return make_response("Faculty is full", 400)
            else:
                 # Should not happen unless concurrent delete
                 return make_response(f"Error reserving spot. Debug: Count={current_mentor.get('currentStudentCount')} Max={max_students}", 500)

        try:
            students_collection.insert_one({
                "studentName": student_name,
                "regNo": reg_no,
                "year": year,
                "emailId": email_id,
                "courseName": course_name,
                "duration": duration,
                "instructorName": instructor_name,
                "facultyName": faculty_name,
                "paymentStatus": "Pending", # New Field
                "paymentScreenshot": payment_screenshot_path, # New Field
                "createdAt": datetime.datetime.utcnow()
            })
        except DuplicateKeyError as e:
            # Rollback reservation
            mentors_collection.update_one(
                {"facultyName": faculty_name, "courseName": course_name},
                {"$inc": {"currentStudentCount": -1}}
            )
            if "emailId" in str(e):
                 return make_response("Student already enrolled (Email exists)", 409)
            if "regNo" in str(e):
                 return make_response("Student already enrolled (RegNo exists)", 409)
            return make_response("Student already enrolled", 409)
        except Exception as e:
            # Rollback reservation
            mentors_collection.update_one(
                {"facultyName": faculty_name, "courseName": course_name},
                {"$inc": {"currentStudentCount": -1}}
            )
            raise e
        
        # Determine valid recipients
        recipients = [email_id]
        if is_email_valid(app.config['MAIL_USERNAME']):
             recipients.append(app.config['MAIL_USERNAME']) # Admin copy

        # Send Confirmation Email
        try:
            msg = Message(
                "Enrollment Received - Payment Verification Pending",
                sender=app.config['MAIL_DEFAULT_SENDER'],
                recipients=recipients
            )
            msg.body = f"Dear {student_name},\n\nYour enrollment for {course_name} has been received. Your payment screenshot is under verification.\n\nYou will be notified once valid.\n\nRegards,\nAdmin"
            mail.send(msg)
        except Exception as e:
            logging.error(f"Failed to send enrollment email: {e}")

        return make_response("Enrollment submitted. Pending Payment Verification.", 201)
    except Exception as e:
        logging.error("Error in enroll_student", exc_info=True)
        return make_response(f"An error occurred: {str(e)}", 500)

# --- ADMIN PAYMENT ROUTES ---

@app.route('/api/admin/pending-payments', methods=['GET'])
def get_pending_payments():
    try:
        # Fetch students with Pending status
        pending_students = list(students_collection.find({"paymentStatus": "Pending"}, {"_id": 0}))
        return jsonify(pending_students), 200
    except Exception as e:
        logging.error(f"Error fetching pending payments: {e}")
        return make_response("Internal Server Error", 500)

@app.route('/api/admin/verify-payment', methods=['POST'])
def verify_payment():
    try:
        data = request.get_json()
        reg_no = data.get("regNo")
        action = data.get("action") # "Approve" (or "Verified") or "Reject"
        
        if not reg_no or not action:
            return make_response("Registration Number and Action are required", 400)

        student = students_collection.find_one({"regNo": reg_no})
        if not student:
            return make_response("Student not found", 404)

        if action.lower() in ["approve", "verified"]:
            new_status = "Verified"
            email_subject = "Enrollment Confirmed - Payment Verified"
            email_body = f"Dear {student.get('studentName')},\n\nYour payment has been verified. You are officially enrolled in {student.get('courseName')}.\n\nRegards,\nAdmin"
        elif action.lower() in ["reject", "rejected"]:
            new_status = "Rejected"
            email_subject = "Enrollment Update - Payment Rejected"
            email_body = f"Dear {student.get('studentName')},\n\nYour payment screenshot was rejected. Please contact the department.\n\nRegards,\nAdmin"
        else:
            return make_response("Invalid action", 400)

        students_collection.update_one(
            {"regNo": reg_no},
            {"$set": {"paymentStatus": new_status, "updatedAt": datetime.datetime.utcnow()}}
        )

        # Send Email Notification
        if is_email_valid(student.get('emailId')):
            try:
                msg = Message(
                    email_subject,
                    sender=app.config['MAIL_DEFAULT_SENDER'],
                    recipients=[student.get('emailId')]
                )
                msg.body = email_body
                mail.send(msg)
            except Exception as e:
                logging.error(f"Failed to send verification email: {e}")

        return make_response(f"Payment status updated to {new_status}", 200)

    except Exception as e:
        logging.error(f"Error verifying payment: {e}")
        return make_response("Internal Server Error", 500)

@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    message = data.get('message', '').lower()
    
    response = "I'm still learning, but I can help you with enrollment!"
    if "hello" in message or "hi" in message:
        response = "Hello! How can I assist you today? (Desu~)"
    elif "enroll" in message:
        response = "You can enroll by clicking the 'Students' tab!"
    elif "faculty" in message:
        response = "You can view available faculties in the 'Mentors' tab."
    elif "limit" in message:
        response = "Each faculty can take up to 25 students."
    
    return jsonify({"response": response}), 200

@app.route('/get-courses', methods=['GET'])
def get_courses():
    try:
        file_path = "d:\\github projects\\nptel\\list\\Final Course List (Jan - Apr 2026).xlsx"
        # Read Excel, skipping first 10 rows (header at row 10 in 0-index)
        df = pd.read_excel(file_path, header=10)
        
        courses = []
        seen = set()
        
        for index, row in df.iterrows():
            course_name = str(row.get('Course Name', '')).strip()
            # SME Name is the Instructor
            instructor = str(row.get('SME Name', '')).strip()
            duration = str(row.get('Duration', '')).replace('Weeks', 'weeks').strip()
            
            # Basic validation
            if course_name and course_name.lower() != 'nan' and course_name not in seen:
                courses.append({
                    "courseName": course_name,
                    "instructorName": instructor if instructor.lower() != 'nan' else "",
                    "duration": duration if duration.lower() != 'nan' else ""
                })
                seen.add(course_name)
                
        return jsonify({"courses": courses}), 200
    except Exception as e:
        logging.error(f"Error fetching courses: {e}")
        return jsonify({"message": "Error fetching course list"}), 500

if __name__ == "__main__":
    init_db()
    sync_mentor_counts()
    app.run(debug=app.config['DEBUG'])