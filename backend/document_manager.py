"""
Document management utilities for three-tier document system
"""
import os
import shutil
from typing import Optional, Dict, List
from datetime import datetime
from pathlib import Path

# Base upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

def ensure_directory_structure():
    """Ensure all required directories exist"""
    # Admin directories
    admin_dirs = [
        os.path.join(UPLOAD_DIR, "admin", "policies"),
        os.path.join(UPLOAD_DIR, "admin", "templates"),
        os.path.join(UPLOAD_DIR, "admin", "howtos")
    ]
    
    for dir_path in admin_dirs:
        os.makedirs(dir_path, exist_ok=True)
    
    # Initiatives directory
    os.makedirs(os.path.join(UPLOAD_DIR, "initiatives"), exist_ok=True)

def get_initiative_directories(initiative_id: int):
    """Create and return initiative-specific directories"""
    base_path = os.path.join(UPLOAD_DIR, "initiatives", str(initiative_id))
    
    core_path = os.path.join(base_path, "core")
    core_required_path = os.path.join(core_path, "required")
    core_optional_path = os.path.join(core_path, "optional")
    ancillary_path = os.path.join(base_path, "ancillary")
    
    # Create directories if they don't exist
    for path in [core_required_path, core_optional_path, ancillary_path]:
        os.makedirs(path, exist_ok=True)
    
    return {
        "base": base_path,
        "core": core_path,
        "core_required": core_required_path,
        "core_optional": core_optional_path,
        "ancillary": ancillary_path
    }

def get_document_path(library_type: str, category: Optional[str] = None, 
                     initiative_id: Optional[int] = None, is_required: bool = False) -> str:
    """Get the appropriate file path based on document type and category"""
    
    if library_type == "admin":
        if category == "policy":
            return os.path.join(UPLOAD_DIR, "admin", "policies")
        elif category == "template":
            return os.path.join(UPLOAD_DIR, "admin", "templates")
        elif category == "howto":
            return os.path.join(UPLOAD_DIR, "admin", "howtos")
        else:
            return os.path.join(UPLOAD_DIR, "admin")
    
    elif library_type == "core" and initiative_id:
        dirs = get_initiative_directories(initiative_id)
        if is_required:
            return dirs["core_required"]
        else:
            return dirs["core_optional"]
    
    elif library_type == "ancillary" and initiative_id:
        dirs = get_initiative_directories(initiative_id)
        return dirs["ancillary"]
    
    else:
        # Fallback to root uploads directory
        return UPLOAD_DIR

def save_document_file(file_content: bytes, filename: str, library_type: str,
                      category: Optional[str] = None, initiative_id: Optional[int] = None,
                      is_required: bool = False) -> str:
    """Save a document file to the appropriate location"""
    
    # Get the target directory
    target_dir = get_document_path(library_type, category, initiative_id, is_required)
    
    # Generate unique filename with timestamp
    timestamp = datetime.utcnow().timestamp()
    unique_filename = f"{timestamp}_{filename}"
    
    # Full file path
    file_path = os.path.join(target_dir, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Return relative path from uploads directory
    return os.path.relpath(file_path, UPLOAD_DIR)

def copy_template_file(template_path: str, initiative_id: int, new_filename: str,
                      is_required: bool = True) -> str:
    """Copy a template file to an initiative's core documents"""
    
    # Get source file
    source_path = os.path.join(UPLOAD_DIR, template_path)
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Template file not found: {template_path}")
    
    # Get target directory
    dirs = get_initiative_directories(initiative_id)
    target_dir = dirs["core_required"] if is_required else dirs["core_optional"]
    
    # Generate unique filename
    timestamp = datetime.utcnow().timestamp()
    unique_filename = f"{timestamp}_{new_filename}"
    target_path = os.path.join(target_dir, unique_filename)
    
    # Copy the file
    shutil.copy2(source_path, target_path)
    
    # Return relative path
    return os.path.relpath(target_path, UPLOAD_DIR)

def get_document_full_path(relative_path: str) -> str:
    """Get full file path from relative path"""
    return os.path.join(UPLOAD_DIR, relative_path)

def delete_document_file(relative_path: str) -> bool:
    """Delete a document file (move to archived folder)"""
    source_path = os.path.join(UPLOAD_DIR, relative_path)
    
    if not os.path.exists(source_path):
        return False
    
    # Create archived directory
    archive_dir = os.path.join(UPLOAD_DIR, ".archived")
    os.makedirs(archive_dir, exist_ok=True)
    
    # Move file to archive with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = os.path.basename(source_path)
    archive_path = os.path.join(archive_dir, f"{timestamp}_{filename}")
    
    shutil.move(source_path, archive_path)
    return True

def list_admin_documents(category: Optional[str] = None) -> List[Dict]:
    """List all admin documents"""
    documents = []
    
    if category:
        search_dir = get_document_path("admin", category)
        search_dirs = [search_dir] if os.path.exists(search_dir) else []
    else:
        # Search all admin directories
        search_dirs = [
            os.path.join(UPLOAD_DIR, "admin", "policies"),
            os.path.join(UPLOAD_DIR, "admin", "templates"),
            os.path.join(UPLOAD_DIR, "admin", "howtos")
        ]
    
    for dir_path in search_dirs:
        if not os.path.exists(dir_path):
            continue
            
        category_name = os.path.basename(dir_path)
        for filename in os.listdir(dir_path):
            file_path = os.path.join(dir_path, filename)
            if os.path.isfile(file_path):
                rel_path = os.path.relpath(file_path, UPLOAD_DIR)
                documents.append({
                    "filename": filename,
                    "relative_path": rel_path,
                    "category": category_name,
                    "size": os.path.getsize(file_path),
                    "modified": datetime.fromtimestamp(os.path.getmtime(file_path))
                })
    
    return documents

def list_initiative_documents(initiative_id: int, library_type: Optional[str] = None) -> List[Dict]:
    """List all documents for an initiative"""
    documents = []
    dirs = get_initiative_directories(initiative_id)
    
    if library_type == "core" or not library_type:
        # List core documents
        for subtype, path in [("required", dirs["core_required"]), 
                             ("optional", dirs["core_optional"])]:
            if not os.path.exists(path):
                continue
                
            for filename in os.listdir(path):
                file_path = os.path.join(path, filename)
                if os.path.isfile(file_path):
                    rel_path = os.path.relpath(file_path, UPLOAD_DIR)
                    documents.append({
                        "filename": filename,
                        "relative_path": rel_path,
                        "library_type": "core",
                        "is_required": subtype == "required",
                        "size": os.path.getsize(file_path),
                        "modified": datetime.fromtimestamp(os.path.getmtime(file_path))
                    })
    
    if library_type == "ancillary" or not library_type:
        # List ancillary documents
        path = dirs["ancillary"]
        if os.path.exists(path):
            for filename in os.listdir(path):
                file_path = os.path.join(path, filename)
                if os.path.isfile(file_path):
                    rel_path = os.path.relpath(file_path, UPLOAD_DIR)
                    documents.append({
                        "filename": filename,
                        "relative_path": rel_path,
                        "library_type": "ancillary",
                        "is_required": False,
                        "size": os.path.getsize(file_path),
                        "modified": datetime.fromtimestamp(os.path.getmtime(file_path))
                    })
    
    return documents

# Initialize directory structure on module import
ensure_directory_structure()