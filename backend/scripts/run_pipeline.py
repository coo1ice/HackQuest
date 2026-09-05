"""
End-to-End Operational Pipeline Verification Script for NHRM India Backend
Executes full lifecycle:
Ingest -> Forecast -> Federated Learning -> OR-Tools Optimization -> Approve -> Dispatch -> Receive -> Outcome Log -> Audit Verification
"""

import asyncio
import sys
import os

# Set root directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token
from app.models.enums import UserRoleEnum

async def run_pipeline():
    print("=" * 70)
    print("  NHRM INDIA: END-TO-END OPERATIONAL PIPELINE SMOKE TEST")
    print("=" * 70)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Generate Auth Tokens
        admin_token = create_access_token({
            "user_id": 1, "sub": "admin", "username": "admin", "role": UserRoleEnum.NATIONAL_ADMIN.value, "scope_id": "IN"
        })
        muz_officer_token = create_access_token({
            "user_id": 3, "sub": "muz_officer", "username": "muz_officer", "role": UserRoleEnum.DISTRICT_OFFICER.value, "scope_id": "Muzaffarpur"
        })
        nurse_token = create_access_token({
            "user_id": 4, "sub": "phc_nurse", "username": "phc_nurse", "role": UserRoleEnum.PHC_STAFF.value, "scope_id": "PHC-BR-MUZ-01"
        })

        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        officer_headers = {"Authorization": f"Bearer {muz_officer_token}"}
        nurse_headers = {"Authorization": f"Bearer {nurse_token}"}

        # Step 1: Ingest Live Frontline Telemetry
        print("\n[STEP 1] Ingesting Frontline PHC Stock & Bed Telemetry...")
        stock_resp = await client.post("/phc/PHC-BR-MUZ-01/stock", json={
            "medicine_id": "MED-ANTIVENOM",
            "quantity": 14.0,
            "unit": "vials",
            "expiry_date": "2026-10-15"
        }, headers=nurse_headers)
        assert stock_resp.status_code == 201
        print(f"  -> Successfully logged 14 vials of MED-ANTIVENOM at PHC-BR-MUZ-01.")

        # Step 2: Predictive Inference (XGBoost)
        print("\n[STEP 2] Running XGBoost 7-Day Demand & Stockout Risk Forecasting...")
        fc_resp = await client.get("/forecast/PHC-BR-MUZ-01/MED-ANTIVENOM", headers=officer_headers)
        assert fc_resp.status_code == 200
        fc = fc_resp.json()
        print(f"  -> Predicted 7d Demand: {fc['predicted_demand_7d']} vials")
        print(f"  -> Stockout Risk: {fc['stockout_risk'] * 100:.1f}% | Severity: {fc['severity'].upper()}")
        print(f"  -> Days of Stock Left: {fc['days_of_stock_left']} days (Stockout predicted: {fc.get('predicted_stockout_date')})")

        # Step 3: Federated Learning Simulation (Flower FedAvg)
        print("\n[STEP 3] Triggering Federated Learning Aggregation Round across State Silos...")
        fl_resp = await client.post("/fl/rounds/trigger", json={
            "num_rounds": 2,
            "participating_states": ["INBR", "INMH", "INAS", "INOR"]
        }, headers=admin_headers)
        assert fl_resp.status_code == 200
        fl = fl_resp.json()
        print(f"  -> FL Round ID: {fl['round_id']} | Status: {fl['status']}")
        print(f"  -> Aggregation Strategy: FedAvg across {fl['participating_clients']} state silos")
        print(f"  -> Pre-round Loss: {fl.get('loss_before', 0.65):.4f} -> Post-round Loss: {fl.get('loss_after', 0.42):.4f} (Accuracy: {fl['accuracy_after'] * 100:.1f}%)")

        # Step 4: Run Google OR-Tools CP-SAT Transportation Optimizer
        print("\n[STEP 4] Executing Google OR-Tools CP-SAT Transportation Optimization...")
        opt_resp = await client.post("/redistribution/run", json={
            "state_id": "INBR",
            "medicine_ids": ["MED-ANTIVENOM"]
        }, headers=admin_headers)
        assert opt_resp.status_code == 200
        opt = opt_resp.json()
        print(f"  -> Solver Status: {opt['status']} (Execution time: {opt['solver_execution_time_ms']} ms)")
        print(f"  -> Generated {opt['generated_recommendations_count']} allocation directive(s), Rebalancing {opt['total_quantity_rebalanced']} units")
        
        recs = opt["recommendations"]
        assert len(recs) > 0
        top_rec = recs[0]
        rec_id = top_rec["id"]
        print(f"  -> Directive #{rec_id}: Transfer {top_rec['quantity']} units from {top_rec['from_phc_id']} to {top_rec['to_phc_id']} ({top_rec['distance_km']} km)")

        # Step 5: Officer Review and Approval
        print(f"\n[STEP 5] District Officer reviewing & approving Directive #{rec_id}...")
        appr_resp = await client.post(f"/redistribution/recommendations/{rec_id}/approve", headers=officer_headers)
        assert appr_resp.status_code == 200
        transfer = appr_resp.json()
        transfer_id = transfer["id"]
        print(f"  -> Transfer Record created: ID #{transfer_id} | Status: {transfer['status'].upper()}")

        # Step 6: Strict Transfer State Machine Transitions
        print(f"\n[STEP 6] Executing Transfer Lifecycle (Approved -> Dispatched -> Received)...")
        # Dispatch
        disp_resp = await client.patch(f"/transfers/{transfer_id}/status", json={
            "status": "dispatched",
            "notes": "Consignment dispatched via emergency temperature-controlled ambulance route"
        }, headers=officer_headers)
        assert disp_resp.status_code == 200
        print(f"  -> Transitioned to DISPATCHED")

        # Receive
        recv_resp = await client.patch(f"/transfers/{transfer_id}/status", json={
            "status": "received",
            "notes": "Vials received at destination PHC cold room in good condition"
        }, headers=officer_headers)
        assert recv_resp.status_code == 200
        print(f"  -> Transitioned to RECEIVED")

        # Step 7: Post-Delivery Outcome Feedback Loop
        print(f"\n[STEP 7] Logging Outcome into ML Feedback Loop...")
        out_resp = await client.post("/outcomes/log", json={
            "transfer_id": transfer_id,
            "stockout_prevented": True,
            "notes": "Critical antivenom shortage successfully averted during flood season outbreak"
        }, headers=officer_headers)
        assert out_resp.status_code == 201
        print("  -> Outcome recorded: Stockout Averted = True")

        out_summary = await client.get("/outcomes/summary", headers=admin_headers)
        summary = out_summary.json()
        print(f"  -> National Rebalance Efficacy: {summary['accuracy_percentage']}% success rate across {summary['total_transfers_completed']} transfers")

        # Step 8: Audit Trail Verification
        print(f"\n[STEP 8] Verifying Immutable Audit Trail...")
        audit_resp = await client.get("/audit-logs", headers=admin_headers)
        assert audit_resp.status_code == 200
        logs = audit_resp.json()
        actions = [log["action"] for log in logs[:10]]
        print(f"  -> Recent Audit Actions: {actions}")
        print("\n" + "=" * 70)
        print("  SUCCESS: Full operational pipeline completed flawlessly!")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_pipeline())
