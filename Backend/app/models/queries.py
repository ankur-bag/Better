"""Database query helpers for events, registrations, and users."""
import uuid
import re
import random
import string
from datetime import datetime
from typing import Optional, List, Dict, Any


def generate_slug(title: str) -> str:
    """Generate a unique slug from title."""
    base = re.sub(r'[^a-z0-9\s-]', '', title.lower()).strip()
    base = re.sub(r'\s+', '-', base)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base}-{suffix}"


def create_user(db, user_id: str, email: str, role: str) -> Dict[str, Any]:
    """Create a new user record."""
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (id, email, role, created_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role
            RETURNING id, email, role, created_at
        """, (user_id, email, role))
        return dict(cursor.fetchone() or {})


def get_user_by_id(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("SELECT id, email, role, created_at FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def create_event(
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
    """Create a new event."""
    event_id = str(uuid.uuid4())
    slug = generate_slug(title)
    
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO events 
            (id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'published', %s, NOW())
            RETURNING id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at
        """, (event_id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, slug))
        return dict(cursor.fetchone())


def get_event_by_id(db, event_id: str) -> Optional[Dict[str, Any]]:
    """Get event by ID."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at
            FROM events WHERE id = %s
        """, (event_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_event_by_slug(db, slug: str) -> Optional[Dict[str, Any]]:
    """Get event by slug (for public event pages)."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at
            FROM events WHERE slug = %s
        """, (slug,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_all_published_events(db) -> List[Dict[str, Any]]:
    """Get all published upcoming events."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at
            FROM events 
            WHERE status = 'published' AND start_datetime > NOW()
            ORDER BY start_datetime ASC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_organizer_events(db, organizer_id: str) -> List[Dict[str, Any]]:
    """Get all events for an organizer."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at
            FROM events 
            WHERE organizer_id = %s
            ORDER BY start_datetime ASC
        """, (organizer_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def update_event(db, event_id: str, **kwargs) -> Dict[str, Any]:
    """Update event fields."""
    allowed_fields = ['title', 'description', 'location', 'capacity', 'status']
    updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
    
    if not updates:
        return get_event_by_id(db, event_id)
    
    set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
    values = list(updates.values()) + [event_id]
    
    with db.get_cursor() as cursor:
        cursor.execute(f"""
            UPDATE events SET {set_clause} WHERE id = %s
            RETURNING id, organizer_id, title, description, location, start_datetime, end_datetime, capacity, registration_mode, status, slug, created_at
        """, values)
        return dict(cursor.fetchone())


def delete_event(db, event_id: str) -> Dict[str, Any]:
    """Hard delete an event (draft only)."""
    # Get event before deletion to return it
    event = get_event_by_id(db, event_id)
    
    if not event:
        raise ValueError("Event not found")
    
    with db.get_cursor() as cursor:
        cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
    
    return event


def count_confirmed_registrations(db, event_id: str) -> int:
    """Count confirmed registrations for an event (legacy - uses 'confirmed' status)."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT COUNT(*) as count FROM registrations 
            WHERE event_id = %s AND status = 'confirmed'
        """, (event_id,))
        row = cursor.fetchone()
        return row['count'] if row else 0


def count_active_registrations(db, event_id: str) -> int:
    """Count active registrations for an event (registered + approved only)."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT COUNT(*) as count FROM registrations 
            WHERE event_id = %s AND status IN ('registered', 'approved')
        """, (event_id,))
        row = cursor.fetchone()
        return row['count'] if row else 0


def create_registration(db, event_id: str, attendee_id: str, status: str = 'pending') -> Dict[str, Any]:
    """Create a new registration (old auth-based registrations)."""
    registration_id = str(uuid.uuid4())
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO registrations (id, event_id, attendee_id, status, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            RETURNING id, event_id, attendee_id, status, created_at
        """, (registration_id, event_id, attendee_id, status))
        return dict(cursor.fetchone())


def create_registration_public(db, event_id: str, attendee_name: str, attendee_email: str, status: str = 'pending') -> Dict[str, Any]:
    """Create a new registration for public attendees (name + email based)."""
    registration_id = str(uuid.uuid4())
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO registrations (id, event_id, attendee_name, attendee_email, status, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id, event_id, attendee_name, attendee_email, status, created_at
        """, (registration_id, event_id, attendee_name, attendee_email, status))
        return dict(cursor.fetchone())


def get_registration_by_id(db, registration_id: str) -> Optional[Dict[str, Any]]:
    """Get registration by ID."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, event_id, attendee_id, status, created_at FROM registrations WHERE id = %s
        """, (registration_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_attendee_registration(db, event_id: str, attendee_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific attendee's registration for an event."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, event_id, attendee_id, status, created_at FROM registrations 
            WHERE event_id = %s AND attendee_id = %s
        """, (event_id, attendee_id))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_registration_by_email(db, event_id: str, attendee_email: str) -> Optional[Dict[str, Any]]:
    """Get a registration by event ID and attendee email (public registrations)."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT id, event_id, attendee_name, attendee_email, status, created_at FROM registrations 
            WHERE event_id = %s AND attendee_email = %s
        """, (event_id, attendee_email))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_attendee_registrations(db, attendee_id: str) -> List[Dict[str, Any]]:
    """Get all registrations for an attendee."""
    with db.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT r.id, r.event_id, r.attendee_id, r.status, r.created_at,
                   e.title, e.location, e.start_datetime, e.end_datetime
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.attendee_id = %s
            ORDER BY r.created_at DESC
        """, (attendee_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_event_registrations(db, event_id: str, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all registrations for an event, optionally filtered by status and search."""
    with db.get_cursor(commit=False) as cursor:
        query = """
            SELECT r.id, r.event_id, r.attendee_id, r.attendee_name, r.attendee_email, r.status, r.created_at
            FROM registrations r
            WHERE r.event_id = %s
        """
        params = [event_id]
        
        if status:
            query += " AND r.status = %s"
            params.append(status)
            
        if search:
            query += " AND (r.attendee_name ILIKE %s OR r.attendee_email ILIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
            
        query += " ORDER BY r.created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def update_registration(db, registration_id: str, status: str) -> Dict[str, Any]:
    """Update registration status."""
    with db.get_cursor() as cursor:
        cursor.execute("""
            UPDATE registrations SET status = %s, updated_at = NOW() WHERE id = %s
            RETURNING id, event_id, attendee_id, attendee_name, attendee_email, status, created_at, updated_at
        """, (status, registration_id))
        return dict(cursor.fetchone())


def get_organizer_stats(db, organizer_id: str) -> Dict[str, Any]:
    """Get statistics for an organizer's dashboard."""
    with db.get_cursor(commit=False) as cursor:
        # Total Events
        cursor.execute("SELECT COUNT(*) as count FROM events WHERE organizer_id = %s", (organizer_id,))
        total_events = cursor.fetchone()['count']
        
        # Total Attendees (registered or approved)
        cursor.execute("""
            SELECT COUNT(*) as count FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE e.organizer_id = %s AND r.status IN ('registered', 'approved')
        """, (organizer_id,))
        total_attendees = cursor.fetchone()['count']
        
        # Active Events (published and end_datetime > NOW())
        cursor.execute("""
            SELECT COUNT(*) as count FROM events 
            WHERE organizer_id = %s AND status = 'published' AND end_datetime > NOW()
        """, (organizer_id,))
        active_events = cursor.fetchone()['count']
        
        return {
            "total_events": total_events,
            "total_attendees": total_attendees,
            "active_events": active_events
        }
