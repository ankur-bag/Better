"""User business logic."""
from typing import Dict, Any
from app.models import queries


def get_or_create_user_service(db, user_id: str, email: str, role: str) -> Dict[str, Any]:
    """Get or create a user record.
    
    Used during authentication to ensure user exists in database.
    """
    user = queries.get_user_by_id(db, user_id)
    
    if user:
        # Update email and role if changed
        if user['email'] != email or user['role'] != role:
            user = queries.create_user(db, user_id, email, role)
        return user
    
    # Create new user
    return queries.create_user(db, user_id, email, role)


def get_user_service(db, user_id: str) -> Dict[str, Any]:
    """Get user by ID."""
    user = queries.get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    return user
