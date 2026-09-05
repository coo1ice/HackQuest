import pytest
from datetime import date, datetime

pytestmark = pytest.mark.asyncio

async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

# 1. Auth & RBAC Tests
async def test_auth_login_happy_path(client):
    response = await client.post("/auth/login-json", json={
        "username": "admin",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "national_admin"

async def test_auth_login_invalid_password(client):
    response = await client.post("/auth/login-json", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

async def test_auth_me(client, admin_headers):
    response = await client.get("/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "national_admin"

# 2. Ingestion Tests
async def test_ingest_stock(client, phc_staff_headers):
    payload = {
        "medicine_id": "MED-ANTIVENOM",
        "quantity": 125.0,
        "unit": "vials",
        "expiry_date": "2026-11-30",
    }
    response = await client.post("/phc/PHC-BR-MUZ-01/stock", json=payload, headers=phc_staff_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["phc_id"] == "PHC-BR-MUZ-01"
    assert data["quantity"] == 125.0

async def test_ingest_beds(client, phc_staff_headers):
    payload = {
        "total_beds": 20,
        "occupied_beds": 14,
    }
    response = await client.post("/phc/PHC-BR-MUZ-01/beds", json=payload, headers=phc_staff_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["total_beds"] == 20
    assert data["occupied_beds"] == 14

async def test_sync_batch_offline(client, phc_staff_headers):
    payload = {
        "stocks": [
            {"medicine_id": "MED-IV-NACL", "quantity": 80.0, "unit": "bottles", "expiry_date": "2027-01-15"}
        ],
        "beds": [{"total_beds": 15, "occupied_beds": 8}],
        "staff_attendances": [{"staff_id": "STF-01", "role": "Doctor", "status": "present"}],
        "footfalls": [{"patient_count": 45, "department": "Emergency"}],
    }
    response = await client.post("/phc/PHC-BR-MUZ-01/sync-batch", json=payload, headers=phc_staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "synced_successfully"
    assert data["processed_counts"]["stocks"] == 1

# 3. Visibility Tests
async def test_national_overview(client, admin_headers):
    response = await client.get("/national/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_phcs"] >= 40
    assert len(data["states"]) >= 4
    assert data["national_health_score"] > 0

async def test_state_overview(client, admin_headers):
    response = await client.get("/states/INBR/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["state_id"] == "INBR"
    assert data["total_districts"] >= 4

async def test_district_phcs(client, admin_headers):
    response = await client.get("/districts/Muzaffarpur/phcs", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["district_id"] == "Muzaffarpur"
    assert len(data["phcs"]) >= 3

async def test_phc_detail(client, admin_headers):
    response = await client.get("/phc/PHC-BR-MUZ-01", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["phc"]["id"] == "PHC-BR-MUZ-01"
    assert "stocks" in data
    assert "beds" in data

# 4. Forecasting Tests
async def test_phc_forecast(client, admin_headers):
    response = await client.get("/forecast/PHC-BR-MUZ-01/MED-ANTIVENOM", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["phc_id"] == "PHC-BR-MUZ-01"
    assert data["predicted_demand_7d"] > 0
    assert 0.0 <= data["stockout_risk"] <= 1.0
    assert data["severity"] in ["low", "medium", "high", "critical"]

async def test_district_forecast(client, admin_headers):
    response = await client.get("/forecast/district/Muzaffarpur", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["district_id"] == "Muzaffarpur"
    assert len(data["items"]) >= 1

# 5. Federated Learning Tests
async def test_fl_trigger_and_status(client, admin_headers):
    trigger_resp = await client.post("/fl/rounds/trigger", json={"num_rounds": 2}, headers=admin_headers)
    assert trigger_resp.status_code == 200
    data = trigger_resp.json()
    assert data["status"] == "COMPLETED"
    assert data["num_rounds_completed"] == 2
    round_id = data["round_id"]

    status_resp = await client.get(f"/fl/rounds/{round_id}/status", headers=admin_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["round_id"] == round_id

async def test_fl_model_version(client, admin_headers):
    response = await client.get("/fl/model/version", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "federated_base_fedavg"
    assert "metrics" in data

# 6. Redistribution & OR-Tools Optimization Tests
async def test_run_optimizer(client, state_officer_headers):
    payload = {
        "state_id": "INBR",
        "medicine_ids": ["MED-ANTIVENOM"]
    }
    response = await client.post("/redistribution/run", json=payload, headers=state_officer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert len(data["recommendations"]) >= 1
    rec = data["recommendations"][0]
    assert rec["quantity"] > 0
    assert rec["distance_km"] > 0

async def test_list_and_approve_recommendation(client, district_officer_headers):
    list_resp = await client.get("/redistribution/recommendations?status=pending", headers=district_officer_headers)
    assert list_resp.status_code == 200
    recs = list_resp.json()
    if recs:
        target_id = recs[0]["id"]
        approve_resp = await client.post(f"/redistribution/recommendations/{target_id}/approve", headers=district_officer_headers)
        assert approve_resp.status_code == 200
        transfer = approve_resp.json()
        assert transfer["status"] == "approved"
        assert transfer["recommendation_id"] == target_id

# 7. Transfers & Outcome Feedback Tests
async def test_transfers_lifecycle_and_transition(client, admin_headers):
    list_resp = await client.get("/transfers", headers=admin_headers)
    assert list_resp.status_code == 200
    transfers = list_resp.json()
    assert len(transfers) >= 1

    # Find an approved transfer to dispatch
    appr = next((t for t in transfers if t["status"] == "approved"), None)
    if appr:
        t_id = appr["id"]
        # Valid transition: approved -> dispatched
        patch_resp = await client.patch(f"/transfers/{t_id}/status", json={"status": "dispatched", "notes": "En route via express highway"}, headers=admin_headers)
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == "dispatched"

        # Invalid transition: dispatched cannot transition back to approved
        inv_resp = await client.patch(f"/transfers/{t_id}/status", json={"status": "approved"}, headers=admin_headers)
        assert inv_resp.status_code == 400

async def test_outcomes_log_and_summary(client, admin_headers):
    list_resp = await client.get("/transfers", headers=admin_headers)
    t_id = list_resp.json()[0]["id"]

    log_resp = await client.post("/outcomes/log", json={
        "transfer_id": t_id,
        "stockout_prevented": True,
        "notes": "Emergency ICU stock maintained without depletion"
    }, headers=admin_headers)
    assert log_resp.status_code == 201

    summary_resp = await client.get("/outcomes/summary", headers=admin_headers)
    assert summary_resp.status_code == 200
    data = summary_resp.json()
    assert data["total_transfers_completed"] >= 1
    assert data["accuracy_percentage"] >= 90.0

# 8. Audit Trail Tests
async def test_audit_logs_rbac(client, admin_headers, phc_staff_headers):
    # PHC staff should be forbidden
    denied_resp = await client.get("/audit-logs", headers=phc_staff_headers)
    assert denied_resp.status_code == 403

    # Admin should succeed
    ok_resp = await client.get("/audit-logs", headers=admin_headers)
    assert ok_resp.status_code == 200
    logs = ok_resp.json()
    assert len(logs) >= 1
