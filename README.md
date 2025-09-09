# AI Atlas

A lightweight, intelligent web application for cataloging, tracking, and reporting on AI initiatives across healthcare organizations. Built to replace Microsoft Lists with a purpose-built solution that enforces AI governance requirements, enables executive visibility, and provides conversational AI assistance through progressive enhancement.

## 🎯 Vision & Purpose

**Vision**: Create a centralized, intelligent registry that transforms how healthcare organizations manage their AI portfolio - from initial ideas through production deployments - while ensuring compliance, transparency, and continuous improvement.

**Core Objectives**:
- **Centralized Registry** - Single source of truth for all AI initiatives
- **Governance Alignment** - Enforce compliance with AI governance policies (risk intake, human-in-the-loop, equity, transparency, monitoring)
- **Executive Transparency** - Automated dashboards and slide generation for leadership visibility
- **Progressive Intelligence** - AI Assistant support that evolves from rule-based validation to conversational guidance
- **Seamless Integration** - Export APIs for analytics and MCP-based conversational interfaces

## ✨ Key Features

### Core Capabilities
- **Initiative Registry** - Comprehensive catalog with sort/filter/search by owner, department, risk category, and lifecycle stage
- **Smart Intake Forms** - Progressive enhancement from basic validation to AI-assisted completeness checking
- **Document Library** - Integrated document management for governance artifacts with versioning and compliance tracking
- **Executive Dashboards** - Real-time portfolio views with automated slide pack generation
- **Permissions & Sharing** - Entry-level RBAC (Viewer, Contributor, Admin)

### AI Assistant Integration (Progressive Enhancement)
- **Phase 1**: Rule-based validation and completeness checking
- **Phase 2**: LLM-powered intake assistance and suggestions
- **Phase 3**: Conversational access via MCP (Model Context Protocol) tools
- **Phase 4**: Automated insights and governance recommendations

### Document Management Features
- Drag & drop multi-file upload (50MB initial, 250MB eventual)
- Version control with immutable history
- Required governance artifacts checklist per lifecycle stage
- Document types: Program Definition, Design Docs, Model Fact Sheets, Validation Reports, Equity Audits, Monitoring Plans
- Automated compliance status indicators (✅/⚠️)

## 🏗️ Architecture

### "Keep It Stupidly Simple" Stack 🚀
Built for simplicity and rapid deployment while maintaining enterprise capability:

```
Tech Stack:
- Database: SQLite (yes, even in production!)
- Backend: FastAPI
- Frontend: React + Tailwind CSS
- Storage: Local filesystem → S3 (when needed)
- Auth: Simple JWT → LDAP integration (progressive)
- Deployment: Single EC2 t3.small instance
- AI: Rule-based → LLM integration (progressive)
```

### Project Structure
```
ai-atlas/
├── app.py              # FastAPI application (~500 lines)
├── database.db         # SQLite database
├── uploads/            # Document storage
├── frontend/           # React application
│   └── build/         # Production build
├── .env               # Configuration
├── requirements.txt   # Python dependencies
└── README.md          # Documentation
```

## 📊 Implementation Phases

### Phase 1: Core MVP (Weeks 1-2)
**Goal**: Replace MS Lists basic functionality
- ✅ Simple CRUD for initiatives
- ✅ File upload/download capability
- ✅ Basic authentication
- ✅ CSV export functionality
- ✅ List view with filtering

### Phase 2: Governance Features (Weeks 3-4)
**Goal**: Add compliance tracking
- 📋 Document versioning
- 📋 Required artifacts checklist
- 📋 Rule-based validation
- 📋 Basic dashboards (Plotly)
- 📋 Audit logging

### Phase 3: Intelligence Layer (Weeks 5-6)
**Goal**: Add AI capabilities
- 🤖 LLM integration for intake assistance
- 🤖 Automated slide generation
- 🤖 MCP API endpoints for conversational access
- 🤖 Smart completeness checking
- 🤖 Contextual help and suggestions

### Phase 4: Production Hardening (As Needed)
**Goal**: Enterprise readiness
- 🔐 AD/LDAP integration
- ☁️ S3 migration for documents
- 🛡️ Virus scanning integration
- 📈 Advanced analytics
- 🔄 Full audit log export

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Mdraugelis/ai-programs-registry
cd ai-programs-registry

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Navigate to http://localhost:8000
```

## 📈 Success Metrics

- **Adoption**: 100% initiatives migrated from MS Lists within 30 days
- **Governance Compliance**: 80% initiatives with required documents
- **Transparency**: Dashboard viewed weekly by leadership
- **Efficiency**: Leadership updates reduced from days to minutes
- **Developer Success**: Junior team ships MVP in 2 weeks

## 🔒 Non-Functional Requirements

- **Performance**: Page loads <200ms, Dashboard generation <500ms
- **Scalability**: Supports hundreds of initiatives, ~50 total users
- **Security**: HIPAA compliant, complete audit trails
- **Availability**: 99.9% uptime for 10 concurrent users
- **Simplicity**: Deployable by junior developers

## 🎯 Target Users

- **Executive Leadership**: Portfolio dashboards and automated reporting
- **AI Governance Committees**: Risk and compliance visibility
- **Data Science & MLOps Teams**: Model metadata and deployment tracking
- **Clinical & Operational Leaders**: Workflow transparency
- **Program Owners**: Initiative documentation and progress tracking

Expected Usage: ~50 total users, maximum 10 concurrent users

## 🛠️ Technology Decisions

### Why This Stack?
- **SQLite**: Perfect for 50 users, zero configuration, surprisingly capable
- **FastAPI**: Modern Python framework with automatic API documentation
- **React**: Familiar frontend with vast ecosystem
- **Local Storage → S3**: Start simple, scale when needed
- **Progressive Enhancement**: Add complexity only when value is proven

### What We're NOT Building (MVP)
- Real-time collaboration features
- Mobile applications
- Advanced ML/analytics
- Microservices architecture
- Kubernetes orchestration
- Complex authentication (initially)

These can be added IF and WHEN needed, not before.

## 📝 API & Integration

### REST API Endpoints
- Initiative CRUD operations
- Document upload/download
- Dashboard data export
- Audit log access

### MCP Tools (Phase 3)
- `inventory.initiatives.list` - Query initiatives
- `inventory.initiatives.get` - Get initiative details
- `inventory.docs.list` - List documents
- `inventory.docs.get` - Retrieve documents

## 🤝 Contributing

This project embraces simplicity and pragmatic solutions. When contributing:
1. Prioritize working code over perfect architecture
2. Add complexity only when proven necessary
3. Document decisions and trade-offs
4. Keep the junior developer in mind

## 📄 License

Internal healthcare organization use only. Not for redistribution.

---

Built with ❤️ for healthcare AI governance - delivering 100% of business value with 10% of typical complexity.