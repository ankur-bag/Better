# Copilot Instructions — Avento Event Management Platform

This file constrains how AI tools (GitHub Copilot, Claude, Cursor, etc.) assist with this codebase. Read this before generating any code for this project.

---

## Project Context

Avento is a full-stack event management platform built for a 48-hour engineering assessment.

- **Frontend:** React (in `/Frontend`)
- **Backend:** Flask (in `/Backend`)
- **Auth:** Clerk — JWT verified in Flask via JWKS endpoint
- **Database:** Supabase PostgreSQL
- **Email:** Resend — non-critical extension only, fire-and-forget

The evaluators care about structure, correctness, and resilience — not feature count or UI polish. Generate small, readable, correct code. Do not add features not listed in `PRD.md`.

---

## Design System — Always Apply

### Color Palette
```css
:root {
  --color-primary: #FF1313;   /* CTAs, active states, badges */
  --color-muted:   #83868F;   /* Secondary text, placeholders */
  --color-bg:      #020605;   /* Page background */
  --color-surface: #FEF5F8;   /* Cards, modals, form surfaces */
}
```

### Typography
Always use Mozilla Text. The font link belongs in `/Frontend/index.html`:

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

Weight usage: `200` light · `400` regular · `600` semibold · `700` bold

Never use system fonts, Inter, Roboto, or any other font family. Mozilla Text only.

---

## Absolute Rules

### Never do these:
- Do not put business logic inside Flask route handlers — it belongs in `/Backend/app/services/`
- Do not let email failures affect API response codes or propagate as unhandled exceptions
- Do not use `SELECT *` — always select named columns
- Do not commit `.env` files, API keys, or secrets
- Do not generate frontend code that reads role or auth state from localStorage — always derive from Clerk's `useUser()` hook
- Do not skip input validation on any API endpoint
- Do not bypass domain rules under any circumstance (capacity checks, status checks, transition checks)
- Do not use colors, fonts, or spacing outside the design system defined above

### Always do these:
- Enforce all domain rules in `/Backend/app/services/` before writing to DB
- Return structured error responses: `{ "error": "Human-readable message" }` with correct HTTP status
- Wrap email calls in try/except and log failures — never re-raise
- Validate all request bodies with a Marshmallow schema before processing
- Check ownership: organizers can only read/write their own events
- Add a pytest test for every new domain rule or service function
- Apply `--color-primary`, `--color-bg`, `--color-surface`, `--color-muted` CSS variables consistently
- Load Mozilla Text from Google Fonts — never fallback to another font in UI code

---

## Architecture Constraints

### Backend Layer Rules

```
Route handler
  → validate input with Marshmallow schema
  → call service function
  → return JSON response
       ↓
  Service function
  → enforce domain rules
  → write to DB
  → trigger email extension (fire-and-forget, after DB commit)
```

- **Routes** (`/app/routes/`): Parse request, validate schema, call service, return JSON. No business logic.
- **Services** (`/app/services/`): All domain rules live here. Services are the only layer that writes to DB.
- **Extensions** (`/app/extensions/email/`): Side effects only. Always wrapped in try/except. Never imported by routes — only called from services after successful DB writes.
- **Middleware** (`/app/middleware/`): JWT verification and role enforcement via decorators.

### Frontend Layer Rules

- All API calls go through `/Frontend/src/api/` wrappers — never call Flask directly from components
- Auth state comes from Clerk's `useUser()` hook only
- Role (`organizer` | `attendee`) is read from `user.publicMetadata.role`
- Never store role or JWT in localStorage or component state manually
- One component per file
- Custom hooks for any logic reused across 2+ components

---

## Domain Rules — Never Skip These

All enforced in the service layer before any DB write:

```python
# registration_service.py
1. Event status must be 'published' (not draft, not cancelled)
2. Event start_datetime must be in the future (not past)
3. active_count (registered + approved) must be < event capacity
4. (event_id, attendee_email) pair must not already exist in registrations
5. On approve: re-check capacity before transitioning status

# event_service.py
6. Organizer can only edit/cancel/delete their own events (filter by organizer_id)
7. Cannot edit a cancelled event
8. Cannot edit an event whose start_datetime has already passed
9. Cannot publish without all required fields present
10. Cannot delete an event unless status is 'draft'
```

### Capacity Calculation
```python
# active_count — the only correct way to measure capacity usage
active_count = db.query(
    "SELECT COUNT(*) FROM registrations WHERE event_id = %s AND status IN ('registered', 'approved')",
    [event_id]
)
# 'pending', 'rejected', 'revoked' do NOT count toward capacity
```

### Valid Status Transitions
```python
VALID_TRANSITIONS = {
    'pending':    ['approved', 'rejected'],
    'approved':   ['revoked'],
    'registered': ['revoked'],
    # 'rejected' and 'revoked' are terminal — no transitions out
}

def validate_transition(current_status: str, new_status: str):
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise ValueError(f"Cannot transition from '{current_status}' to '{new_status}'")
```

---

## Error Response Format

All API errors must follow this exact format:

```json
{ "error": "Human-readable message explaining what went wrong" }
```

HTTP status codes:

| Situation | Status |
|---|---|
| Missing or invalid input | 400 |
| Unauthenticated (no/bad JWT) | 401 |
| Wrong role or not owner | 403 |
| Resource not found | 404 |
| Domain rule violation (full, cancelled, past, bad transition) | 422 |
| Server error | 500 |

---

## Email Extension Pattern

Email must always follow this exact pattern — no exceptions:

```python
# In service layer, AFTER successful DB commit
import logging
logger = logging.getLogger(__name__)

try:
    from app.extensions.email.email import send_registration_confirmed
    send_registration_confirmed(
        attendee_email=registration['attendee_email'],
        attendee_name=registration['attendee_name'],
        event=event
    )
except Exception as e:
    logger.error(f"[email] send_registration_confirmed failed: {e}")
    # Do NOT re-raise — the DB write already succeeded
```

Email import errors, missing API keys, network failures — none of these should surface to the API caller.

---

## Clerk JWT Verification (Flask)

```python
# /Backend/app/middleware/auth.py
import jwt
import requests
from functools import wraps
from flask import request, jsonify, g

JWKS_URL = "https://api.clerk.com/v1/jwks"

def get_clerk_public_key(token):
    jwks = requests.get(JWKS_URL).json()
    # Match kid from token header to JWKS key
    ...

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthenticated'}), 401
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, get_clerk_public_key(token), algorithms=['RS256'])
            g.user_id = payload['sub']
            g.user_role = payload.get('public_metadata', {}).get('role')
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            if g.user_role != role:
                return jsonify({'error': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
```

---

## Database Rules

- Always use parameterized queries — never f-string SQL
- Use UUIDs for all primary keys (events, registrations)
- Clerk user ID (TEXT) is the primary key for the `users` table
- Never hard-delete registrations or events — use status fields
- Always filter organizer-scoped queries by `organizer_id`
- Capacity is enforced at the service layer AND by DB unique constraint on `(event_id, attendee_email)`

---

## Testing Requirements

Every service function enforcing a domain rule must have a pytest test.

Minimum required tests in `/Backend/tests/`:

```
test_registration_service.py:
  test_cannot_register_for_full_event
  test_cannot_register_for_cancelled_event
  test_cannot_register_for_draft_event
  test_cannot_register_for_past_event
  test_cannot_register_twice_same_email
  test_open_mode_sets_registered_status
  test_shortlist_mode_sets_pending_status
  test_approve_rechecks_capacity
  test_revoked_does_not_count_toward_capacity
  test_invalid_status_transition_raises

test_event_service.py:
  test_organizer_cannot_edit_others_event
  test_cannot_edit_cancelled_event
  test_cannot_edit_past_event
  test_cannot_delete_published_event
  test_slug_generated_on_create
  test_public_status_open
  test_public_status_full
  test_public_status_closed
  test_public_status_cancelled
```

Run tests with: `pytest /Backend/tests/ -v`

---

## Frontend Component Structure

### App.tsx — Routing Only
`App.tsx` must only contain route definitions. No JSX layout, no UI, no logic.

```tsx
// CORRECT — App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  )
}

// WRONG — never do this in App.tsx
export default function App() {
  return (
    <div>
      <nav>...</nav>
      <h1>Welcome to Avento</h1>  {/* ← never write UI directly here */}
    </div>
  )
}
```

### Reusable Components — Always in `/components`
Every reusable piece of UI must live in `/Frontend/src/components/`. Never inline it in a page file.

Required section components to create:

| File | Purpose |
|---|---|
| `components/HeroSection.tsx` | Landing page hero — headline, subtext, CTA button |
| `components/CTASection.tsx` | Call-to-action block — used on public pages |
| `components/Footer.tsx` | Site-wide footer — links, branding |
| `components/Navbar.tsx` | Top navigation — auth state aware |
| `components/EventCard.tsx` | Single event card used in listings |
| `components/StatusBadge.tsx` | `Open` / `Full` / `Closed` / `Cancelled` badge |
| `components/RegistrationForm.tsx` | Public event registration form (name + email) |
| `components/AttendeeTable.tsx` | Organizer attendee list with actions |

### Component Rules
- One component per file — no exceptions
- File name matches the exported component name exactly (`EventCard.tsx` exports `EventCard`)
- Pages compose components — pages never contain raw HTML layout directly
- If a UI pattern appears in 2+ places, extract it to `/components/` immediately
- All styling uses CSS variables from the design system — no hardcoded hex values

### Page Composition Pattern
```tsx
// CORRECT — pages/HomePage.tsx
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <CTASection />
      <Footer />
    </>
  )
}
```

---

## Frontend Component Rules — Strictly Enforced

### App.tsx
- `App.tsx` contains only route definitions and top-level providers
- No JSX markup, no layout code, no business logic inside `App.tsx`
- Every visual section must be its own component imported from `/src/components/` or `/src/pages/`

### Component Structure
- Every reusable UI element goes in `/Frontend/src/components/`
- Page-level sections are broken into named section components, for example:
  - `HeroSection.tsx`
  - `CTASection.tsx`
  - `Footer.tsx`
  - `Navbar.tsx`
  - `EventCard.tsx`
  - `RegistrationForm.tsx`
  - `StatusBadge.tsx`
- One component per file — always
- Component filename matches the exported component name exactly

### Styling
- Use Tailwind CSS utility classes for all styling — no custom CSS files, no inline `style={{}}` objects, no styled-components
- Use the CSS variable tokens (`--color-primary`, `--color-bg`, `--color-surface`, `--color-muted`) via Tailwind's arbitrary value syntax when needed: `bg-[var(--color-bg)]`, `text-[var(--color-primary)]`
- Never hardcode hex values directly in className strings
- Dark background (`--color-bg: #020605`) is the default page background — always set it on the root layout

### General Rules
- No additional `.md` files — documentation lives only in `PRD.md` and `copilot-instructions.md`
- No emojis in any generated code, comments, or UI text
- Functional components only — no class components
- Custom hooks for any logic reused across 2+ components, placed in `/src/hooks/`
- No inline API calls inside JSX — always use `/src/api/` wrappers

---

## Code Style

### Python (Backend)
- Functions over classes where possible
- Descriptive variable names — no single-letter variables outside loops
- Route handlers must stay under 15 lines
- Service functions must stay under 40 lines — split if longer
- Type hints on all function signatures

### React (Frontend)
- Functional components only — no class components
- One component per file
- Custom hooks for logic reused across 2+ components
- No inline API calls inside JSX — always use `/src/api/` wrappers
- Always use Tailwind CSS — never hardcoded hex values or inline styles
- Always use cursor pointer in buttons

---

## What NOT to Generate

Do not generate code for any of the following — they are explicitly out of scope:

- Zoom or any video/conferencing integration
- Payment processing or ticketing
- Public user profile pages
- Real-time updates or WebSockets
- File or image uploads
- Bulk attendee actions
- Admin panel
- Multi-tenant RBAC
- No Bold Texts

If prompted to build any of the above, respond: "This feature is out of scope per PRD.md."

---

## File Placement Cheatsheet

| What | Where |
|---|---|
| Flask blueprint (route handler) | `/Backend/app/routes/` |
| Business logic + domain rules | `/Backend/app/services/` |
| Email side effects | `/Backend/app/extensions/email/email.py` |
| Clerk JWT middleware | `/Backend/app/middleware/auth.py` |
| Supabase client + query helpers | `/Backend/app/db/db.py` |
| Pytest tests | `/Backend/tests/` |
| React pages | `/Frontend/src/pages/` |
| Reusable components | `/Frontend/src/components/` |
| Flask API wrappers | `/Frontend/src/api/` |
| Custom hooks | `/Frontend/src/hooks/` |
| TypeScript types | `/Frontend/src/types/` |
| Event templates config | `/Frontend/src/config/templates.ts` |
| Google Fonts link + CSS vars | `/Frontend/index.html` + global CSS |

# Avento — Frontend Quick Reference

## Entry Points
- Main entry: `/Frontend/src/index.tsx`
- Routes: `/Frontend/src/App.tsx` (routing only)
- Pages: `/Frontend/src/pages/`

## Component Organization
- Reusable components: `/Frontend/src/components/`
- One component per file, named exactly as exported
- Pages compose components — no raw HTML in page files

## Routing (App.tsx)
```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  {/* ... */}
</Routes>
```

## Styling
- Use Tailwind CSS utility classes
- Use CSS variables: `--color-primary`, `--color-bg`, `--color-surface`, `--color-muted`
- Dark mode background: `--color-bg` is the default page background

## Key Components
- `HeroSection.tsx` - landing page hero
- `CTASection.tsx` - call-to-action block
- `Footer.tsx` - site footer
- `Navbar.tsx` - auth-aware navigation
- `EventCard.tsx` - event cards in listings
- `RegistrationForm.tsx` - name/email registration form
- `StatusBadge.tsx` - `Open | Full | Closed | Cancelled` badge
- `AttendeeTable.tsx` - organizer attendee list