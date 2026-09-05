import urllib.request
import json

def verify():
    # Login
    login_data = json.dumps({"username": "admin", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        token = json.loads(resp.read().decode('utf-8'))["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # National overview
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/national/overview", headers=headers)
    with urllib.request.urlopen(req) as resp:
        nat = json.loads(resp.read().decode('utf-8'))
    print("Total states in National Overview:", len(nat.get("states", [])))
    print("Reporting rate:", nat.get("reporting_rate_pct"), "%")
    print("Critical deficit states count:", nat.get("critical_deficit_states_count"))
    
    # Check states
    test_states = ["INBR", "INMH", "INGA", "INJK", "INKL", "INAR", "INLD", "INAN"]
    for st in test_states:
        req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1/states/{st}/overview", headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"[{st}] {data.get('state_name')}: Stock={data.get('stock_health_score')}%, Beds={data.get('bed_occupancy_pct')}%, Status={data.get('status')}")

if __name__ == "__main__":
    verify()
