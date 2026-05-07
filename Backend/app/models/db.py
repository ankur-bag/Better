import psycopg
from psycopg.rows import dict_row
from contextlib import contextmanager
from config import Config


class Database:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.conn = None

    def get_connection(self):
        if self.conn is None or self.conn.closed:
            self.conn = psycopg.connect(self.connection_string, row_factory=dict_row)
        return self.conn

    @contextmanager
    def get_cursor(self, commit=True):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            if commit:
                conn.rollback()
            raise e
        finally:
            cursor.close()

    def close(self):
        if self.conn and not self.conn.closed:
            self.conn.close()
            self.conn = None


def get_db() -> Database:
    if not Config.DATABASE_URL:
        raise ValueError("DATABASE_URL not configured")
    return Database(Config.DATABASE_URL)