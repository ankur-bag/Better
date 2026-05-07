"""Email template components using inline styles matching Avento brand colors."""


# Avento Brand Colors
PRIMARY = "#FF1313"      # Brand red
SECONDARY = "#83868F"    # Brand gray
DARK = "#020605"         # Dark background
LIGHT = "#F9F9FA"        # Very light gray for background


def render_base_layout(content: str, preview: str = "") -> str:
    """Render base email layout with Avento branding."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Avento</title>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: {DARK};
            background-color: {LIGHT};
            margin: 0;
            padding: 20px 0;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #E5E7EB;
        }}
        .header {{
            background: {DARK};
            padding: 48px 40px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -1px;
            color: white;
        }}
        .header h1 span {{
            color: {PRIMARY};
        }}
        .content {{
            padding: 48px 40px;
        }}
        .content h2 {{
            color: {DARK};
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 20px 0;
            letter-spacing: -0.5px;
        }}
        .content p {{
            margin: 0 0 20px 0;
            color: #4B5563;
            font-size: 16px;
            line-height: 1.7;
        }}
        .event-card {{
            background-color: #F3F4F6;
            border-radius: 20px;
            padding: 32px;
            margin: 32px 0;
            border: 1px solid #E5E7EB;
        }}
        .event-card h3 {{
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
            color: {DARK};
        }}
        .detail-row {{
            margin-bottom: 12px;
            display: block;
        }}
        .detail-label {{
            color: {SECONDARY};
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 4px;
        }}
        .detail-value {{
            color: {DARK};
            font-size: 15px;
            font-weight: 500;
        }}
        .button {{
            display: inline-block;
            background-color: {PRIMARY};
            color: white !important;
            padding: 16px 32px;
            border-radius: 14px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
            transition: all 0.2s ease;
        }}
        .footer {{
            padding: 40px;
            text-align: center;
            font-size: 13px;
            color: {SECONDARY};
            border-top: 1px solid #F3F4F6;
        }}
        .footer p {{
            margin: 8px 0;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 16px;
            border-radius: 100px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
        }}
        .badge-success {{
            background-color: #DEF7EC;
            color: #03543F;
        }}
        .badge-danger {{
            background-color: #FDE8E8;
            color: #9B1C1C;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>AVENTO<span>.</span></h1>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p><strong>Avento</strong> — Premium Event Management</p>
            <p>© 2026 Avento Inc. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""


def render_registration_confirmed(event: dict, attendee_name: str = "Attendee") -> str:
    """Render registration confirmed email template (Open events)."""
    content = f"""
        <div class="badge badge-success">Confirmed</div>
        <h2>Registration Confirmed!</h2>
        <p>Hi {attendee_name},</p>
        <p>Your spot for <strong>{event['title']}</strong> is secured. We've added you to the guest list!</p>
        
        <div class="event-card">
            <h3>Event Details</h3>
            <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">{event['title']}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">{event['start_datetime']}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">{event['location']}</span>
            </div>
        </div>
        
        <p style="text-align: center;">
            <a href="https://avento.com" class="button">View Event Dashboard</a>
        </p>
    """
    return render_base_layout(content)


def render_registration_approved(event: dict, attendee_name: str = "Attendee") -> str:
    """Render registration approved email template."""
    content = f"""
        <div class="badge badge-success">Approved</div>
        <h2>Great News!</h2>
        <p>Hi {attendee_name},</p>
        <p>The organizer has reviewed and <strong>approved</strong> your registration for {event['title']}.</p>
        
        <div class="event-card">
            <h3>Event Details</h3>
            <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">{event['title']}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">{event['start_datetime']}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">{event['location']}</span>
            </div>
        </div>
        
        <p style="text-align: center;">
            <a href="https://avento.com" class="button">Access Event</a>
        </p>
    """
    return render_base_layout(content)


def render_registration_rejected(event: dict, attendee_name: str = "Attendee") -> str:
    """Render registration rejected email template."""
    content = f"""
        <div class="badge badge-danger">Update</div>
        <h2>Registration Update</h2>
        <p>Hi {attendee_name},</p>
        <p>Thank you for your interest in <strong>{event['title']}</strong>.</p>
        <p>Unfortunately, your registration request was not approved at this time. This is typically due to limited capacity or event-specific criteria.</p>
        
        <p style="color: {SECONDARY}; margin-top: 32px; font-size: 14px;">
            We appreciate your interest and hope to see you at future Avento events.
        </p>
    """
    return render_base_layout(content)


def render_registration_revoked(event: dict, attendee_name: str = "Attendee") -> str:
    """Render registration revoked email template."""
    content = f"""
        <div class="badge badge-danger">Revoked</div>
        <h2>Status Changed</h2>
        <p>Hi {attendee_name},</p>
        <p>Your registration status for <strong>{event['title']}</strong> has been changed to revoked by the organizer.</p>
        
        <div class="event-card">
            <h3>Event</h3>
            <p><strong>{event['title']}</strong></p>
            <p style="font-size: 14px; color: {SECONDARY};">{event['start_datetime']}</p>
        </div>
        
        <p>Your spot has been released. If you believe this is an error, please contact the organizer directly.</p>
    """
    return render_base_layout(content)


def render_event_cancelled(event: dict, attendee_name: str = "Attendee") -> str:
    """Render event cancelled email template."""
    content = f"""
        <div class="badge badge-danger">Cancelled</div>
        <h2>Event Cancelled</h2>
        <p>Hi {attendee_name},</p>
        <p>We're writing to inform you that <strong>{event['title']}</strong> has been cancelled by the organizer.</p>
        
        <div class="event-card">
            <p><strong>{event['title']}</strong></p>
            <p style="font-size: 14px; color: {SECONDARY};">Scheduled for {event['start_datetime']}</p>
        </div>
        
        <p>We apologize for the inconvenience.</p>
    """
    return render_base_layout(content)


def render_organizer_registration_pending(event: dict, attendee_name: str, attendee_email: str) -> str:
    """Render organizer notification for pending registration."""
    content = f"""
        <div class="badge badge-success">New Request</div>
        <h2>Registration Request</h2>
        <p>Hello,</p>
        <p>A new guest has requested to join <strong>{event['title']}</strong>.</p>
        
        <div class="event-card">
            <div class="detail-row">
                <span class="detail-label">Guest</span>
                <span class="detail-value">{attendee_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">{attendee_email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Capacity</span>
                <span class="detail-value">{event.get('confirmed_count', 0)} / {event['capacity']}</span>
            </div>
        </div>
        
        <p style="text-align: center;">
            <a href="https://avento.com/organizer-dashboard" class="button">Review Application</a>
        </p>
    """
    return render_base_layout(content)


def render_registration_received(event: dict, attendee_name: str = "Attendee") -> str:
    """Render registration received email (for approval-based events)."""
    content = f"""
        <div class="badge badge-success">Received</div>
        <h2>Application Received</h2>
        <p>Hi {attendee_name},</p>
        <p>Your registration request for <strong>{event['title']}</strong> has been received and is currently being reviewed by the organizer.</p>
        
        <div class="event-card">
            <h3>Event Details</h3>
            <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">{event['title']}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">{event['start_datetime']}</span>
            </div>
        </div>
        
        <p>We'll notify you as soon as the organizer makes a decision!</p>
    """
    return render_base_layout(content)
