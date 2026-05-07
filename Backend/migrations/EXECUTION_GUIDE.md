## 🗄️ Supabase Database Migration Guide

### Prerequisites
- Supabase project with Avento database
- Administrator access to Supabase dashboard
- Clerk JWT configured
- RESEND_API_KEY in .env

---

### Step 1: Prepare the SQL Migration

The migration script is located at: `Backend/migrations/002_add_public_registration_columns.sql`

**What the migration does:**
- Adds `attendee_name` (TEXT, nullable) column to registrations table
- Adds `attendee_email` (TEXT, nullable) column to registrations table
- Creates unique constraint on (event_id, attendee_email) to prevent duplicate registrations
- Creates index on (event_id, attendee_email) for query performance
- Updates status check constraint to include new status values

---

### Step 2: Execute in Supabase Dashboard

#### Option A: Using Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Access SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

3. **Copy Migration SQL**
   - Open file: `Backend/migrations/002_add_public_registration_columns.sql`
   - Copy the entire content (all SQL statements)

4. **Paste and Execute**
   - Paste into the SQL Editor
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for execution to complete (should be < 1 second)

5. **Verify Success**
   - Check that no errors appear
   - You should see: "Success. No rows returned"

---

#### Option B: Using psql Command Line (Advanced)

If you have psql installed and Supabase connection string:

```bash
psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f Backend/migrations/002_add_public_registration_columns.sql
```

Replace placeholders with your Supabase connection details from:
- Supabase Dashboard → Database → Connection String → URI

---

### Step 3: Verify the Migration

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
ORDER BY ordinal_position;
```

You should see:
- `attendee_name` (TEXT, nullable)
- `attendee_email` (TEXT, nullable)
- All other existing columns

---

### Step 4: Verify Constraints and Indexes

**Check status constraint:**
```sql
SELECT constraint_name, constraint_definition 
FROM information_schema.table_constraints 
WHERE table_name = 'registrations' AND constraint_type = 'CHECK';
```

**Check indexes:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'registrations';
```

You should see: `idx_registrations_event_email`

---

### ✅ Success Indicators

After migration, the following should work:

1. **Public Registration Endpoint Accepts Attendee Data**
   ```
   POST /api/events/{event_id}/register
   Content-Type: application/json
   
   {
     "attendee_name": "John Doe",
     "attendee_email": "john@example.com"
   }
   ```

2. **Duplicate Email Prevention Works**
   - Register same email twice → second registration fails with 422

3. **Capacity Tracking Works**
   - Multiple registrations counted correctly
   - Event shows "full" when capacity reached

4. **Email Notifications Sent**
   - Check Resend dashboard for sent emails
   - Recipients receive confirmation emails

---

### 🔄 Rollback (If Needed)

If something goes wrong, rollback migration:

```sql
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS registrations_status_check,
ADD CONSTRAINT registrations_status_check 
  CHECK (status IN ('pending', 'confirmed'));

DROP INDEX IF EXISTS idx_registrations_event_email;

ALTER TABLE registrations
DROP COLUMN IF EXISTS attendee_name,
DROP COLUMN IF EXISTS attendee_email;
```

---

### 📋 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Constraint already exists" | The migration has already been run. This is OK. |
| "Column already exists" | The migration has already been run. This is OK. |
| "Permission denied" | Ensure you're using admin credentials in Supabase. |
| "Syntax error in SQL" | Copy the exact SQL from the migration file without modifications. |

---

### ✨ Next Steps

After successful migration:

1. Start the Flask backend: `cd Backend && python run.py`
2. Run integration tests: `python tests/test_api_integration.py`
3. Test manually with curl or Postman
4. Deploy to production

---

### Questions?

Refer to:
- Migration file: `Backend/migrations/002_add_public_registration_columns.sql`
- Documentation: `Backend/migrations/README.md`
- API docs: Check individual route handlers in `Backend/app/routes/`
