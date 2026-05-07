"""Pytest configuration and fixtures."""
import pytest
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import Database


@pytest.fixture
def app():
    """Create Flask app for testing."""
    app = create_app('testing')
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def db():
    """Create test database connection."""
    # Use an in-memory SQLite database or a test PostgreSQL database
    # For now, we'll use a test PostgreSQL instance
    db_url = os.getenv('TEST_DATABASE_URL', 'postgresql://postgres:password@localhost:5432/avento_test')
    db = Database(db_url)
    yield db
    db.close()


@pytest.fixture
def organizer_token():
    """Create a mock organizer JWT token."""
    # Mock Clerk JWT token for organizer
    import jwt
    from datetime import datetime, timedelta
    
    payload = {
        'sub': 'org_123456',
        'email': 'organizer@example.com',
        'email_verified': True,
        'public_metadata': {'role': 'organizer'},
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1),
    }
    
    # For testing, we'll use a simple token (in prod, would be signed by Clerk)
    return jwt.encode(payload, 'secret', algorithm='HS256')


@pytest.fixture
def attendee_token():
    """Create a mock attendee JWT token."""
    import jwt
    from datetime import datetime, timedelta
    
    payload = {
        'sub': 'att_123456',
        'email': 'attendee@example.com',
        'email_verified': True,
        'public_metadata': {'role': 'attendee'},
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1),
    }
    
    return jwt.encode(payload, 'secret', algorithm='HS256')
