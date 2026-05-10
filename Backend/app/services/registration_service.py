"""Registration business logic and domain rules."""
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

from app.models import queries


def register_attendee_service(
    db,
    attendee_id: str,
    event_id: str,
) -> Dict[str, Any]:
    """Register an attendee for an event (auth-based).
    
    Enforces domain rules:
    - Rule 1: Event must be published (not draft or cancelled)
    - Rule 2: Event start_datetime must be in the future
    - Rule 3: Active registration count must be < event capacity
    - Rule 4: (attendee_id, event_id) pair must not already exist
    """
    event = queries.get_event_by_id(db, event_id)
    
    if not event:
        raise ValueError("Event not found")
    
    # Rule 1: Event must be published
    if event['status'] == 'draft':
        raise ValueError("Event is not available for registration")
    if event['status'] == 'cancelled':
        raise ValueError("Cannot register for a cancelled event")
    
    # Rule 2: Event must be in the future
    if event['start_datetime'] < datetime.now(event['start_datetime'].tzinfo):
        raise ValueError("Cannot register for a past event")
    
    # Rule 4: Check if already registered
    existing = queries.get_attendee_registration(db, event_id, attendee_id)
    if existing:
        raise ValueError("You are already registered for this event")
    
    # Rule 3: Check capacity - only count registered + approved
    active_count = queries.count_active_registrations(db, event_id)
    if active_count >= event['capacity']:
        raise ValueError("Event is at full capacity")
    
    # Set status based on registration mode
    status = 'registered' if event['registration_mode'] == 'open' else 'pending'
    
    # Create registration
    registration = queries.create_registration(
        db,
        event_id=event_id,
        attendee_id=attendee_id,
        status=status,
    )
    
    # Fetch attendee email for email notification
    from app.models import queries as q
    attendee = q.get_user_by_id(db, attendee_id)
    
    # Trigger email (fire and forget)
    if status == 'registered' and attendee:
        try:
            from app.extensions.email import send_registration_confirmed
            send_registration_confirmed(attendee_email=attendee['email'], attendee_name=attendee.get('name', 'Attendee'), event=event)
        except Exception as e:
            logger.error(f"[email] Failed to send registration confirmed: {e}")
    elif status == 'pending' and attendee:
        try:
            from app.extensions.email import send_application_received
            send_application_received(attendee_email=attendee['email'], attendee_name=attendee.get('name', 'Attendee'), event=event)
        except Exception as e:
            logger.error(f"[email] Failed to send application received: {e}")
    
    return registration


VALID_TRANSITIONS = {
    'pending': ['approved', 'rejected'],
    'approved': ['revoked', 'rejected'],
    'registered': ['revoked', 'rejected'],
    'rejected': ['approved'],
    'revoked': ['approved'],
}

def register_attendee_public_by_id_service(
    db,
    event_id: str,
    attendee_name: str,
    attendee_email: str,
) -> Dict[str, Any]:
    """Register an attendee for an event via public registration by event ID (no auth required)."""
    from app.models import queries as q
    
    event = q.get_event_by_id(db, event_id)
    if not event:
        raise ValueError("Event not found")
    
    if event['status'] != 'published':
        raise ValueError("Registration for this event is closed")
    
    if event['start_datetime'] < datetime.now(event['start_datetime'].tzinfo):
        raise ValueError("Registration for this event has closed (event already started)")
    
    # Check for duplicate
    existing = q.get_registration_by_email(db, event['id'], attendee_email)
    if existing:
        raise ValueError("This email is already registered for this event")
    
    # Check capacity
    active_count = q.count_active_registrations(db, event['id'])
    if active_count >= event['capacity']:
        raise ValueError("This event is now full")
    
    # Set status based on registration mode
    status = 'registered' if event['registration_mode'] == 'open' else 'pending'
    
    # Create registration
    registration = q.create_registration_public(
        db,
        event_id=event['id'],
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        status=status,
    )
    
    # Trigger email
    try:
        from app.extensions.email import send_registration_confirmed, send_application_received
        print(f"DEBUG: Registration created with status '{status}'. Triggering email notification...")
        if status == 'registered':
            send_registration_confirmed(attendee_email, attendee_name, event)
        else:
            send_application_received(attendee_email, attendee_name, event)
        print(f"DEBUG: Email notification triggered for {attendee_email}")
    except Exception as e:
        print(f"DEBUG: Failed to trigger email notification: {str(e)}")
        logger.error(f"[registration_service] Email error: {e}")
        
    return registration


def cancel_registration_service(
    db,
    attendee_id: str,
    registration_id: str,
) -> Dict[str, Any]:
    """Cancel a registration.
    
    Allows cancellation of pending or confirmed registrations.
    """
    registration = queries.get_registration_by_id(db, registration_id)
    
    if not registration:
        raise ValueError("Registration not found")
    
    # Check ownership
    if registration['attendee_id'] != attendee_id:
        raise PermissionError("You can only cancel your own registrations")
    
    # Can only cancel pending or confirmed
    if registration['status'] not in ['pending', 'confirmed']:
        raise ValueError(f"Cannot cancel a {registration['status']} registration")
    
    # Update to revoked (for confirmed) or rejected (for pending)
    new_status = 'rejected' if registration['status'] == 'pending' else 'revoked'
    cancelled = queries.update_registration(db, registration_id, new_status)
    
    return cancelled


def get_attendee_registrations_service(db, attendee_id: str) -> List[Dict[str, Any]]:
    """Get all registrations for an attendee."""
    return queries.get_attendee_registrations(db, attendee_id)


def get_event_registrations_service(
    db,
    organizer_id: str,
    event_id: str,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Get registrations for an event with search and filter."""
    event = queries.get_event_by_id(db, event_id)
    if not event:
        raise ValueError("Event not found")
    
    if str(event['organizer_id']) != str(organizer_id):
        print(f"DEBUG: Ownership mismatch! Event organizer: {event['organizer_id']}, Current user: {organizer_id}")
        raise PermissionError("You can only view registrations for your own events")
    
    return queries.get_event_registrations(db, event_id, status, search)


def update_registration_status_service(
    db,
    organizer_id: str,
    registration_id: str,
    new_status: str,
) -> Dict[str, Any]:
    """Update registration status (approve/reject/revoke)."""
    registration = queries.get_registration_by_id(db, registration_id)
    if not registration:
        raise ValueError("Registration not found")
    
    event = queries.get_event_by_id(db, registration['event_id'])
    if event['organizer_id'] != organizer_id:
        raise PermissionError("Unauthorized")
        
    current_status = registration['status']
    if new_status not in VALID_TRANSITIONS.get(current_status, []):
        raise ValueError(f"Invalid status transition from {current_status} to {new_status}")
    
    if new_status == 'approved':
        # Re-check capacity
        active_count = queries.count_active_registrations(db, event['id'])
        if active_count >= event['capacity']:
            raise ValueError("Event is at capacity")
            
    # Update
    updated = queries.update_registration(db, registration_id, new_status)
    
    # Notify
    try:
        from app.extensions.email import (
            send_registration_approved, 
            send_registration_rejected, 
            send_registration_revoked
        )
        email = updated['attendee_email']
        name = updated['attendee_name']
        print(f"DEBUG: Triggering notification for {email} (status: {new_status})")
        if new_status == 'approved':
            send_registration_approved(email, name, event)
        elif new_status == 'rejected':
            send_registration_rejected(email, name, event)
        elif new_status == 'revoked':
            send_registration_revoked(email, name, event)
    except Exception as e:
        print(f"DEBUG: Notification trigger failed: {e}")
        logger.error(f"Notification failed: {e}")
        
    return updated
