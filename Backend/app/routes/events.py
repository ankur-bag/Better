"""Event routes."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from marshmallow import Schema, fields, ValidationError
from app.middleware.auth import require_auth, require_role
from app.services import event_service
from app.models import queries

bp = Blueprint('events', __name__, url_prefix='/api/events')


class CreateEventSchema(Schema):
    """Schema for creating an event."""
    title = fields.Str(required=True)
    description = fields.Str(required=False, allow_none=True)
    location = fields.Str(required=True)
    start_datetime = fields.DateTime(required=True)
    end_datetime = fields.DateTime(required=True)
    capacity = fields.Int(required=True)
    registration_mode = fields.Str(required=True)


class UpdateEventSchema(Schema):
    """Schema for updating an event."""
    title = fields.Str(required=False)
    description = fields.Str(required=False)
    location = fields.Str(required=False)
    capacity = fields.Int(required=False)


@bp.route('', methods=['GET'])
def list_events():
    """List all published upcoming events."""
    try:
        from app.models import get_db
        db = get_db()
        events = event_service.list_published_events_service(db)
        return jsonify(events), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/<event_id>', methods=['GET'])
def get_event_public(event_id):
    """Get public event detail by ID."""
    try:
        from app.models import get_db, queries
        db = get_db()
        event = queries.get_event_by_id(db, event_id)
        
        if not event:
            return jsonify({"error": "Event not found"}), 404
        
        # Add computed status and counts
        active_count = queries.count_active_registrations(db, event['id'])
        remaining_spots = max(0, event['capacity'] - active_count)
        
        public_status = "Open"
        if event['status'] == 'draft':
            public_status = "Draft"
        elif event['status'] == 'cancelled':
            public_status = "Cancelled"
        elif datetime.now(event['start_datetime'].tzinfo) > event['start_datetime']:
            public_status = "Closed"
        elif active_count >= event['capacity']:
            public_status = "Full"
            
        event['active_count'] = active_count
        event['remaining_spots'] = remaining_spots
        event['public_status'] = public_status
        
        return jsonify(event), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('', methods=['POST'])
@require_auth
@require_role('organizer')
def create_event():
    """Create a new event."""
    try:
        schema = CreateEventSchema()
        args = schema.load(request.json)
        
        from app.models import get_db
        db = get_db()
        
        event = event_service.create_event_service(
            db=db,
            organizer_id=request.user['id'],
            title=args['title'],
            description=args.get('description'),
            location=args['location'],
            start_datetime=args['start_datetime'],
            end_datetime=args['end_datetime'],
            capacity=args['capacity'],
            registration_mode=args['registration_mode'],
        )
        
        return jsonify(event), 201
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/<event_id>', methods=['PATCH'])
@require_auth
@require_role('organizer')
def update_event(event_id):
    """Edit an event."""
    try:
        schema = UpdateEventSchema()
        args = schema.load(request.json)
        
        from app.models import get_db
        db = get_db()
        
        event = event_service.edit_event_service(
            db=db,
            organizer_id=request.user['id'],
            event_id=event_id,
            title=args.get('title'),
            description=args.get('description'),
            location=args.get('location'),
            capacity=args.get('capacity'),
        )
        
        return jsonify(event), 200
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        # Check if it's a domain rule violation (422) or other error
        if "Cannot edit" in str(e):
            return jsonify({"error": str(e)}), 422
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/<event_id>', methods=['DELETE'])
@require_auth
@require_role('organizer')
def delete_event(event_id):
    """Delete a draft event."""
    try:
        from app.models import get_db
        db = get_db()
        
        event = event_service.delete_event_service(
            db=db,
            organizer_id=request.user['id'],
            event_id=event_id,
        )
        
        return jsonify(event), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        if "not found" in str(e).lower():
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/<event_id>/publish', methods=['POST'])
@require_auth
@require_role('organizer')
def publish_event(event_id):
    """Publish a draft event."""
    try:
        from app.models import get_db
        db = get_db()
        
        event = event_service.publish_event_service(
            db=db,
            organizer_id=request.user['id'],
            event_id=event_id,
        )
        
        return jsonify(event), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        if "not found" in str(e).lower():
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/<event_id>/cancel', methods=['POST'])
@require_auth
@require_role('organizer')
def cancel_event(event_id):
    """Cancel a published event."""
    try:
        from app.models import get_db
        db = get_db()
        
        event = event_service.cancel_event_service(
            db=db,
            organizer_id=request.user['id'],
            event_id=event_id,
        )
        
        return jsonify(event), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        if "not found" in str(e).lower():
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/organizer/events', methods=['GET'])
@require_auth
@require_role('organizer')
def list_organizer_events():
    """List organizer's own events."""
    try:
        from app.models import get_db
        db = get_db()
        
        events = event_service.list_organizer_events_service(db, request.user['id'])
        return jsonify(events), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/organizer/stats', methods=['GET'])
@require_auth
@require_role('organizer')
def get_organizer_stats():
    """Get dashboard stats for organizer."""
    try:
        from app.models import get_db, queries
        db = get_db()
        
        stats = queries.get_organizer_stats(db, request.user['id'])
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
