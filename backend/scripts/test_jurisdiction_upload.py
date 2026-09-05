import asyncio
import os
import sys
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"
SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../crisis-dashboard/public/samples"))

async def login(client: httpx.AsyncClient, username: str, password: str = "password123"):
    resp = await client.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code != 200:
        raise RuntimeError(f"Login failed for {username}: {resp.status_code} - {resp.text}")
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

async def run_tests():
    print("=== Testing Statutory Jurisdiction Ingestion Enforcement (NDMA Sec 38) ===")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Load sample files
        mp_csv_path = os.path.join(SAMPLES_DIR, "sample_madhya_pradesh_stock.csv")
        cross_csv_path = os.path.join(SAMPLES_DIR, "sample_cross_state_violation.csv")
        bhopal_csv_path = os.path.join(SAMPLES_DIR, "sample_bhopal_district_stock.csv")
        all_india_csv_path = os.path.join(SAMPLES_DIR, "sample_all_india_stock.csv")

        with open(mp_csv_path, "rb") as f:
            mp_bytes = f.read()
        with open(cross_csv_path, "rb") as f:
            cross_bytes = f.read()
        with open(bhopal_csv_path, "rb") as f:
            bhopal_bytes = f.read()
        with open(all_india_csv_path, "rb") as f:
            all_india_bytes = f.read()

        # TEST 1: MP State Officer uploads MP CSV (Should SUCCEED)
        print("\n--- TEST 1: MP State Officer (officer_inmp) uploads MP State CSV ---")
        headers_mp = await login(client, "officer_inmp")
        # Step 1: Check It (dry_run=True)
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_mp,
            files={"file": ("sample_madhya_pradesh_stock.csv", mp_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "true"},
        )
        assert resp.status_code == 200, f"Check failed: {resp.text}"
        data = resp.json()
        print(f"   [Check It] Total: {data['total_rows']}, Valid: {data['valid_rows_count']}, Flagged: {data['flagged_rows_count']}, Has Security Violation: {data['has_security_violations']}")
        assert data["has_security_violations"] is False, "Expected no security violations for MP officer on MP data"
        assert data["valid_rows_count"] > 0, "Expected valid rows"

        # Step 2: Allow It (dry_run=False)
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_mp,
            files={"file": ("sample_madhya_pradesh_stock.csv", mp_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "false"},
        )
        assert resp.status_code == 200, f"Commit failed: {resp.text}"
        data = resp.json()
        print(f"   [Allow It] Status: {data['status']}, Committed: {data['committed_records_count']} records")
        assert data["committed_records_count"] > 0
        print("   -> PASSED: MP State Officer successfully checked and committed MP data.")

        # TEST 2: MP State Officer uploads Cross-State CSV (Should be FLAGGED on Check & BLOCKED on Allow)
        print("\n--- TEST 2: MP State Officer (officer_inmp) uploads Cross-State CSV ---")
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_mp,
            files={"file": ("sample_cross_state_violation.csv", cross_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "true"},
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"   [Check It] Total: {data['total_rows']}, Valid: {data['valid_rows_count']}, Flagged: {data['flagged_rows_count']}, Violations: {data['security_violations_count']}")
        assert data["has_security_violations"] is True, "Expected security violations flagged for MP officer on cross-state CSV"
        assert data["security_violations_count"] > 0
        print(f"   [Check It] Flagged error sample: {data['flagged_errors'][0]}")

        # Attempt Allow It (dry_run=False) - MUST REJECT with 403 Forbidden!
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_mp,
            files={"file": ("sample_cross_state_violation.csv", cross_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "false"},
        )
        print(f"   [Allow It] Status code: {resp.status_code} (Expected 403 Forbidden)")
        assert resp.status_code == 403, f"Expected 403 Forbidden, got {resp.status_code}: {resp.text}"
        print(f"   [Allow It] Rejection detail: {resp.json().get('detail')}")
        print("   -> PASSED: MP State Officer blocked from ingesting out-of-state facilities.")

        # TEST 3: District Officer Muzaffarpur (muz_officer) uploads Bhopal District CSV (Should be BLOCKED)
        print("\n--- TEST 3: District Officer (muz_officer) uploads Bhopal District CSV ---")
        headers_dist = await login(client, "muz_officer")
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_dist,
            files={"file": ("sample_bhopal_district_stock.csv", bhopal_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "true"},
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"   [Check It] Total: {data['total_rows']}, Violations: {data['security_violations_count']}")
        assert data["has_security_violations"] is True, "Expected district officer to be blocked from another district"

        # Attempt commit - MUST REJECT with 403
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_dist,
            files={"file": ("sample_bhopal_district_stock.csv", bhopal_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "false"},
        )
        assert resp.status_code == 403
        print("   -> PASSED: District Officer blocked from ingesting out-of-district facilities.")

        # TEST 4: National Admin (admin) uploads Cross-State & All-India CSV (ALL rows ACCEPTED)
        print("\n--- TEST 4: National Admin (admin) uploads Cross-State & All-India CSV ---")
        headers_admin = await login(client, "admin")
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_admin,
            files={"file": ("sample_cross_state_violation.csv", cross_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "true"},
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"   [Admin Check Cross-State] Total: {data['total_rows']}, Valid: {data['valid_rows_count']}, Violations: {data['has_security_violations']}")
        assert data["has_security_violations"] is False, "National admin should have zero security violations"
        assert data["valid_rows_count"] == data["total_rows"]

        # Commit All-India CSV
        resp = await client.post(
            f"{BASE_URL}/phc/bulk-upload",
            headers=headers_admin,
            files={"file": ("sample_all_india_stock.csv", all_india_bytes, "text/csv")},
            data={"category": "stock", "dry_run": "false"},
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"   [Admin Commit All-India] Status: {data['status']}, Committed: {data['committed_records_count']} records across India")
        assert data["committed_records_count"] == data["total_rows"]
        print("   -> PASSED: All-India National Admin has unrestricted pan-India clearance.")

    print("\n=== ALL JURISDICTION ENFORCEMENT & SHOWCASE CSV TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
