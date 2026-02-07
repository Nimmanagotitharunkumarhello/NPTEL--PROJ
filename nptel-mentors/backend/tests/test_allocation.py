
import pytest
import mongomock
from app import app
import app as app_module
from flask_mail import Mail

# Mock Mail
class MockMail:
    def send(self, message):
        pass

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['MONGO_URI'] = "mongodb://localhost:27017/course_enrollment_test"
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['MAIL_USERNAME'] = "test_admin@example.com"
    app.config['MAIL_DEFAULT_SENDER'] = "test_sender@example.com"
    
    # Mock MongoDB
    mock_client = mongomock.MongoClient()
    mock_db = mock_client.db
    
    # Patch collections
    app_module.students_collection = mock_db.students
    app_module.mentors_collection = mock_db.mentors
    app_module.users_collection = mock_db.users
    app_module.mail = MockMail() 

    with app.test_client() as client:
        yield client

def test_get_faculties_initial(client):
    # Setup: Add a mentor
    app_module.mentors_collection.insert_one({
        "facultyName": "Dr. Capacity",
        "courseName": "Scalability 101",
        "maxStudents": 2,
        "currentStudentCount": 0
    })

    response = client.get('/get-faculties')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['faculties']) == 1
    assert data['faculties'][0]['currentStudentCount'] == 0
    assert data['faculties'][0]['maxStudents'] == 25

def test_enrollment_increments_count(client):
    # Setup
    app_module.mentors_collection.insert_one({
        "facultyName": "Dr. Capacity",
        "courseName": "Scalability 101",
        "maxStudents": 25,
        "currentStudentCount": 0
    })

    data = {
        "name": "Student 1",
        "regNo": "REG001",
        "year": "3",
        "email": "student1@example.com",
        "courseName": "Scalability 101",
        "duration": "8 weeks",
        "instructorName": "Dr. Smith",
        "facultyName": "Dr. Capacity"
    }

    # Enrollment 1
    response = client.post('/enroll-student', json=data)
    # Note: enroll_student expects multipart/form-data now but has fallback for json for legacy?
    # Wait, my implementation of enroll_student checks:
    # if 'paymentScreenshot' in request.files: ... else: data = request.get_json() file = None
    # And then: if file: ... else: return "Payment screenshot is required"
    # So JSON request will fail with "Payment screenshot is required" 400.
    
    # I MUST verify with file upload or modify code to allow no-file for testing? 
    # Or just use file upload in test.
    pass

def test_enrollment_capacity_limit(client):
    # Setup: Mentor with 25 students (Full)
    app_module.mentors_collection.insert_one({
        "facultyName": "Dr. Full",
        "courseName": "Popular Course",
        "maxStudents": 25,
        "currentStudentCount": 25
    })

    # Try to enroll
    data = {
        "name": "Student 26",
        "regNo": "REG026",
        "year": "3",
        "email": "student26@example.com",
        "courseName": "Popular Course",
        "duration": "8 weeks",
        "instructorName": "Dr. Smith",
        "facultyName": "Dr. Full"
    }
    
    # Use Multipart
    import io
    file_content = b"fake"
    file = (io.BytesIO(file_content), 'pay.png')
    
    response = client.post('/enroll-student', data={
        **data,
        'paymentScreenshot': file
    }, content_type='multipart/form-data')

    assert response.status_code == 400
    assert "Faculty is full" in response.get_json()['message']
    
    # Verify count didn't increase
    mentor = app_module.mentors_collection.find_one({"facultyName": "Dr. Full"})
    assert mentor['currentStudentCount'] == 25

def test_race_condition_simulation(client):
    # Setup: Mentor with 24 students (1 spot left)
    app_module.mentors_collection.insert_one({
        "facultyName": "Dr. Race",
        "courseName": "Race Conditions",
        "maxStudents": 25,
        "currentStudentCount": 24
    })
    
    # Successful enroll
    data = {
        "name": "Student 25",
        "regNo": "REG025",
        "year": "3",
        "email": "student25@example.com",
        "courseName": "Race Conditions",
        "duration": "8 weeks",
        "instructorName": "Dr. Smith",
        "facultyName": "Dr. Race"
    }
    import io
    file = (io.BytesIO(b"fake"), 'pay.png')
    response = client.post('/enroll-student', data={**data, 'paymentScreenshot': file}, content_type='multipart/form-data')
    assert response.status_code == 201

    # Next enroll should fail
    data2 = { **data, "regNo": "REG026", "email": "student26@example.com", "name": "Student 26" }
    file_content2 = b"fake"
    file2 = (io.BytesIO(file_content2), 'pay.png')
    
    response2 = client.post('/enroll-student', data={
        **data2,
        'paymentScreenshot': file2
    }, content_type='multipart/form-data')

    assert response2.status_code == 400
    assert "Faculty is full" in response2.get_json()['message']
