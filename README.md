# HackQuest • National Health Resource Operations Dashboard (NHRM-India)

A public health incident command, national logistics orchestration, and district surveillance platform built for the Ministry of Health & Family Welfare (MoHFW), Government of India.

---

## 🌟 Overview

This repository contains two main components:

- `backend/` — FastAPI backend, AI/ML pipelines, federated learning and optimization services.
- `crisis-dashboard/` — React + TypeScript frontend (Vite) for the operational dashboard.

The platform provides national and subnational visibility into PHC stock, bed availability, automated redistribution, and federated forecasting.

---

## 🚀 Getting Started

Choose one of the components below to run locally.

### Backend (FastAPI + ML)

Prerequisites:
- Python 3.10+
- PostgreSQL running (default host `localhost:5432`, database name `nhrm_india`)

Quick start:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # PowerShell
pip install -r requirements.txt
```

Seed DB and train local models:

```powershell
python scripts/seed_and_train.py
```

Start the API server:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: http://127.0.0.1:8000/docs

Run tests:

```powershell
pytest -v tests/test_api.py
```

See [backend/README.md](backend/README.md#L1) for full backend details.

### Frontend (crisis-dashboard)

Prerequisites:
- Node.js 18+ and npm (or pnpm)

Quick start:

```bash
cd crisis-dashboard
npm install
# start dev server (example host/port used by local tasks)
npm run dev -- --host 127.0.0.1 --port 8080
```

Open the dashboard at http://127.0.0.1:8080

There are convenience scripts at the repo root for development:
- `start-dev.bat` / `start-dev.ps1` — start both backend and frontend in a local dev configuration.

To start the full development environment and open the dashboard in your browser run (PowerShell):

```powershell
.\start-dev.ps1 -OpenBrowser
```

---

## 🧪 Testing & Validation

- Backend integration tests: run `pytest -v tests/test_api.py` from `backend/`.
- Frontend: unit and integration tests (if present) are in `crisis-dashboard/`.

End-to-end smoke pipeline (backend):

```powershell
python backend/scripts/run_pipeline.py
```

---

## 🛠️ Technology Stack
- Backend: FastAPI, SQLAlchemy (async), Pydantic v2, Flower (federated learning), XGBoost, Google OR-Tools
- Frontend: React + TypeScript, Vite, Tailwind CSS

---

## Contributing

If you plan to contribute, please:

1. Read `DESIGN.md` for UI/UX guidelines.
2. Follow existing code patterns in `backend/app/` and `crisis-dashboard/src/`.
3. Open issues or draft PRs describing intended changes.

---

If you'd like I can also: add a short developer quickstart script, wire up a `Makefile`/`composer.json`, or create developer-focused documentation pages. Reply with which you'd prefer.
