#!/bin/bash

# Start script for Railway deployment
cd /app/backend

# Initialize database if needed (PostgreSQL in production)
python init_db.py || echo "Database initialization skipped (may already exist)"

# Start the application
exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}