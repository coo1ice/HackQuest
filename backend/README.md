# Federated AI Platform for National PHC Health Resource & Supply Chain Management
## Backend + API + AI/ML Engine (SRS v2.0 Implementation)

This backend system provides national-scale, real-time visibility into Primary Health Centre (PHC) medicine stock, bed availability, and staff attendance across India. It incorporates:
1. **Predictive AI (XGBoost)**: 7-day medicine demand forecasting & stockout risk classification trained without temporal leakage.
2. **Federated Learning (Flower FedAvg)**: Multi-state parameter aggregation enabling collective model improvement without centralizing sensitive state telemetry.
3. **Operations Research (Google OR-Tools CP-SAT)**: Transportation optimization solving cross-facility reallocations considering distances, expiry dates, and clinical urgency.
4. **Strict Transfer State Machine & Closed Feedback Loop**: Transitioning orders (`approved` -> `dispatched` -> `received`) and feeding post-delivery efficacy metrics into model validation.
5. **Role-Based Access Control (RBAC) & Immutable Audit Trail**: Multi-tiered security for National Admins, State Officers, District Officers, and PHC Staff.

---

## 1. Quick Start

### Prerequisites
- Python 3.10+ (Tested with Python 3.14.7)
- Local PostgreSQL instance running on `localhost:5432` with database `nhrm_india`

### Virtual Environment Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Database Initialization & Synthetic Seeding
Run the automated seed and model training script:
```powershell
python scripts/seed_and_train.py
```
This will:
- Initialize all 13 tables in local PostgreSQL `nhrm_india`.
- Seed 4 RBAC users with credentials.
- Seed 48 PHCs across Bihar, Assam, Odisha, and Maharashtra with 90-day telemetry records.
- Train state-siloed XGBoost models saved to `ml/models/`.
- Pre-populate active forecasts and OR-Tools optimization directives.

### Start the FastAPI Server
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API docs available at: `http://127.0.0.1:8000/docs`.

---

## 2. Default Seeded Credentials

| Username | Password | Role | Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `password123` | `national_admin` | `IN` | Full national visibility, audit logs, FL trigger |
| `bihar_officer` | `password123` | `state_officer` | `INBR` | State-level oversight, trigger optimization |
| `muz_officer` | `password123` | `district_officer` | `Muzaffarpur` | District approval of transfer directives |
| `phc_nurse` | `password123` | `phc_staff` | `PHC-BR-MUZ-01` | Frontline stock, bed & attendance telemetry |

---

## 3. Automated Testing & Verification

### Run Pytest Suite (20 Tests)
```powershell
pytest -v tests/test_api.py
```
Validates:
- Health & JWT authentication
- Stock & bed ingestion + batch offline synchronization
- National, state, and district drill-down visibility
- XGBoost demand & stockout risk forecasting
- Federated Learning simulation & model versioning
- OR-Tools CP-SAT multi-facility transportation solver
- Transfer lifecycle state machine & outcome feedback loop
- Role-based access control & immutable audit logging

### Run Full End-to-End Operational Pipeline
```powershell
python scripts/run_pipeline.py
```
Executes the live 8-step lifecycle:
1. Ingest frontline PHC telemetry (`PHC-BR-MUZ-01`).
2. Run XGBoost predictive inference.
3. Simulate Flower FedAvg federated aggregation round.
4. Execute Google OR-Tools CP-SAT transportation optimizer.
5. District officer reviews & approves transfer directive.
6. Transfer transitions: `APPROVED` -> `DISPATCHED` -> `RECEIVED`.
7. Outcome logger records stockout prevention.
8. Verifies audit trail entry for every mutation.

---

## 4. Architecture & Key Modules

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Auth & DB dependencies, RBAC verification
│   │   └── routers/             # FastAPI routers (auth, ingestion, visibility, forecast, fl, redistribution, transfers, alerts, audit)
│   ├── core/
│   │   └── security.py          # Direct bcrypt hashing & JWT handling
│   ├── models/                  # 13 SQLAlchemy async models
│   ├── schemas/                 # Pydantic v2 validation models
│   ├── services/                # Encapsulated business logic for all operations
│   ├── config.py                # Pydantic settings loading from .env
│   ├── database.py              # Async SQLAlchemy engine with NullPool & fallback
│   └── main.py                  # FastAPI application with CORS and startup events
├── ml/
│   ├── data/                    # Synthetic telemetry generator & temporal feature engineering
│   ├── forecasting/             # XGBRegressor + XGBClassifier demand & risk models
│   ├── federated/               # Flower NumPyClient & FedAvg simulation server
│   └── optimization/            # Google OR-Tools CP-SAT multi-facility transportation solver
├── scripts/
│   ├── seed_and_train.py        # Seed script for DB, models, and initial state
│   └── run_pipeline.py          # End-to-end operational pipeline smoke test
└── tests/
    ├── conftest.py              # Pytest fixtures and async client
    └── test_api.py              # 20 integration tests across all modules
```
