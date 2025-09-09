from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Database table schemas as SQL
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