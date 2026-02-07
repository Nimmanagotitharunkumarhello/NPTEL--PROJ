
from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client['course_enrollment'] 
    # Note: Check if db name is correct. In debug_db.py we saw 'course_enrollment' as the DB name! 
    # (Step 639 output: "Database: course_enrollment")
    
    mentors_collection = db['mentors']
    students_collection = db['students']

    print("Syncing mentor counts...")
    mentors = list(mentors_collection.find({}))
    for mentor in mentors:
        faculty_name = mentor.get("facultyName")
        course_name = mentor.get("courseName")
        if faculty_name and course_name:
            count = students_collection.count_documents({"facultyName": faculty_name, "courseName": course_name})
            
            # Allow maxStudents to default to 25 if missing
            max_s = mentor.get("maxStudents", 25)
            
            print(f"Updating {faculty_name} - {course_name}: Count={count}, Max={max_s}")
            
            mentors_collection.update_one(
                {"_id": mentor["_id"]},
                {"$set": {
                    "currentStudentCount": count,
                    "maxStudents": max_s
                }}
            )
    print("Sync complete.")

except Exception as e:
    print(f"Error: {e}")
