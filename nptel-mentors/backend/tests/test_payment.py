
import pytest
import io
import mongomock
from app import app
import app as app_module # Import module to patch collections
from flask_mail import Mail

# Mock Mail to prevent sending real emails
class MockMail:
    def send(self, message):
        pass

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['MONGO_URI'] = "mongodb://localhost:27017/course_enrollment_test"
    app.config['UPLOAD_FOLDER'] = "tests/uploads"
    app.config['WTF_CSRF_ENABLED'] = False # Disable CSRF for tests
    app.config['MAIL_USERNAME'] = "test_admin@example.com" # Fix for is_email_valid check
    app.config['MAIL_DEFAULT_SENDER'] = "test_sender@example.com"
    
    # Mock MongoDB
    mock_client = mongomock.MongoClient()
    mock_db = mock_client.db
    
    # Patch collections in app module
    app_module.students_collection = mock_db.students
    app_module.mentors_collection = mock_db.mentors
    app_module.users_collection = mock_db.users
    app_module.mail = MockMail() # Patch mail
    
    with app.test_client() as client:
        yield client

def test_enroll_student_with_file(client):
    # Setup: Add a mentor with capacity
    app_module.mentors_collection.insert_one({
        "facultyName": "Dr. Faculty",
        "courseName": "Cloud Computing",
        "maxStudents": 25
    })

    data = {
        "name": "Test Student",
        "regNo": "TEST_REG_999",
        "year": "3",
        "email": "test_student_999@example.com",
        "courseName": "Cloud Computing",
        "duration": "8 weeks",
        "instructorName": "Dr. Smith",
        "facultyName": "Dr. Faculty"
    }

    # Create a dummy file
    file_content = b"fake image content"
    file = (io.BytesIO(file_content), 'test_payment.png')

    response = client.post('/enroll-student', data={
        **data,
        'paymentScreenshot': file
    }, content_type='multipart/form-data')

    # Assert success
    assert response.status_code == 201
    assert "Enrollment submitted" in response.get_json()['message']

    # Verify DB insertion in mock
    student = app_module.students_collection.find_one({"regNo": "TEST_REG_999"})
    assert student is not None
    assert student['paymentStatus'] == 'Pending'
    # Filename might be modified by secure_filename, check endswith
    assert student['paymentScreenshot'].endswith('test_payment.png')

def test_admin_verify_payment(client):
    # Setup: Insert a student
    app_module.students_collection.insert_one({
        "studentName": "Test Student",
        "regNo": "TEST_REG_999",
        "emailId": "test_student_999@example.com",
        "courseName": "Cloud Computing", # needed for email
        "paymentStatus": "Pending"
    })

    # Test Approve
    response = client.post('/api/admin/verify-payment', json={
        "regNo": "TEST_REG_999",
        "action": "Approve"
    })
    
    assert response.status_code == 200
    
    student = app_module.students_collection.find_one({"regNo": "TEST_REG_999"})
    assert student['paymentStatus'] == 'Verified'

    # Test Reject
    response = client.post('/api/admin/verify-payment', json={
        "regNo": "TEST_REG_999",
        "action": "Reject"
    })
    
    assert response.status_code == 200
    
    student = app_module.students_collection.find_one({"regNo": "TEST_REG_999"})
    assert student['paymentStatus'] == 'Rejected'
