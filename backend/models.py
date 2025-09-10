from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import os

# Check if we're in production
IS_PRODUCTION = os.getenv("DATABASE_URL") is not None

# Database table schemas as SQL
if IS_PRODUCTION:
    # PostgreSQL table definitions
    INITIATIVES_TABLE = """
    CREATE TABLE IF NOT EXISTS initiatives (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        department VARCHAR(100),
        stage VARCHAR(20) CHECK(stage IN ('discovery', 'pilot', 'production', 'retired')),
        priority VARCHAR(20) CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        lead_name VARCHAR(255),
        lead_email VARCHAR(255),
        business_value TEXT,
        technical_approach TEXT,
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'deleted')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """

    DOCUMENTS_TABLE = """
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        initiative_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        uploaded_by VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        document_type VARCHAR(100),
        FOREIGN KEY (initiative_id) REFERENCES initiatives (id)
    )
    """

    USERS_TABLE = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK(role IN ('admin', 'reviewer', 'contributor')) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )
    """

    USER_API_KEYS_TABLE = """
    CREATE TABLE IF NOT EXISTS user_api_keys (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) UNIQUE NOT NULL,
        encrypted_claude_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (username)
    )
    """
else:
    # SQLite table definitions  
    INITIATIVES_TABLE = """
    CREATE TABLE IF NOT EXISTS initiatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        department TEXT,
        stage TEXT CHECK(stage IN ('discovery', 'pilot', 'production', 'retired')),
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        lead_name TEXT,
        lead_email TEXT,
        business_value TEXT,
        technical_approach TEXT,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'deleted')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """

    DOCUMENTS_TABLE = """
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initiative_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        uploaded_by TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        document_type TEXT,
        FOREIGN KEY (initiative_id) REFERENCES initiatives (id)
    )
    """

    USERS_TABLE = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'reviewer', 'contributor')) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )
    """

    USER_API_KEYS_TABLE = """
    CREATE TABLE IF NOT EXISTS user_api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        encrypted_claude_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (username)
    )
    """

# Pydantic models for API
class InitiativeBase(BaseModel):
    name: str
    description: Optional[str] = None
    department: Optional[str] = None
    stage: Optional[str] = Field(None, pattern="^(discovery|pilot|production|retired)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    lead_name: Optional[str] = None
    lead_email: Optional[str] = None
    business_value: Optional[str] = None
    technical_approach: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = Field("active", pattern="^(active|paused|completed|deleted)$")

class InitiativeCreate(InitiativeBase):
    pass

class InitiativeUpdate(InitiativeBase):
    name: Optional[str] = None

class Initiative(InitiativeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    initiative_id: int
    filename: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_by: Optional[str] = None
    document_type: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str
    role: str = "contributor"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Chat-related models
class ChatRequest(BaseModel):
    query: str
    initiative_ids: Optional[list[int]] = []

class ChatResponse(BaseModel):
    response: str

class ChatSetupRequest(BaseModel):
    api_key: str

class ChatStatusResponse(BaseModel):
    connected: bool
    needs_setup: bool
    model: Optional[str] = None

class UserAPIKey(BaseModel):
    id: int
    user_id: str
    created_at: datetime
    last_used: Optional[datetime] = None
    usage_count: int = 0
    
    class Config:
        from_attributes = True