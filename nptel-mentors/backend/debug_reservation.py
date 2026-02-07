
from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client['course_enrollment']
    mentors_collection = db['mentors']

    faculty_name = "yash"
    course_name = "programming in java"

    print(f"--- Debugging Reservation for {faculty_name} ({course_name}) ---")

    # 1. Fetch current authentic state
    mentor = mentors_collection.find_one({"facultyName": faculty_name, "courseName": course_name})
    if not mentor:
        print("CRITICAL: Mentor not found!")
    else:
        print(f"Mentor Found: {mentor}")
        cur = mentor.get('currentStudentCount')
        mx = mentor.get('maxStudents')
        print(f"currentStudentCount: {cur} (Type: {type(cur)})")
        print(f"maxStudents: {mx} (Type: {type(mx)})")

        # 2. Simulate the Update Logic
        max_students = mx if mx is not None else 25
        print(f"Attempting update with existing max_students: {max_students}")

        query = {
            "facultyName": faculty_name, 
            "courseName": course_name, 
            "currentStudentCount": {"$lt": max_students}
        }
        print(f"Query: {query}")

        # Dry run find to see if query matches
        match = mentors_collection.find_one(query)
        if match:
            print("MATCH FOUND! The update query SHOULD work.")
        else:
            print("NO MATCH FOUND! The update query will FAIL.")
            # Why?
            if cur is None: print(" - Reason: currentStudentCount is None")
            elif not (cur < max_students): print(f" - Reason: {cur} is not < {max_students}")
            else: print(" - Reason: Unknown filter mismatch.")

except Exception as e:
    print(f"Error: {e}")
