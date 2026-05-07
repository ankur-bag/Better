"""Email notifications using Resend."""
import logging
from typing import Dict, Any
from config import Config
from app.extensions.email_templates import (
    render_registration_confirmed,
    render_registration_approved,
    render_registration_rejected,
    render_registration_revoked,
    render_event_cancelled,
    render_organizer_registration_pending,
    render_registration_received,
)

logger = logging.getLogger(__name__)


def _send_email(to: str, subject: str, html: str) -> bool:
    """Send email using Resend API."""
    try:
        import resend
        print(f"DEBUG: Email task for {to} - subject: {subject}")
        
        if not Config.RESEND_API_KEY:
            print("DEBUG: RESEND_API_KEY is missing!")
            logger.warning("[email] RESEND_API_KEY not configured")
            return False
        
        resend.api_key = Config.RESEND_API_KEY
        
        response = resend.Emails.send({
            "from": Config.RESEND_FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
        
        print(f"DEBUG: Resend response: {response}")
        logger.info(f"[email] Email sent to {to}: {subject}")
        return True
    except Exception as e:
        print(f"DEBUG: Resend error: {str(e)}")
        logger.error(f"[email] Failed to send email: {e}")
        return False


def send_registration_confirmed(attendee_email: str, attendee_name: str, event: Dict[str, Any]) -> None:
    """Send registration confirmed email to attendee (Open registration)."""
    subject = f"Registration Confirmed: {event['title']}"
    html = render_registration_confirmed(event, attendee_name)
    _send_email(attendee_email, subject, html)


def send_application_received(attendee_email: str, attendee_name: str, event: Dict[str, Any]) -> None:
    """Send application received email to attendee (Approval-based registration)."""
    subject = f"Application Received: {event['title']}"
    html = render_registration_received(event, attendee_name)
    _send_email(attendee_email, subject, html)


def send_registration_approved(attendee_email: str, attendee_name: str, event: Dict[str, Any]) -> None:
    """Send registration approved email to attendee."""
    subject = f"Registration Approved: {event['title']}"
    html = render_registration_approved(event, attendee_name)
    _send_email(attendee_email, subject, html)


def send_registration_rejected(attendee_email: str, attendee_name: str, event: Dict[str, Any]) -> None:
    """Send registration rejected email to attendee."""
    subject = f"Update: {event['title']}"
    html = render_registration_rejected(event, attendee_name)
    _send_email(attendee_email, subject, html)


def send_registration_revoked(attendee_email: str, attendee_name: str, event: Dict[str, Any]) -> None:
    """Send registration revoked email to attendee."""
    subject = f"Status Update: {event['title']}"
    html = render_registration_revoked(event, attendee_name)
    _send_email(attendee_email, subject, html)


def send_event_cancelled(attendee_email: str, attendee_name: str, event: Dict[str, Any]) -> None:
    """Send event cancelled email to registered attendee."""
    subject = f"Event Cancelled: {event['title']}"
    html = render_event_cancelled(event, attendee_name)
    _send_email(attendee_email, subject, html)


def send_organizer_registration_notification(
    organizer_email: str, 
    event: Dict[str, Any], 
    attendee_name: str,
    attendee_email: str
) -> None:
    """Send organizer notification for new pending registration."""
    subject = f"New Request: {event['title']}"
    html = render_organizer_registration_pending(event, attendee_name, attendee_email)
    _send_email(organizer_email, subject, html)
