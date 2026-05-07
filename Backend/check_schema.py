from app.models import get_db
db = get_db()
with db.get_cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'registrations'")
    for row in cursor.fetchall():
        print(row['column_name'])
