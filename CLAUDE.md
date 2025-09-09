# CLAUDE.md - Geisinger AI Initiatives Inventory

## 🎯 Mission
Build working AI initiatives tracker in 2 weeks. Replace MS Lists. Serve 50 users, 10 concurrent max.

## ⚡ Critical Rules
* **NEVER**: Over-engineer. SQLite is FINE for production.
* **NEVER**: Add features not in PRD
* **ALWAYS**: Test integration after each feature
* **ALWAYS**: Choose simple over clever
* **DEADLINE**: Week 1 MVP must ship

## 📁 Project Structure
```
geisinger-ai-inventory/
├── backend/
│   ├── app.py          # FastAPI (~500 lines MAX)
│   ├── models.py       # SQLAlchemy (~100 lines)
│   └── database.db     # SQLite database
├── frontend/
│   ├── src/
│   └── package.json
├── uploads/            # Local file storage
└── docs/
    ├── PRD.md          # Product requirements
    ├── API.md          # API documentation
    └── DEPLOY.md       # Deployment guide
```

## 🚀 Slash Commands

### Setup & Development
* `/init-db` - Create SQLite tables
* `/start-backend` - `cd backend && uvicorn app:app --reload`
* `/start-frontend` - `cd frontend && npm start`
* `/test-integration` - `python test_integration.py`

### Feature Implementation
* `/add-crud [entity]` - Generate CRUD endpoints
* `/add-form [entity]` - Generate React form component
* `/add-validation [field]` - Add field validation

### Testing & Deployment
* `/test-all` - Run all integration tests
* `/export-csv` - Test CSV export functionality
* `/check-uploads` - Verify file upload system

## 📝 Code Patterns

### Database Operations
```python
# ✅ GOOD - Simple, works
conn = get_db()
result = conn.execute("SELECT * FROM initiatives")
conn.close()

# ❌ BAD - Over-engineered
# No ORMs, no async, no connection pools
```

### File Uploads
```python
# Week 1: Local storage only
file_path = f"uploads/{initiative_id}_{filename}"

# Week 3: Add S3 (IF needed)
# Week 4: Add virus scan (IF required)
```

### API Endpoints
```python
# Required Week 1 Endpoints
GET    /initiatives
POST   /initiatives
GET    /initiatives/{id}
PUT    /initiatives/{id}
POST   /upload
GET    /documents/{id}
```

## 👥 Developer Assignments

### Developer A: Backend CRUD
* Create FastAPI app
* Set up SQLite database
* Implement initiatives CRUD
* Add CSV export

### Developer B: Frontend UI
* Create React app with Tailwind
* Build initiatives list table
* Create intake form
* Add search/filter

### Developer C: Documents
* Implement file upload API
* Create document list view
* Add download functionality
* Build document table UI

## 🧪 Integration Checkpoints

### Daily Schedule
**Morning (5 min)**
* Pull latest code
* Run `/test-integration`
* Fix any breaks

**Afternoon (15 min)**
* Merge feature branches
* Run full test suite
* Deploy to test server

**Before Commit**
* ✅ Integration tests pass
* ✅ Frontend connects to backend
* ✅ File uploads work
* ✅ Database operations complete

## 🔧 Quick Fixes

### CORS Error
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"])
```

### SQLite Locked
```python
# Always use try/finally
try:
    # database operations
finally:
    conn.close()
```

### Large Upload Fails
```python
# app.py
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
```

## 📊 Week 1 Deliverables

**Must Have:**
- [ ] SQLite database working
- [ ] CRUD API endpoints
- [ ] File upload/download
- [ ] React list view
- [ ] Basic intake form
- [ ] CSV export

**Don't Build:**
- Real-time updates
- Complex permissions
- Mobile app
- Microservices
- Advanced analytics

## 🤖 AI Assistant Prompts

### Backend Feature
```
Create simple FastAPI endpoint for [feature].
Context: SQLite, 10 concurrent users, no over-engineering.
```

### Frontend Component
```
Create React component for [feature] using Tailwind.
Keep in single file. Focus on function over form.
```

### Debugging
```
Fix [error] in simple FastAPI/SQLite app.
Solution should be simple, not enterprise-grade.
```

## 📚 Key Documentation

### Internal Docs
* **Requirements**: `/docs/PRD.md`
* **API Spec**: `/docs/API.md`
* **Deployment**: `/docs/DEPLOY.md`
* **Testing**: `/docs/TESTING.md`

### External Resources
* FastAPI: https://fastapi.tiangolo.com/
* React: https://react.dev/
* SQLite: https://sqlite.org/docs.html
* Tailwind: https://tailwindcss.com/docs

## ⚠️ Anti-Patterns to Avoid

**DON'T:**
* Abstract database operations
* Create service layers
* Add dependency injection
* Use complex auth (Week 1)
* Implement caching
* Add message queues
* Create microservices

**DO:**
* Direct database queries
* Simple functions
* Hardcoded config (initially)
* Basic JWT tokens
* Local file storage
* Single server
* Monolithic app

## 🎯 Success Metrics

### Week 1
* All initiatives migrated from MS Lists
* Users can upload documents
* Basic dashboard visible
* CSV export works

### Week 2
* Document versioning added
* Required artifacts checklist
* Simple dashboards
* Rule validation

## 💡 Remember

**Ship It > Perfect It**

* Working today > Perfect tomorrow
* 10 users don't need enterprise architecture
* Simple code = Less bugs
* Direct approach = Faster delivery

---

## Version History
* v1.0 - Initial MVP requirements
* v1.1 - Added document management
* v1.2 - Integration test patterns

## Local Customization
Create `CLAUDE.local.md` for personal preferences (gitignored)
