from app.models import get_db
db = get_db()
with db.get_cursor() as cursor:
    cursor.execute('SELECT id, attendee_name, status FROM registrations')
    for row in cursor.fetchall():
        print(dict(row))
