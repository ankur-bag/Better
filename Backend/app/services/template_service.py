"""Event templates for quick event creation."""
from typing import Dict, Any

TEMPLATES: Dict[str, Dict[str, Any]] = {
    "tech_meetup": {
        "name": "Tech Meetup",
        "description": "Connect with tech enthusiasts and discuss the latest innovations.",
        "title": "Tech Meetup",
        "template_description": "A casual gathering for tech professionals and enthusiasts to network and share ideas.",
        "location": "TBD - To be confirmed",
        "capacity": 50,
        "registration_mode": "open",
        "icon": "💻",
    },
    "webinar": {
        "name": "Webinar",
        "description": "Host an online educational session with live Q&A.",
        "title": "Professional Webinar",
        "template_description": "Engage an audience with an informative webinar including interactive features and Q&A.",
        "location": "Online",
        "capacity": 500,
        "registration_mode": "shortlist",
        "icon": "🎥",
    },
    "workshop": {
        "name": "Workshop",
        "description": "Conduct a hands-on learning session for skill development.",
        "title": "Skills Workshop",
        "template_description": "An interactive workshop where participants learn and practice new skills in a structured environment.",
        "location": "TBD - To be confirmed",
        "capacity": 30,
        "registration_mode": "shortlist",
        "icon": "🛠️",
    },
    "networking_event": {
        "name": "Networking Event",
        "description": "Bring professionals together to build connections.",
        "title": "Professional Networking Event",
        "template_description": "A social event designed to facilitate meaningful connections between professionals and potential collaborators.",
        "location": "TBD - To be confirmed",
        "capacity": 100,
        "registration_mode": "open",
        "icon": "🤝",
    },
}


def get_all_templates() -> Dict[str, Dict[str, Any]]:
    """Get all available event templates."""
    return TEMPLATES


def get_template(template_id: str) -> Dict[str, Any] | None:
    """Get a specific template by ID."""
    return TEMPLATES.get(template_id)


def apply_template(template_id: str, overrides: Dict[str, Any] = None) -> Dict[str, Any]:
    """Apply a template and return the event data with optional overrides."""
    template = get_template(template_id)
    if not template:
        return None
    
    result = {
        "title": template["title"],
        "description": template["template_description"],
        "location": template["location"],
        "capacity": template["capacity"],
        "registration_mode": template["registration_mode"],
    }
    
    if overrides:
        result.update(overrides)
    
    return result
