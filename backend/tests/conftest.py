import pytest
import os
import sys

# Add backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine
from app.core.security import create_access_token
from app.models.enums import UserRoleEnum
from app.database import init_db

@pytest.fixture
async def client():
    # Ensure the database schema exists before running tests
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def admin_headers():
    token = create_access_token({
        "user_id": 1,
        "sub": "admin",
        "username": "admin",
        "role": UserRoleEnum.NATIONAL_ADMIN.value,
        "scope_id": "IN",
    })
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def state_officer_headers():
    token = create_access_token({
        "user_id": 2,
        "sub": "bihar_officer",
        "username": "bihar_officer",
        "role": UserRoleEnum.STATE_OFFICER.value,
        "scope_id": "INBR",
    })
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def district_officer_headers():
    token = create_access_token({
        "user_id": 3,
        "sub": "muz_officer",
        "username": "muz_officer",
        "role": UserRoleEnum.DISTRICT_OFFICER.value,
        "scope_id": "Muzaffarpur",
    })
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def phc_staff_headers():
    token = create_access_token({
        "user_id": 4,
        "sub": "phc_nurse",
        "username": "phc_nurse",
        "role": UserRoleEnum.PHC_STAFF.value,
        "scope_id": "PHC-BR-MUZ-01",
    })
    return {"Authorization": f"Bearer {token}"}
