"""Registration routes."""
from flask import Blueprint, request, jsonify
from marshmallow import Schema, fields, ValidationError
from app.middleware.auth import require_auth, require_role
from app.services import registration_service, user_service

bp = Blueprint('registrations', __name__, url_prefix='/api')


class PublicRegistrationSchema(Schema):
    """Schema for public event registration."""
    attendee_name = fields.Str(required=True)
    attendee_email = fields.Email(required=True)


class RegistrationStatusSchema(Schema):
    """Schema for updating registration status."""
    status = fields.Str(required=True)


@bp.route('/events/<event_id>/register', methods=['POST'])
def register_for_event_public(event_id):
    """Register for an event by UUID (public - no auth required)."""
    try:
        schema = PublicRegistrationSchema()
        args = schema.load(request.json)
        
        from app.models import get_db
        db = get_db()
        
        registration = registration_service.register_attendee_public_by_id_service(
            db=db,
            event_id=event_id,
            attendee_name=args['attendee_name'],
            attendee_email=args['attendee_email'],
        )
        
        return jsonify(registration), 201
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        error_msg = str(e)
        # Domain rule violations return 422
        if "cancelled" in error_msg or "past" in error_msg or "capacity" in error_msg or "already" in error_msg or "draft" in error_msg:
            return jsonify({"error": error_msg}), 422
        return jsonify({"error": error_msg}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/events/<event_id>/register', methods=['DELETE'])
@require_auth
@require_role('attendee')
def cancel_registration(event_id):
    """Cancel own registration."""
    try:
        from app.models import get_db
        db = get_db()
        
        # Get current registration
        from app.models import queries
        registration = queries.get_attendee_registration(db, event_id, request.user['id'])
        
        if not registration:
            return jsonify({"error": "Registration not found"}), 404
        
        cancelled = registration_service.cancel_registration_service(
            db=db,
            attendee_id=request.user['id'],
            registration_id=registration['id'],
        )
        
        return jsonify(cancelled), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/attendee/registrations', methods=['GET'])
@require_auth
@require_role('attendee')
def list_attendee_registrations():
    """List attendee's own registrations."""
    try:
        from app.models import get_db
        db = get_db()
        
        registrations = registration_service.get_attendee_registrations_service(
            db=db,
            attendee_id=request.user['id'],
        )
        
        return jsonify(registrations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/organizer/events/<event_id>/registrations', methods=['GET'])
@require_auth
@require_role('organizer')
def list_event_registrations(event_id):
    """List registrations for an event with search and filter."""
    try:
        from app.models import get_db
        db = get_db()
        
        status = request.args.get('status')
        search = request.args.get('search')
        
        registrations = registration_service.get_event_registrations_service(
            db=db,
            organizer_id=request.user['id'],
            event_id=event_id,
            status=status,
            search=search,
        )
        
        return jsonify(registrations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/organizer/registrations/<registration_id>/status', methods=['PATCH'])
@require_auth
@require_role('organizer')
def update_registration_status(registration_id):
    """Update registration status (approve/reject/revoke)."""
    try:
        schema = RegistrationStatusSchema()
        args = schema.load(request.json)
        
        from app.models import get_db
        db = get_db()
        
        result = registration_service.update_registration_status_service(
            db=db,
            organizer_id=request.user['id'],
            registration_id=registration_id,
            new_status=args['status']
        )
        
        return jsonify(result), 200
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500
