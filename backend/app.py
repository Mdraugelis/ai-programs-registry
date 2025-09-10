from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional
from database import execute_query, execute_one, execute_insert, execute_update
from models import (
    Initiative, InitiativeCreate, InitiativeUpdate,
    Document, DocumentCreate,
    Token, LoginRequest,
    ChatRequest, ChatResponse, ChatSetupRequest, ChatStatusResponse
)
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES, require_role
)
from chat import (
    validate_claude_api_key, store_user_api_key, get_user_api_key,
    delete_user_api_key, process_chat_query
)

app = FastAPI(title="AI Initiatives Inventory API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File upload configuration
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Authentication endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint that returns JWT token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def read_users_me(current_user = Depends(get_current_active_user)):
    """Get current user information"""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

# Initiative CRUD endpoints
@app.post("/api/initiatives", response_model=Initiative)
async def create_initiative(
    initiative: InitiativeCreate,
    current_user = Depends(get_current_active_user)
):
    """Create a new initiative"""
    query = """
        INSERT INTO initiatives (
            name, description, department, stage, priority,
            lead_name, lead_email, business_value, technical_approach,
            start_date, end_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        initiative.name, initiative.description, initiative.department,
        initiative.stage, initiative.priority, initiative.lead_name,
        initiative.lead_email, initiative.business_value,
        initiative.technical_approach, initiative.start_date,
        initiative.end_date, initiative.status
    )
    
    initiative_id = execute_insert(query, params)
    
    # Fetch and return the created initiative
    result = execute_one("SELECT * FROM initiatives WHERE id = ?", (initiative_id,))
    return dict(result)

@app.get("/api/initiatives", response_model=List[Initiative])
async def list_initiatives(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = None,
    stage: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = Query("active"),
    sort_by: Optional[str] = Query("created_at", regex="^(created_at|updated_at|priority|name)$"),
    sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$"),
    current_user = Depends(get_current_active_user)
):
    """List initiatives with filtering, sorting, and pagination"""
    query = "SELECT * FROM initiatives WHERE 1=1"
    params = []
    
    # Apply filters
    if department:
        query += " AND department = ?"
        params.append(department)
    if stage:
        query += " AND stage = ?"
        params.append(stage)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if status:
        query += " AND status = ?"
        params.append(status)
    
    # Apply sorting
    query += f" ORDER BY {sort_by} {sort_order.upper()}"
    
    # Apply pagination
    query += f" LIMIT {limit} OFFSET {skip}"
    
    results = execute_query(query, tuple(params) if params else None)
    return [dict(row) for row in results]

@app.get("/api/initiatives/{initiative_id}", response_model=Initiative)
async def get_initiative(
    initiative_id: int,
    current_user = Depends(get_current_active_user)
):
    """Get a single initiative by ID"""
    result = execute_one("SELECT * FROM initiatives WHERE id = ?", (initiative_id,))
    if not result:
        raise HTTPException(status_code=404, detail="Initiative not found")
    return dict(result)

@app.put("/api/initiatives/{initiative_id}", response_model=Initiative)
async def update_initiative(
    initiative_id: int,
    initiative: InitiativeUpdate,
    current_user = Depends(get_current_active_user)
):
    """Update an initiative"""
    # Check if initiative exists
    existing = execute_one("SELECT * FROM initiatives WHERE id = ?", (initiative_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    # Build update query dynamically
    update_fields = []
    params = []
    
    for field, value in initiative.dict(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = ?")
            params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow())
        params.append(initiative_id)
        
        query = f"UPDATE initiatives SET {', '.join(update_fields)} WHERE id = ?"
        execute_update(query, tuple(params))
    
    # Return updated initiative
    result = execute_one("SELECT * FROM initiatives WHERE id = ?", (initiative_id,))
    return dict(result)

@app.delete("/api/initiatives/{initiative_id}")
async def delete_initiative(
    initiative_id: int,
    current_user = Depends(require_role("admin"))
):
    """Soft delete an initiative (admin only)"""
    # Check if initiative exists
    existing = execute_one("SELECT * FROM initiatives WHERE id = ?", (initiative_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    # Soft delete by setting status to 'deleted'
    execute_update(
        "UPDATE initiatives SET status = 'deleted', updated_at = ? WHERE id = ?",
        (datetime.utcnow(), initiative_id)
    )
    
    return {"message": "Initiative deleted successfully"}

# Document management endpoints
@app.post("/api/upload")
async def upload_document(
    initiative_id: int = Form(...),
    document_type: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user = Depends(get_current_active_user)
):
    """Upload a document for an initiative"""
    # Check if initiative exists
    initiative = execute_one("SELECT * FROM initiatives WHERE id = ?", (initiative_id,))
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Save file
    filename = f"{initiative_id}_{datetime.utcnow().timestamp()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Save to database
    doc_id = execute_insert(
        """INSERT INTO documents (
            initiative_id, filename, file_path, file_size, 
            uploaded_by, document_type
        ) VALUES (?, ?, ?, ?, ?, ?)""",
        (
            initiative_id, file.filename, filename, len(contents),
            current_user["username"], document_type
        )
    )
    
    return {
        "id": doc_id,
        "filename": file.filename,
        "size": len(contents),
        "message": "Document uploaded successfully"
    }

@app.get("/api/documents/{document_id}")
async def download_document(
    document_id: int,
    current_user = Depends(get_current_active_user)
):
    """Download a document"""
    document = execute_one("SELECT * FROM documents WHERE id = ?", (document_id,))
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = os.path.join(UPLOAD_DIR, document["file_path"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        file_path,
        filename=document["filename"],
        media_type="application/octet-stream"
    )

@app.get("/api/initiatives/{initiative_id}/documents", response_model=List[Document])
async def list_initiative_documents(
    initiative_id: int,
    current_user = Depends(get_current_active_user)
):
    """List all documents for an initiative"""
    documents = execute_query(
        "SELECT * FROM documents WHERE initiative_id = ? ORDER BY uploaded_at DESC",
        (initiative_id,)
    )
    return [dict(doc) for doc in documents]

# Export endpoint
@app.get("/api/export/csv")
async def export_initiatives_csv(
    current_user = Depends(get_current_active_user)
):
    """Export all initiatives as CSV"""
    import csv
    import io
    
    initiatives = execute_query(
        "SELECT * FROM initiatives WHERE status != 'deleted' ORDER BY created_at DESC"
    )
    
    output = io.StringIO()
    if initiatives:
        fieldnames = initiatives[0].keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for initiative in initiatives:
            writer.writerow(dict(initiative))
    
    response = output.getvalue()
    output.close()
    
    return response

# Chat endpoints

@app.post("/api/chat/setup")
async def setup_claude_api_key(
    request: ChatSetupRequest,
    current_user = Depends(get_current_active_user)
):
    """Setup user's Claude API key"""
    # Validate the API key
    if not validate_claude_api_key(request.api_key):
        raise HTTPException(status_code=400, detail="Invalid Claude API key")
    
    # Store the encrypted key
    if not store_user_api_key(current_user["username"], request.api_key):
        raise HTTPException(status_code=500, detail="Failed to store API key")
    
    return {"status": "connected", "model": "claude-3-5-sonnet-20240620"}

@app.get("/api/chat/status", response_model=ChatStatusResponse)
async def get_chat_status(current_user = Depends(get_current_active_user)):
    """Check if user has Claude API key configured"""
    api_key = get_user_api_key(current_user["username"])
    has_key = api_key is not None
    
    return {
        "connected": has_key,
        "needs_setup": not has_key,
        "model": "claude-3-5-sonnet-20240620" if has_key else None
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_claude(
    request: ChatRequest,
    current_user = Depends(get_current_active_user)
):
    """Process chat query using user's Claude API key"""
    # Get initiatives context if IDs provided
    initiatives = []
    if request.initiative_ids:
        id_placeholders = ','.join(['?'] * len(request.initiative_ids))
        initiatives = execute_query(
            f"SELECT * FROM initiatives WHERE id IN ({id_placeholders}) AND status != 'deleted'",
            request.initiative_ids
        )
        initiatives = [dict(init) for init in initiatives]
    
    # Process the chat query
    result = process_chat_query(current_user["username"], request.query, initiatives)
    
    if "error" in result:
        if "API key" in result["error"]:
            raise HTTPException(status_code=403, detail=result["error"])
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    
    return {"response": result["response"]}

@app.delete("/api/chat/disconnect")
async def disconnect_claude(current_user = Depends(get_current_active_user)):
    """Remove user's Claude API key"""
    if not delete_user_api_key(current_user["username"]):
        raise HTTPException(status_code=500, detail="Failed to remove API key")
    
    return {"status": "disconnected"}

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Static file serving for production
static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    @app.get("/")
    async def serve_spa():
        """Serve the React SPA"""
        return FileResponse(os.path.join(static_dir, "index.html"))
    
    @app.get("/{full_path:path}")
    async def serve_spa_routes(full_path: str):
        """Catch all for React Router"""
        # If it's an API route, let it pass through
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("health"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Check if file exists in static directory
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise serve index.html for React Router
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    # Development mode - just show API info
    @app.get("/")
    async def root():
        """API root endpoint"""
        return {
            "name": "AI Initiatives Inventory API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)