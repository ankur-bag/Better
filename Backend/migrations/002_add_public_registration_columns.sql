-- Migration: Add public registration support
-- Purpose: Add attendee_name and attendee_email columns to support public registrations
-- Status: For Supabase, run these commands in the SQL Editor

-- Add attendee_name and attendee_email columns (nullable for backward compatibility)
ALTER TABLE registrations
ADD COLUMN attendee_name TEXT,
ADD COLUMN attendee_email TEXT;

-- Create index on (event_id, attendee_email) for duplicate checking
CREATE INDEX idx_registrations_event_email ON registrations(event_id, attendee_email)
WHERE attendee_email IS NOT NULL;

-- Update status check constraint to include 'registered' and 'approved' (new status values)
-- Note: 'confirmed' is legacy and will be phased out
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS registrations_status_check,
ADD CONSTRAINT registrations_status_check 
  CHECK (status IN ('pending', 'registered', 'approved', 'rejected', 'revoked', 'confirmed'));

-- Optional: Add updated_at column if not present
-- ALTER TABLE registrations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Verify the changes
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'registrations' ORDER BY ordinal_position;
