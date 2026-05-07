import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")
print(f"Connecting to: {url}")

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM events;")
    count = cur.fetchone()[0]
    print(f"Total events in DB: {count}")
    
    cur.execute("SELECT id, organizer_id, title FROM events;")
    events = cur.fetchall()
    for e in events:
        print(f"Event: {e[2]} | Organizer: {e[1]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
