# AI Atlas

AI Atlas is a single, easy-to-use workspace for cataloging the artificial intelligence projects that live inside your organisation. It replaces scattered spreadsheets and manual slide decks with one hub that tracks every initiative, the documents that prove it is safe and compliant, and the status updates leadership needs.

---

## What You Get
- **Live registry of initiatives** – capture who owns each project, the problem it solves, and where it sits in the delivery lifecycle.
- **Document library with governance guardrails** – organise fact sheets, validation reports, model cards, and other evidence so audits are painless.
- **Compliance tracker** – see at a glance which initiatives still owe mandatory artefacts and follow up before launch dates slip.
- **Portfolio dashboards** – filter, search, and export curated views for executives, governance committees, or delivery teams.
- **AI assistance (opt-in)** – securely store an API key to receive contextual suggestions, validation tips, and portfolio summaries powered by Claude.

---

## Who It’s For
- **Programme owners** who need to keep initiatives moving and paperwork complete.
- **Governance and risk teams** looking for transparent evidence that policies are met.
- **Executives** who want a portfolio view without waiting for ad‑hoc slide decks.
- **Data science and product teams** tracking experiments as they mature into production services.

Roles are baked in from day one:
- `Admin` – configure the workspace, manage templates, archive projects.
- `Reviewer` – approve governance artefacts and flag gaps.
- `Contributor` – create initiatives, upload documents, request reviews.
- `Viewer` – browse read-only dashboards and reports.

---

## A Quick Tour

### 1. Initiative Registry
Every project lives in the registry. Search, sort, or filter by department, lifecycle stage, risk level, or owner. Click through for a full profile with status history, business value, and technical approach notes.

### 2. Document Library
Upload and version governance artefacts with simple drag-and-drop. Required templates are provided for common items such as Model Fact Sheets, Validation Reports, and Equity Assessments. Each document records who uploaded it, when it changed, and which initiative it supports.

### 3. Compliance Tracker
Visualise completeness across mandatory artefacts. Red/yellow/green indicators show which projects are clear for review and which still need attention. Generate a governance report for leadership with a single click.

### 4. Dashboards & Exports
Portfolio dashboards highlight volumes by department, stage, or risk category. Export CSVs for deeper analysis or share directly with executives.

### 5. AI Assistant *(optional)*
Store an Anthropic API key to unlock conversational help. Ask for initiative summaries, missing-document reminders, or policy guidance. Keys are encrypted and can be removed by the user at any time.

---

## Getting Started Locally

1. **Install prerequisites**
   - Python 3.10+
   - Node 20+
   - (Optional) Docker if you prefer container deployment

2. **Set up the backend**
   ```bash
   python3.10 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python backend/init_db.py        # seeds default data and accounts
   uvicorn backend.app:app --host 127.0.0.1 --port 8000
   ```
   Default sign-ins after the seed:
   - Admin: `admin / admin123`
   - Reviewer: `reviewer / review123`
   - Contributor: `contributor / contrib123`

3. **Launch the web app**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` and sign in with one of the sample accounts.

4. **Optional: Docker one-liner**
   ```bash
   docker build -t ai-atlas .
   docker run --rm -p 8000:8000 ai-atlas
   ```
   (The container bundles the React build and FastAPI service.)

---

## Everyday Tasks
- **Add a new initiative** – click *New Initiative*, complete the intake form, and assign an owner.
- **Upload governance evidence** – open the initiative detail page, drop files into the document area, and mark whether they satisfy required artefacts.
- **Check compliance** – visit the Compliance tab to view which artefacts are missing, leave review notes, or generate an export for auditors.
- **Share a portfolio snapshot** – apply filters, export CSV/slide data, or invite executives as `Viewers` for self-service access.
- **Use the AI assistant** – within the Assistant drawer, paste an Anthropic key (Claude), then ask for summaries, missing-document checks, or action lists.

---

## Data & Security Notes
- SQLite is the default datastore for quick start; swap in PostgreSQL for production via environment variables.
- Uploaded files live under `uploads/` by default. Configure AWS S3 credentials when you are ready to move to managed storage.
- JWT-based authentication secures the API. Tokens expire after 24 hours of inactivity.
- API keys for the AI assistant are stored encrypted and can only be accessed by the user who supplied them.

---

## Need to Customise?
- Adjust initiative stages, document templates, and required artefacts under the Admin views.
- Extend the REST API or wire it into analytics tools via the FastAPI schema at `/docs`.
- Infrastructure-as-code samples (Railway, Nixpacks) are included for cloud deployment.

---

Built to give healthcare and enterprise teams an immediate, transparent view of their AI portfolio—without waiting for a long platform project.
