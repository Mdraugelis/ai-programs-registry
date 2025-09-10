#!/usr/bin/env python3
import sqlite3
import os
from passlib.context import CryptContext
from database import DATABASE_PATH, get_db
from models import INITIATIVES_TABLE, DOCUMENTS_TABLE, USERS_TABLE, USER_API_KEYS_TABLE

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_database():
    """Initialize the database with tables and default users"""
    
    # Create database directory if it doesn't exist
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute(INITIATIVES_TABLE)
        cursor.execute(DOCUMENTS_TABLE)
        cursor.execute(USERS_TABLE)
        cursor.execute(USER_API_KEYS_TABLE)
        
        # Create indexes for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_initiatives_department 
            ON initiatives(department)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_initiatives_stage 
            ON initiatives(stage)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_initiatives_status 
            ON initiatives(status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_documents_initiative 
            ON documents(initiative_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id 
            ON user_api_keys(user_id)
        """)
        
        # Check if users already exist
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            # Insert default users
            default_users = [
                ("admin", "admin@example.com", pwd_context.hash("admin123"), "admin"),
                ("reviewer", "reviewer@example.com", pwd_context.hash("review123"), "reviewer"),
                ("contributor", "contributor@example.com", pwd_context.hash("contrib123"), "contributor")
            ]
            
            for username, email, password, role in default_users:
                cursor.execute("""
                    INSERT INTO users (username, email, hashed_password, role) 
                    VALUES (?, ?, ?, ?)
                """, (username, email, password, role))
            
            print("Default users created:")
            print("  - admin/admin123 (role: admin)")
            print("  - reviewer/review123 (role: reviewer)")
            print("  - contributor/contrib123 (role: contributor)")
        
        # Insert sample initiatives if table is empty
        cursor.execute("SELECT COUNT(*) FROM initiatives")
        initiative_count = cursor.fetchone()[0]
        
        if initiative_count == 0:
            sample_initiatives = [
                ("AI Chatbot for Customer Service", "Implement an AI-powered chatbot to handle customer inquiries", 
                 "Customer Service", "pilot", "high", "John Doe", "john.doe@example.com",
                 "Reduce response time by 60% and handle 80% of common queries", 
                 "Using GPT-4 API with custom training on our knowledge base"),
                ("Predictive Maintenance System", "ML model to predict equipment failures before they occur",
                 "Operations", "discovery", "medium", "Jane Smith", "jane.smith@example.com",
                 "Reduce unplanned downtime by 40% and maintenance costs by 25%",
                 "Time series analysis using sensor data and LSTM models"),
                ("Document Intelligence Platform", "Automated document processing and information extraction",
                 "Legal", "production", "critical", "Bob Johnson", "bob.johnson@example.com",
                 "Process 10,000 documents daily with 95% accuracy",
                 "OCR with Tesseract, NLP with spaCy, classification with BERT")
            ]
            
            for initiative in sample_initiatives:
                cursor.execute("""
                    INSERT INTO initiatives (
                        name, description, department, stage, priority,
                        lead_name, lead_email, business_value, technical_approach
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, initiative)
            
            print(f"Created {len(sample_initiatives)} sample initiatives")
        
        conn.commit()
        print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()