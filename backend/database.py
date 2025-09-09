import sqlite3
from contextlib import contextmanager
import os
from typing import Optional

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "database.db")

@contextmanager
def get_db():
    """Simple context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def execute_query(query: str, params: Optional[tuple] = None):
    """Execute a query and return results"""
    with get_db() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchall()

def execute_one(query: str, params: Optional[tuple] = None):
    """Execute a query and return single result"""
    with get_db() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchone()

def execute_insert(query: str, params: Optional[tuple] = None):
    """Execute an insert and return last row id"""
    with get_db() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.lastrowid

def execute_update(query: str, params: Optional[tuple] = None):
    """Execute an update/delete and return affected rows"""
    with get_db() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.rowcount