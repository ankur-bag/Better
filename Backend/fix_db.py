from app.models import get_db
db = get_db()
with db.get_cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE registrations ADD COLUMN attendee_id TEXT REFERENCES users(id)")
        print("Column attendee_id added.")
    except Exception as e:
        print(f"Error adding column: {e}")
