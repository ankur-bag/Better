"""Event business logic and domain rules."""
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.models import queries


def create_event_service(
    db,
    organizer_id: str,
    title: str,
    description: str,
    location: str,
    start_datetime: datetime,
    end_datetime: datetime,
    capacity: int,
    registration_mode: str,
) -> Dict[str, Any]:
    """Create a new event.
    
    Enforces:
    - All fields are valid
    - Capacity is positive
    - end_datetime > start_datetime
    """
    event = queries.create_event(
        db,
        organizer_id=organizer_id,
        title=title,
        description=description,
        location=location,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        capacity=capacity,
        registration_mode=registration_mode,
    )
    return event


def get_event_service(db, event_id: str) -> Optional[Dict[str, Any]]:
    """Get event by ID with remaining capacity."""
    event = queries.get_event_by_id(db, event_id)
    if not event:
        return None
    
    # Add remaining capacity
    confirmed_count = queries.count_confirmed_registrations(db, event_id)
    event['remaining_capacity'] = event['capacity'] - confirmed_count
    event['confirmed_count'] = confirmed_count
    
    return event


def list_published_events_service(db) -> List[Dict[str, Any]]:
    """List all published upcoming events with remaining capacity."""
    events = queries.get_all_published_events(db)
    
    for event in events:
        confirmed_count = queries.count_confirmed_registrations(db, event['id'])
        event['remaining_capacity'] = event['capacity'] - confirmed_count
        event['confirmed_count'] = confirmed_count
    
    return events


def list_organizer_events_service(db, organizer_id: str) -> List[Dict[str, Any]]:
    """List all events for an organizer with registration counts."""
    events = queries.get_organizer_events(db, organizer_id)
    
    for event in events:
        confirmed_count = queries.count_confirmed_registrations(db, event['id'])
        event['remaining_capacity'] = event['capacity'] - confirmed_count
        event['confirmed_count'] = confirmed_count
    
    return events


def edit_event_service(
    db,
    organizer_id: str,
    event_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    capacity: Optional[int] = None,
) -> Dict[str, Any]:
    """Edit an event.
    
    Enforces domain rules:
    - Rule 5: Organizer can only edit their own events
    - Rule 6: Cannot edit a cancelled event
    - Rule 7: Cannot edit an event whose start_datetime has passed
    """
    event = queries.get_event_by_id(db, event_id)
    
    if not event:
        raise ValueError("Event not found")
    
    # Rule 5: Check ownership
    if event['organizer_id'] != organizer_id:
        raise PermissionError("You can only edit your own events")
    
    # Rule 6: Cannot edit cancelled event
    if event['status'] == 'cancelled':
        raise ValueError("Cannot edit a cancelled event")
    
    # Rule 7: Cannot edit past event
    if event['start_datetime'] < datetime.now(event['start_datetime'].tzinfo):
        raise ValueError("Cannot edit an event that has already started")
    
    # Update event
    updates = {}
    if title is not None:
        updates['title'] = title
    if description is not None:
        updates['description'] = description
    if location is not None:
        updates['location'] = location
    if capacity is not None:
        updates['capacity'] = capacity
    
    updated_event = queries.update_event(db, event_id, **updates)
    
    # Add remaining capacity
    confirmed_count = queries.count_confirmed_registrations(db, event_id)
    updated_event['remaining_capacity'] = updated_event['capacity'] - confirmed_count
    updated_event['confirmed_count'] = confirmed_count
    
    return updated_event


def cancel_event_service(db, organizer_id: str, event_id: str) -> Dict[str, Any]:
    """Cancel an event and notify all attendees."""
    event = queries.get_event_by_id(db, event_id)
    if not event:
        raise ValueError("Event not found")
    
    if event['organizer_id'] != organizer_id:
        raise PermissionError("You can only cancel your own events")
    
    # Cancel the event
    cancelled_event = queries.update_event(db, event_id, status='cancelled')
    
    # Notify attendees
    try:
        from app.extensions.email import send_event_cancelled
        registrations = queries.get_event_registrations(db, event_id)
        for reg in registrations:
            if reg['status'] in ['pending', 'registered', 'approved']:
                send_event_cancelled(reg['attendee_email'], reg['attendee_name'], event)
    except Exception as e:
        import logging
        logging.error(f"Failed to notify attendees of cancellation: {e}")
    
    return cancelled_event


def publish_event_service(db, organizer_id: str, event_id: str) -> Dict[str, Any]:
    """Publish a draft event.
    
    Enforces domain rules:
    - Rule 5: Organizer can only publish their own events
    - Rule 9: Cannot publish without all required fields
    """
    event = queries.get_event_by_id(db, event_id)
    
    if not event:
        raise ValueError("Event not found")
    
    # Rule 5: Check ownership
    if event['organizer_id'] != organizer_id:
        raise PermissionError("You can only publish your own events")
    
    # Check if already published or cancelled
    if event['status'] == 'published':
        raise ValueError("Event is already published")
    if event['status'] == 'cancelled':
        raise ValueError("Cannot publish a cancelled event")
    
    # Rule 9: Validate all required fields are present
    required_fields = ['title', 'location', 'start_datetime', 'end_datetime', 'capacity', 'registration_mode']
    missing_fields = [f for f in required_fields if not event.get(f)]
    if missing_fields:
        raise ValueError(f"Cannot publish event with missing fields: {', '.join(missing_fields)}")
    
    # Publish the event
    published_event = queries.update_event(db, event_id, status='published')
    
    # Add remaining capacity
    confirmed_count = queries.count_confirmed_registrations(db, event_id)
    published_event['remaining_capacity'] = published_event['capacity'] - confirmed_count
    published_event['confirmed_count'] = confirmed_count
    
    return published_event


def delete_event_service(db, organizer_id: str, event_id: str) -> Dict[str, Any]:
    """Delete a draft event (hard delete).
    
    Enforces domain rules:
    - Rule 5: Organizer can only delete their own events
    - Rule 10: Cannot delete unless status is 'draft'
    """
    event = queries.get_event_by_id(db, event_id)
    
    if not event:
        raise ValueError("Event not found")
    
    # Rule 5: Check ownership
    if event['organizer_id'] != organizer_id:
        raise PermissionError("You can only delete your own events")
    
    # Rule 10: Can only delete draft events
    if event['status'] != 'draft':
        raise ValueError("Cannot delete a published or cancelled event")
    
    # Hard delete the event
    deleted_event = queries.delete_event(db, event_id)
    return deleted_event
