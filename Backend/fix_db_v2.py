from app.models import get_db
db = get_db()
with db.get_cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE registrations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()")
        print("Column updated_at added.")
    except Exception as e:
        print(f"Error adding column: {e}")
