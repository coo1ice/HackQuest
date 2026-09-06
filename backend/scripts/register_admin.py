import requests
import sys

BASE = 'http://127.0.0.1:8000'

# Register admin
try:
    r = requests.post(f"{BASE}/auth/register", json={
        "username": "admin",
        "password": "adminpass",
        "role": "national_admin",
        "scope_id": "national",
    })
    print('REGISTER', r.status_code, r.text)
except Exception as e:
    print('REGISTER ERROR', e)

# Login
try:
    r = requests.post(f"{BASE}/auth/login-json", json={"username": "admin", "password": "adminpass"})
    print('LOGIN', r.status_code, r.text)
    if r.status_code == 200:
        token = r.json().get('access_token')
        print('TOKEN', token)
        # Test endpoints
        headers = {'Authorization': f'Bearer {token}'}
        for path in ['/alerts/summary', '/national/overview', '/transfers']:
            rr = requests.get(BASE + path, headers=headers)
            print(path, rr.status_code, rr.text[:200])
except Exception as e:
    print('LOGIN ERROR', e)
    sys.exit(1)
