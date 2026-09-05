import asyncio
import os
import sys
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"
SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../crisis-dashboard/public/samples"))

async def login(client: httpx.AsyncClient, username: str, password: str = "password123"):
    resp = await client.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code != 200:
        raise RuntimeError(f"Login failed: {resp.text}")
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}

async def run():
    print("=== Testing MP Crisis Telemetry Upload & Live Database Impact ===")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Login as MP State Officer (officer_inmp)
        headers = await login(client, "officer_inmp")
        print("1. Logged in as officer_inmp (State Officer for INMP)")

        # 2. Check initial stock for Bhopal PHC
        resp_before = await client.get(f"{BASE_URL}/phc/PHC-MP-D1-P01", headers=headers)
        assert resp_before.status_code == 200
        data_before = resp_before.json()
        print(f"2. Initial Bhopal PHC Stocks count: {len(data_before['stocks'])}")

        # 3. Upload MP Crisis Stockout CSV (dry_run=False -> COMMIT to DB)
        csv_file_path = os.path.join(SAMPLES_DIR, "sample_mp_crisis_stockout.csv")
        with open(csv_file_path, "rb") as f:
            csv_bytes = f.read()

        print("3. Uploading sample_mp_crisis_stockout.csv with dry_run=False...")
        upload_resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers,
            files={"file": ("sample_mp_crisis_stockout.csv", csv_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "false"},
        )
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
        res = upload_resp.json()
        print(f"   -> Status: {res['status']}")
        print(f"   -> Committed Records: {res['committed_records_count']}")
        print(f"   -> Alerts Created: {res.get('alerts_created_count', 0)}")
        for al in res.get("alerts_created", []):
            print(f"      * {al['phc_id']} ({al['facility_name']}): {al['resource_type']} -> {al['stock_remaining']} [{al['severity']}]")
        print(f"   -> Recommendations Created: {len(res.get('recommendations_created', []))}")
        for r in res.get("recommendations_created", []):
            print(f"      * Rebalance Directive: {r['from_phc']} -> {r['to_phc']} ({r['quantity']} units of {r['medicine_id']})")

        assert res["committed_records_count"] == 5, "Expected 5 records committed"
        assert res.get("alerts_created_count", 0) >= 1, "Expected alerts created"

        # 4. Verify that the new Alert appears in GET /alerts
        print("\n4. Verifying new Alert in GET /alerts for MP...")
        alerts_resp = await client.get(f"{BASE_URL}/alerts?state_id=INMP&status=active", headers=headers)
        assert alerts_resp.status_code == 200
        active_alerts = alerts_resp.json()
        print(f"   -> Active MP Alerts in DB: {len(active_alerts)}")
        bhopal_alert = next((a for a in active_alerts if a["phc_id"] == "PHC-MP-D1-P01"), None)
        assert bhopal_alert is not None, "Expected active alert for PHC-MP-D1-P01 in Bhopal!"
        print(f"   -> Found Active Alert #{bhopal_alert['id']}: {bhopal_alert['title']} ({bhopal_alert['severity']})")
        print(f"   -> Facility: {bhopal_alert['phc_name']}, District: {bhopal_alert['district_name']}")
        print(f"   -> Recommended Action: {bhopal_alert['action_recommended']}")

        # 5. Verify that latest stock in DB for Bhopal reflects the uploaded shortage
        print("\n5. Verifying latest stock in DB for Bhopal Primary Health Centre #1...")
        resp_after = await client.get(f"{BASE_URL}/phc/PHC-MP-D1-P01", headers=headers)
        assert resp_after.status_code == 200
        data_after = resp_after.json()
        latest_stocks = data_after["stocks"]
        print(f"   -> Recent stock rows in DB: {len(latest_stocks)}")
        latest_antivenom = next((s for s in latest_stocks if s["medicine_id"] == "MED-ANTIVENOM"), None)
        assert latest_antivenom is not None, "Expected antivenom in latest stocks"
        print(f"   -> Confirmed latest Antivenom stock in DB: {latest_antivenom['quantity']} {latest_antivenom['unit']}")
        assert latest_antivenom["quantity"] == 2.0, f"Expected 2.0 vials, got {latest_antivenom['quantity']}"

        # 6. Verify that redistribution recommendation was created in DB
        print("\n6. Verifying pending Emergency Redistribution recommendations for MP...")
        recs_resp = await client.get(f"{BASE_URL}/redistribution/recommendations?state_id=INMP&status=pending", headers=headers)
        assert recs_resp.status_code == 200
        recs = recs_resp.json()
        print(f"   -> Pending MP recommendations in DB: {len(recs)}")
        mp_rec = next((r for r in recs if r["to_phc_id"] == "PHC-MP-D1-P01"), None)
        assert mp_rec is not None, "Expected pending recommendation targeting PHC-MP-D1-P01"
        print(f"   -> Found Recommendation #{mp_rec['id']}: Transfer {mp_rec['quantity']} units of {mp_rec['medicine_id']} from {mp_rec['from_phc_name']} to {mp_rec['to_phc_name']}")
        print(f"   -> Operational Impact: {mp_rec['predicted_impact']}")

        print("\n=== SUCCESS: CSV upload committed to DB, triggered operational alerts & directives in live database! ===")

if __name__ == "__main__":
    asyncio.run(run())
