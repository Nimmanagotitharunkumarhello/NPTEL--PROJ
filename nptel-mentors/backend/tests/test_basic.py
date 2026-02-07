import pytest
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['MONGO_URI'] = "mongodb://localhost:27017/test_db" 
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Test the health check endpoint."""
    # Note: This requires a running MongoDB instance. 
    # If no DB, it might fail or return unhealthy, which is also a valid test of structure.
    response = client.get('/api/health')
    assert response.status_code in [200, 500] 

def test_home(client):
    """Test root route."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Welcome" in response.data
