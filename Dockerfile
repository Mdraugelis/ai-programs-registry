# Multi-stage build for production
FROM node:18-slim as frontend-builder

# Install frontend dependencies and build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p uploads

# Copy and make start script executable
COPY start.sh ./
RUN chmod +x start.sh

# Initialize database (only for SQLite, skipped in production)
WORKDIR /app/backend
RUN python init_db.py || true

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Start command
CMD ["/app/start.sh"]