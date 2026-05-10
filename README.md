# Avento · Event Management Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Flask%20%7C%20Supabase-blue.svg)]()
[![Auth](https://img.shields.io/badge/auth-Clerk-purple.svg)]()

**Avento** is a high-fidelity, full-stack event management platform designed for seamless organization and attendee registration. Built with a focus on correctness, scalability, and modern aesthetics, it empowers organizers to host events with precision and provides attendees with a frictionless registration experience.

---

## Features

### For Organizers
- **Event Lifecycle Management**: Create, edit, publish, and cancel events.
- **AI-Powered "Magic Enhance"**: Optimize event descriptions using Google Gemini AI for more engaging content.
- **Template System**: Quickly bootstrap events using pre-configured templates (Tech Meetup, Webinar, Workshop, Networking).
- **Registration State Machine**: Manage attendee statuses with a robust state machine (`pending` → `approved`/`rejected` → `revoked`).
- **Capacity Enforcement**: Real-time tracking of remaining slots with strict enforcement at the database level.
- **Search & Filter**: Efficiently manage large lists of registrations with search and status-based filtering.

### For Attendees
- **Public Event Pages**: Beautiful, slug-based public URLs for every published event.
- **Frictionless Registration**: Submit interest with just a name and email—no account creation required for attendees.
- **Live Status Tracking**: Real-time badges showing event status (`Open`, `Full`, `Closed`, `Cancelled`).
- **Email Notifications**: Receive instant confirmations and updates via Resend (Registration, Approval, Updates, Cancellations).

---

## Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4.0
- **Animations**: Framer Motion
- **Auth**: Clerk (Role-based access control)
- **State Management**: React Hooks & Context API

### Backend
- **Framework**: Flask (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini (Generative AI SDK)
- **Email**: Resend API
- **Validation**: Marshmallow
- **Testing**: Pytest

---

## Design System

Avento follows a premium, high-contrast dark aesthetic:

| Token | Hex | Usage |
|---|---|---|
| Primary | `#FF1313` | CTAs, Active States, Badges |
| Muted | `#83868F` | Secondary Text, Placeholders |
| Background | `#020605` | Deep Dark Page Background |
| Surface | `#FEF5F8` | Contrast Cards & Form Surfaces |

**Typography**: Mozilla Text (Google Fonts)

---

## Project Structure

```text
.
├── Frontend/           # React + Vite Application
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   ├── pages/      # Route-level views
│   │   ├── hooks/      # Custom React hooks
│   │   └── api/        # Axios API wrappers
│   └── public/         # Static assets
├── Backend/            # Flask API
│   ├── app/
│   │   ├── routes/     # API Blueprints
│   │   ├── services/   # Core Business Logic
│   │   ├── middleware/ # Auth & Security Guards
│   │   └── extensions/ # Fire-and-forget integrations (Email)
│   └── tests/          # Pytest suite
└── PRD.md              # Detailed Product Requirements
```

---

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- Clerk Account (API Keys)
- Supabase Account (DB URI)
- Resend API Key

### Backend Setup
1. `cd Backend`
2. Create and activate a virtual environment: `python -m venv venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env`:
   ```env
   DATABASE_URL=your_supabase_url
   CLERK_API_KEY=your_clerk_key
   RESEND_API_KEY=your_resend_key
   GEMINI_API_KEY=your_gemini_key
   ```
5. Run migrations/init: `python init_db.py`
6. Start server: `python run.py`

### Frontend Setup
1. `cd Frontend`
2. Install dependencies: `npm install`
3. Configure `.env`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   VITE_API_URL=http://localhost:5000
   ```
4. Start dev server: `npm run dev`

---

## Verification

Run backend tests to ensure domain logic integrity:
```bash
cd Backend
pytest
```

---

## License
Built as part of the **Better** Associate Software Engineer assessment.
Author: **Ankur Bag**
