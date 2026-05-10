import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from contextlib import contextmanager
from config import Config


class Database:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        # Initialize connection pool with min 2, max 10 connections
        self.pool = ConnectionPool(
            self.connection_string,
            min_size=2,
            max_size=10,
            kwargs={'row_factory': dict_row},
            open=True
        )

    def get_connection(self):
        return self.pool.connection()

    @contextmanager
    def get_cursor(self, commit=True):
        with self.pool.connection() as conn:
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
        if self.pool:
            self.pool.close()


# Global database instance
_db_instance = None

def get_db() -> Database:
    global _db_instance
    if not Config.DATABASE_URL:
        raise ValueError("DATABASE_URL not configured")
        
    if _db_instance is None:
        _db_instance = Database(Config.DATABASE_URL)
        
    return _db_instance