# Database Migrations for Avento

This directory contains SQL migration scripts for Supabase PostgreSQL.

## How to Run Migrations

### Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the SQL from each migration file
4. Execute each migration in order
5. Verify the changes in the Table Editor

### Via Supabase CLI
```bash
supabase db push
```

## Migrations

### 001_initial_schema.sql
Creates the initial schema:
- users table (Clerk user mirror)
- events table (organizer events)
- registrations table (Clerk auth-based)

### 002_add_public_registration_columns.sql
Adds support for public registrations without Clerk auth:
- `attendee_name` (TEXT) - attendee's name
- `attendee_email` (TEXT) - attendee's email
- Index on (event_id, attendee_email) for duplicate checking
- Updates status constraint to include 'registered', 'approved' (new status values)

## Status Values

After migration, registrations can have the following status values:
- `pending` - Application submitted in shortlist mode, awaiting approval
- `registered` - Registered in open mode (immediate confirmation)
- `approved` - Application approved in shortlist mode
- `rejected` - Application rejected (terminal state)
- `revoked` - Registration cancelled by organizer (terminal state)
- `confirmed` - Legacy status (being phased out)

## Registration Types

### Auth-Based Registration (Legacy)
- Uses `attendee_id` (Clerk user ID)
- Requires authentication
- Status: 'confirmed' or per state machine

### Public Registration (New)
- Uses `attendee_name` and `attendee_email`
- No authentication required
- Status: 'registered' or 'pending' based on event mode

Both types coexist in the same table.
