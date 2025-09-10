import sqlite3
import psycopg2
import psycopg2.extras
from contextlib import contextmanager
import os
from typing import Optional

# Check if we're in production (Railway sets DATABASE_URL)
DATABASE_URL = os.getenv("DATABASE_URL")
IS_PRODUCTION = DATABASE_URL is not None

if not IS_PRODUCTION:
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), "database.db")

@contextmanager
def get_db():
    """Database connection context manager - supports both SQLite and PostgreSQL"""
    if IS_PRODUCTION:
        # PostgreSQL for production
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    else:
        # SQLite for local development
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

def _convert_query_params(query: str, params: Optional[tuple] = None):
    """Convert SQLite ? placeholders to PostgreSQL $1, $2, etc. for production"""
    if IS_PRODUCTION and params:
        # Convert ? placeholders to PostgreSQL format
        converted_query = query
        for i in range(len(params)):
            converted_query = converted_query.replace('?', f'${i+1}', 1)
        return converted_query, params
    return query, params

def execute_query(query: str, params: Optional[tuple] = None):
    """Execute a query and return results"""
    query, params = _convert_query_params(query, params)
    
    with get_db() as conn:
        if IS_PRODUCTION:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        else:
            cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchall()

def execute_one(query: str, params: Optional[tuple] = None):
    """Execute a query and return single result"""
    query, params = _convert_query_params(query, params)
    
    with get_db() as conn:
        if IS_PRODUCTION:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        else:
            cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.fetchone()

def execute_insert(query: str, params: Optional[tuple] = None):
    """Execute an insert and return last row id"""
    query, params = _convert_query_params(query, params)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        if IS_PRODUCTION:
            # PostgreSQL - modify query to include RETURNING id
            if "RETURNING" not in query.upper():
                query = query.rstrip(';') + " RETURNING id"
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if IS_PRODUCTION:
            # PostgreSQL - get the returned ID
            result = cursor.fetchone()
            return result[0] if result else None
        else:
            # SQLite - use lastrowid
            return cursor.lastrowid

def execute_update(query: str, params: Optional[tuple] = None):
    """Execute an update/delete and return affected rows"""
    query, params = _convert_query_params(query, params)
    
    with get_db() as conn:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor.rowcount