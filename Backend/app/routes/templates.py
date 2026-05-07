"""Routes for event templates."""
from flask import Blueprint, jsonify
from app.services.template_service import get_all_templates, get_template

templates_bp = Blueprint("templates", __name__, url_prefix="/api/templates")


@templates_bp.route("", methods=["GET"])
def list_templates():
    """List all available event templates."""
    templates = get_all_templates()
    return jsonify({
        "templates": [
            {
                "id": template_id,
                "name": data["name"],
                "description": data["description"],
                "icon": data["icon"],
            }
            for template_id, data in templates.items()
        ]
    }), 200


@templates_bp.route("/<template_id>", methods=["GET"])
def get_template_details(template_id: str):
    """Get details for a specific template."""
    template = get_template(template_id)
    if not template:
        return jsonify({"error": "Template not found"}), 404
    
    return jsonify({
        "id": template_id,
        "name": template["name"],
        "description": template["description"],
        "title": template["title"],
        "template_description": template["template_description"],
        "location": template["location"],
        "capacity": template["capacity"],
        "registration_mode": template["registration_mode"],
        "icon": template["icon"],
    }), 200
