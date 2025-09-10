import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from cryptography.fernet import Fernet
from anthropic import Anthropic
from database import execute_query, execute_one, execute_insert, execute_update

# Generate or get encryption key from environment
def get_encryption_key() -> bytes:
    """Get or generate encryption key for API keys"""
    key_str = os.getenv("CHAT_ENCRYPTION_KEY")
    if not key_str:
        # Generate a new key for development
        key = Fernet.generate_key()
        print(f"Generated new encryption key: {key.decode()}")
        print("Add this to your .env file as CHAT_ENCRYPTION_KEY=<key>")
        return key
    return key_str.encode()

# Initialize Fernet cipher
ENCRYPTION_KEY = get_encryption_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_api_key(api_key: str) -> str:
    """Encrypt API key for secure storage"""
    return cipher_suite.encrypt(api_key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt stored API key"""
    return cipher_suite.decrypt(encrypted_key.encode()).decode()

def validate_claude_api_key(api_key: str) -> bool:
    """Validate Claude API key by making a test call"""
    try:
        # Initialize client with minimal parameters to avoid proxy issues
        client = Anthropic(
            api_key=api_key,
            timeout=30.0
        )
        # Test with a simple message using the cheapest model
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=10,
            messages=[{"role": "user", "content": "Hi"}]
        )
        return True
    except Exception as e:
        print(f"API key validation failed: {e}")
        return False

def store_user_api_key(user_id: str, api_key: str) -> bool:
    """Store encrypted API key for user"""
    try:
        encrypted_key = encrypt_api_key(api_key)
        
        # Check if user already has a key
        existing = execute_one(
            "SELECT id FROM user_api_keys WHERE user_id = ?", 
            (user_id,)
        )
        
        if existing:
            # Update existing key
            execute_update(
                "UPDATE user_api_keys SET encrypted_claude_key = ?, created_at = ? WHERE user_id = ?",
                (encrypted_key, datetime.now(), user_id)
            )
        else:
            # Insert new key
            execute_insert(
                "INSERT INTO user_api_keys (user_id, encrypted_claude_key) VALUES (?, ?)",
                (user_id, encrypted_key)
            )
        
        return True
    except Exception as e:
        print(f"Failed to store API key: {e}")
        return False

def get_user_api_key(user_id: str) -> Optional[str]:
    """Get decrypted API key for user"""
    try:
        result = execute_one(
            "SELECT encrypted_claude_key FROM user_api_keys WHERE user_id = ?",
            (user_id,)
        )
        
        if result:
            return decrypt_api_key(result["encrypted_claude_key"])
        return None
    except Exception as e:
        print(f"Failed to get API key: {e}")
        return None

def delete_user_api_key(user_id: str) -> bool:
    """Delete user's API key"""
    try:
        execute_update(
            "DELETE FROM user_api_keys WHERE user_id = ?",
            (user_id,)
        )
        return True
    except Exception as e:
        print(f"Failed to delete API key: {e}")
        return False

def update_key_usage(user_id: str) -> None:
    """Update last_used timestamp and usage count"""
    try:
        execute_update(
            "UPDATE user_api_keys SET last_used = ?, usage_count = usage_count + 1 WHERE user_id = ?",
            (datetime.now(), user_id)
        )
    except Exception as e:
        print(f"Failed to update key usage: {e}")

def format_initiatives_context(initiatives: List[Dict]) -> str:
    """Format initiatives data for Claude context"""
    if not initiatives:
        return "No initiatives are currently visible in the table."
    
    context = f"Currently viewing {len(initiatives)} AI initiatives:\n\n"
    
    for init in initiatives:
        context += f"Initiative: {init.get('title', 'N/A')}\n"
        context += f"  Owner: {init.get('program_owner', 'N/A')}\n"
        context += f"  Department: {init.get('department', 'N/A')}\n"
        context += f"  Stage: {init.get('stage', 'N/A')}\n"
        if init.get('background'):
            context += f"  Background: {init.get('background')}\n"
        if init.get('goal'):
            context += f"  Goal: {init.get('goal')}\n"
        context += "\n"
    
    return context

def process_chat_query(user_id: str, query: str, initiatives: List[Dict]) -> Dict:
    """Process chat query using user's API key"""
    try:
        # Get user's API key
        api_key = get_user_api_key(user_id)
        if not api_key:
            return {"error": "No API key configured. Please set up your Claude API key first."}
        
        # Create Claude client
        client = Anthropic(
            api_key=api_key,
            timeout=30.0
        )
        
        # Format context
        context = format_initiatives_context(initiatives)
        
        # Create prompt
        full_prompt = f"""You are an AI assistant helping users analyze and understand AI initiatives in their organization. 

Context:
{context}

User Question: {query}

Please provide a helpful response based on the initiative data shown above. If the question is about specific initiatives, reference them by name. Be concise but informative."""

        # Call Claude API
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1000,
            messages=[{"role": "user", "content": full_prompt}]
        )
        
        # Update usage statistics
        update_key_usage(user_id)
        
        return {
            "response": response.content[0].text,
            "success": True
        }
        
    except Exception as e:
        error_msg = str(e)
        if "authentication" in error_msg.lower() or "api_key" in error_msg.lower():
            # Invalid API key, remove it
            delete_user_api_key(user_id)
            return {"error": "API key appears to be invalid or expired. Please reconfigure your Claude API key."}
        
        return {"error": f"Chat processing failed: {error_msg}"}