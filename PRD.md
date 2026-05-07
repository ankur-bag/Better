# PRD — Avento · Event Management Platform

**Author:** Ankur Bag
**Assessment:** Associate Software Engineer — Better
**Stack:** React · Clerk (Auth) · Flask · Supabase PostgreSQL · Resend (Email)
**Folder Structure:** `/Frontend` · `/Backend`
**Scope:** 48-hour assessment build

---

## 1. Overview

Avento is a full-stack event management platform where **organizers** create and manage events, and **attendees** register via a public event page. The system handles capacity enforcement, a registration state machine, and email notifications as a non-critical extension layer.

The system prioritizes correctness, clear boundaries, and resilience to change over feature count or UI polish. Small and well-structured beats large and feature-rich.

---

## 2. Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#FF1313` | CTAs, active states, badges |
| `--color-muted` | `#83868F` | Secondary text, placeholders |
| `--color-bg` | `#020605` | Page background |
| `--color-surface` | `#FEF5F8` | Cards, modals, form surfaces |

### Typography
**Font:** Mozilla Text (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mozilla+Text:wght@200..700&display=swap" rel="stylesheet">
```

```css
body {
  font-family: "Mozilla Text", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}
```

Weight scale: `200` light · `400` regular · `600` semibold · `700` bold

---

## 3. Roles

| Role | Description |
|---|---|
| **Organizer** | Authenticated via Clerk. Creates/manages events, reviews registrations |
| **Attendee** | No account required. Visits public event page, submits name + email to register |

Role is stored in Clerk `publicMetadata` as `role: "organizer" | "attendee"`. Flask reads and enforces this on every protected route.

---

## 4. Core Features

### 4.1 Auth (Clerk)
- Sign up / sign in via Clerk (email + password)
- Role selected at sign-up, stored in Clerk `publicMetadata`
- Clerk JWT passed as `Authorization: Bearer <token>` to Flask
- Flask verifies JWT using Clerk's JWKS endpoint
- Protected routes return `401` if unauthenticated, `403` if wrong role
- After sign-in/sign-up → redirect to `/dashboard`

### 4.2 Event Management (Organizer only)
- Create event from scratch or from a **template** (Tech Meetup, Webinar, Workshop, Networking)
- Templates prefill fields — all remain editable after selection
- Event fields: `title`, `description`, `location`, `start_datetime`, `end_datetime`, `capacity`, `registration_mode` (`open` | `shortlist`), `is_online`
- Events start as `draft` — organizer explicitly **publishes** them
- Edit event (blocked if past or cancelled)
- Cancel event → sets status to `cancelled`, triggers cancellation emails to all active registrants
- Delete event (only allowed if still `draft`)
- List own events with registration counts and remaining capacity

### 4.3 Public Event Page (No auth required)
- Public URL: `/events/[slug]`
- Shows: title, description, location/online, datetime, capacity, remaining slots, registration mode
- Displays live status badge: `Open` | `Full` | `Closed` | `Cancelled`
- Registration form: attendee name + email (no account needed)
- Status `draft` → public page returns 404

### 4.4 Public Status (Computed — never stored)

```python
# In event_service.py
def get_public_status(event, active_count):
    if event['status'] == 'draft':               return None        # → 404
    if event['status'] == 'cancelled':           return 'Cancelled'
    if datetime.now(tz=timezone.utc) > event['start_datetime']: return 'Closed'
    if active_count >= event['capacity']:         return 'Full'
    return 'Open'
```

### 4.5 Registration (Attendee — no auth)
- Submit name + email on public event page
  - `open` mode → status immediately `registered`
  - `shortlist` mode → status set to `pending`, awaiting organizer approval
- Duplicate check: same email + event_id blocked at DB level
- Capacity check: blocked if `active_count >= capacity`
- Status check: blocked if event is `Full`, `Closed`, or `Cancelled`

### 4.6 Attendee Dashboard (Organizer only)
- View all registrations per event
- Search by attendee name or email
- Filter by status: `pending` | `registered` | `approved` | `rejected` | `revoked`
- Approve / reject `pending` registrations
- Revoke a `registered` or `approved` registration
- Approve action re-checks capacity before transitioning
- Revoked attendees do not count against capacity

### 4.7 Email Notifications (Extension — non-critical)
Triggered as fire-and-forget side effects after core DB operations succeed. If email fails, the API still returns success — failure is logged only.

| Trigger | Recipient | Email |
|---|---|---|
| Registration submitted (open mode) | Attendee | "You're registered for [Event]" |
| Registration submitted (shortlist) | Attendee | "Your application is under review" |
| Registration approved | Attendee | "You're in! Approved for [Event]" |
| Registration rejected | Attendee | "Update on your [Event] application" |
| Registration revoked | Attendee | "Your spot for [Event] has been cancelled" |
| Event updated (while published) | All active registrants | "[Event] details have changed" |
| Event cancelled | All active registrants | "[Event] has been cancelled" |

---

## 5. Registration State Machine

### Mode A — Open
```
submit → registered
organizer revoke → revoked  (frees one capacity slot)
```

### Mode B — Shortlist
```
submit → pending
pending → approved | rejected   (organizer decision)
approved → revoked              (organizer revocation)
```

### Valid Transitions (enforced in Flask service layer)
```python
VALID_TRANSITIONS = {
    'pending':    ['approved', 'rejected'],
    'approved':   ['revoked'],
    'registered': ['revoked'],
    # rejected and revoked are terminal states — no transitions out
}
```

### Capacity Rules
- `active_count = COUNT WHERE status IN ('registered', 'approved')`
- `pending` does NOT count toward capacity
- Approve action re-checks capacity before transitioning

---

## 6. Event Templates (Static — not in DB)

Defined in `/Frontend/src/config/templates.ts`:

```typescript
export const EVENT_TEMPLATES = [
  {
    id: 'tech-meetup',
    label: 'Tech Meetup',
    icon: '💻',
    prefill: {
      title: 'Tech Meetup — ',
      description: 'Join us for an evening of tech talks, demos, and networking...',
      is_online: false,
      registration_mode: 'open',
      capacity: 100,
    }
  },
  {
    id: 'webinar',
    label: 'Webinar',
    icon: '🎙️',
    prefill: {
      title: 'Webinar: ',
      description: 'An interactive online session where our speakers will cover...',
      is_online: true,
      registration_mode: 'shortlist',
      capacity: 500,
    }
  },
  {
    id: 'workshop',
    label: 'Workshop',
    icon: '🛠️',
    prefill: {
      title: 'Workshop: ',
      description: 'A focused hands-on workshop. You will leave with practical skills in...',
      is_online: false,
      registration_mode: 'shortlist',
      capacity: 30,
    }
  },
  {
    id: 'networking',
    label: 'Networking Event',
    icon: '🤝',
    prefill: {
      title: 'Networking Night — ',
      description: 'Connect with professionals in your field over drinks and conversation...',
      is_online: false,
      registration_mode: 'open',
      capacity: 60,
    }
  }
]
```

---

## 7. Slug Generation

Generated once on event creation. Never updated even if the title changes.

```python
# In event_service.py
import re, random, string

def generate_slug(title: str) -> str:
    base = re.sub(r'[^a-z0-9\s-]', '', title.lower()).strip()
    base = re.sub(r'\s+', '-', base)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base}-{suffix}"
# "Tech Meetup Bangalore" → "tech-meetup-bangalore-x7k2"
```

---

## 8. Database Schema (Supabase PostgreSQL)

```sql
-- Users (mirrors Clerk users — kept for FK integrity and email lookups)
CREATE TABLE users (
  id TEXT PRIMARY KEY,                          -- Clerk user ID (e.g. user_2abc...)
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'attendee')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  registration_mode TEXT NOT NULL CHECK (registration_mode IN ('open', 'shortlist')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  slug TEXT NOT NULL UNIQUE,
  template_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_datetime > start_datetime)
);

-- Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'registered', 'approved', 'rejected', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, attendee_email)
);
```

---

## 9. API Design

All protected routes require `Authorization: Bearer <clerk_jwt>`.

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | Public | List upcoming published events |
| GET | `/api/events/<slug>` | Public | Event detail + public status + remaining capacity |
| POST | `/api/events` | Organizer | Create event (status: draft) |
| PATCH | `/api/events/<id>` | Organizer | Edit event |
| POST | `/api/events/<id>/publish` | Organizer | Publish draft event |
| POST | `/api/events/<id>/cancel` | Organizer | Cancel event |
| DELETE | `/api/events/<id>` | Organizer | Delete draft event only |
| GET | `/api/organizer/events` | Organizer | List own events with counts |

### Registrations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/events/<slug>/register` | Public | Submit registration (name + email) |
| GET | `/api/organizer/events/<id>/registrations` | Organizer | List registrations (search + filter) |
| PATCH | `/api/organizer/registrations/<id>/status` | Organizer | Approve / reject / revoke |

---

## 10. Project Structure

```
/Frontend
  /src
    /components              # Reusable UI components
    /pages
      /events/[slug]         # Public event page + registration form
      /dashboard             # Organizer event list
      /dashboard/events/new  # Template picker + create form
      /dashboard/events/[id] # Edit event
      /dashboard/events/[id]/attendees  # Attendee table
    /hooks                   # useAuth, useEvents, useRegistrations
    /api                     # Axios wrappers for Flask API
    /config
      templates.ts           # Static event templates (not from DB)
    /types                   # TypeScript interfaces
  index.html                 # Google Fonts <link> goes here
  .env.local

/Backend
  /app
    /routes                  # Flask blueprints: events.py, registrations.py, users.py
    /services                # Business logic: event_service.py, registration_service.py
    /extensions
      /email                 # email.py — fire-and-forget, never raises
    /middleware              # auth.py — Clerk JWT verification + role guards
    /db                      # db.py — Supabase client + query helpers
  config.py
  requirements.txt
  .env
  /tests                     # pytest — one test file per service
```

---

## 11. Extension: Email (Resend)

Email is a non-critical extension. The application is fully functional without it.

```python
# /Backend/app/extensions/email/email.py
# Always called AFTER a successful DB write — never before

import logging
logger = logging.getLogger(__name__)

def send_registration_confirmed(attendee_email: str, attendee_name: str, event: dict):
    try:
        # Resend API call
        pass
    except Exception as e:
        logger.error(f"[email] registration_confirmed failed: {e}")
        # Never re-raise — core operation already succeeded
```

---

## 12. Page Routes

```
/sign-in                                 → Clerk hosted UI
/sign-up                                 → Clerk hosted UI
/events/[slug]                           → Public event page + registration form
/dashboard                               → Organizer — event list with counts
/dashboard/events/new                    → Organizer — template picker + create form
/dashboard/events/[id]                   → Organizer — edit event
/dashboard/events/[id]/attendees         → Organizer — attendee table (search, filter, actions)
```

---

## 13. Domain Rules (All enforced in Flask Service Layer)

| Rule | Enforced in |
|---|---|
| Can't register for a full event | `registration_service.py` — active_count vs capacity |
| Can't register for a cancelled or draft event | `registration_service.py` — check status |
| Can't register for a past event | `registration_service.py` — check start_datetime |
| Can't register twice (same email + event) | DB unique constraint + service pre-check |
| Can't approve beyond capacity | `registration_service.py` — re-check on approve |
| Invalid status transition blocked | `VALID_TRANSITIONS` map in service |
| Can't edit a cancelled or past event | `event_service.py` |
| Can't publish without required fields | `event_service.py` |
| Organizer can only manage their own events | All organizer queries filter by `organizer_id` |
| Revoked/rejected don't count toward capacity | `active_count` excludes these statuses |

---

## 14. What This System Does NOT Do

- No Zoom or video integration
- No payments or ticketing
- No public user profiles
- No real-time updates (websockets)
- No file or image uploads
- No bulk attendee actions

These are explicit cuts to keep the system small and the logic clean.

---

## 15. Evaluation Alignment

| Criterion | How addressed |
|---|---|
| Structure | Routes → Services → Extensions. Each layer has one job. |
| Simplicity | Thin route handlers. All logic lives in service layer. |
| Correctness | Domain rules enforced before every DB write |
| Interface Safety | Marshmallow schemas validate all inputs |
| Change Resilience | Email as isolated extension — zero core impact if removed |
| Verification | Pytest covers every domain rule in the service layer |
| Observability | Structured `{"error": "..."}` responses + email failure logging |
| AI Guidance | See `copilot-instructions.md` |