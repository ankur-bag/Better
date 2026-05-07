import psycopg
import os
from dotenv import load_dotenv

load_dotenv('Backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("DATABASE_URL not found in Backend/.env")
    exit(1)

SCHEMA = """
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    registration_mode TEXT NOT NULL CHECK (registration_mode IN ('open', 'shortlist')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attendee_name TEXT,
    attendee_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'registered', 'approved', 'rejected', 'revoked', 'confirmed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (event_id, attendee_email)
);
"""

try:
    print(f"Connecting to database...")
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            print("Executing schema initialization...")
            cur.execute(SCHEMA)
            conn.commit()
            print("✅ Database schema initialized successfully!")
except Exception as e:
    print(f"❌ Error initializing database: {e}")
    exit(1)
