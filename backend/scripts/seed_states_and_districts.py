import asyncio
import os
import sys
from datetime import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, async_session_maker, Base
from app.models.state import State
from app.models.district import District
from app.models.user import User, UserRoleEnum
from app.core.security import get_password_hash
from sqlalchemy import select

ALL_36_STATES_METADATA = [
    # North Zone
    {"id": "INDL", "name": "Delhi", "zone": "North", "capital": "New Delhi", "commandName": "Delhi Capital Regional Command", "districts": 11, "phcs": 48, "sso": "Dr. S. K. Sharma, MD", "status": "adequate", "stock": 88.0, "beds": 68.0},
    {"id": "INHR", "name": "Haryana", "zone": "North", "capital": "Chandigarh", "commandName": "Haryana State Command", "districts": 22, "phcs": 72, "sso": "Dr. R. K. Malik, MD", "status": "adequate", "stock": 84.0, "beds": 64.0},
    {"id": "INHP", "name": "Himachal Pradesh", "zone": "North", "capital": "Shimla", "commandName": "Himachal Alpine Health Command", "districts": 12, "phcs": 45, "sso": "Dr. V. K. Thakur, MD", "status": "normal", "stock": 89.0, "beds": 58.0},
    {"id": "INJK", "name": "Jammu and Kashmir", "zone": "North", "capital": "Srinagar / Jammu", "commandName": "Jammu & Kashmir Command", "districts": 20, "phcs": 65, "sso": "Dr. M. A. Lone, MD", "status": "adequate", "stock": 82.0, "beds": 62.0},
    {"id": "INLA", "name": "Ladakh", "zone": "North", "capital": "Leh", "commandName": "Ladakh High-Altitude Command", "districts": 2, "phcs": 18, "sso": "Dr. T. Angmo, MD", "status": "normal", "stock": 90.0, "beds": 52.0},
    {"id": "INPB", "name": "Punjab", "zone": "North", "capital": "Chandigarh", "commandName": "Punjab State Command", "districts": 23, "phcs": 85, "sso": "Dr. H. S. Randhawa, MD", "status": "adequate", "stock": 86.0, "beds": 66.0},
    {"id": "INCH", "name": "Chandigarh", "zone": "North", "capital": "Chandigarh", "commandName": "Chandigarh UT Surveillance Unit", "districts": 1, "phcs": 12, "sso": "Dr. P. S. Gill, MD", "status": "normal", "stock": 92.0, "beds": 55.0},
    {"id": "INUT", "name": "Uttarakhand", "zone": "North", "capital": "Dehradun", "commandName": "Uttarakhand Foothill & Alpine Command", "districts": 13, "phcs": 54, "sso": "Dr. B. C. Joshi, MD", "status": "adequate", "stock": 85.0, "beds": 60.0},
    {"id": "INUP", "name": "Uttar Pradesh", "zone": "North", "capital": "Lucknow", "commandName": "Uttar Pradesh State Command", "districts": 75, "phcs": 280, "sso": "Dr. R. P. Tiwari, MD", "status": "adequate", "stock": 81.0, "beds": 74.0},
    {"id": "INRJ", "name": "Rajasthan", "zone": "North", "capital": "Jaipur", "commandName": "Rajasthan Arid Zone Command", "districts": 33, "phcs": 120, "sso": "Dr. M. L. Verma, MD", "status": "adequate", "stock": 83.0, "beds": 67.0},

    # East Zone
    {"id": "INBR", "name": "Bihar", "zone": "East", "capital": "Patna", "commandName": "Bihar State Command", "districts": 38, "phcs": 140, "sso": "Dr. A. K. Sinha, MD", "status": "critical", "stock": 48.0, "beds": 91.2},
    {"id": "INJH", "name": "Jharkhand", "zone": "East", "capital": "Ranchi", "commandName": "Jharkhand Tribal & Rural Command", "districts": 24, "phcs": 82, "sso": "Dr. S. K. Murmu, MD", "status": "adequate", "stock": 80.0, "beds": 70.0},
    {"id": "INOR", "name": "Odisha", "zone": "East", "capital": "Bhubaneswar", "commandName": "Odisha Coastal Disaster Command", "districts": 30, "phcs": 110, "sso": "Dr. S. K. Patnaik, MD", "status": "critical", "stock": 54.0, "beds": 88.5},
    {"id": "INWB", "name": "West Bengal", "zone": "East", "capital": "Kolkata", "commandName": "West Bengal State Command", "districts": 23, "phcs": 130, "sso": "Dr. S. Banerjee, MD", "status": "adequate", "stock": 84.0, "beds": 71.0},

    # West Zone
    {"id": "INMH", "name": "Maharashtra", "zone": "West", "capital": "Mumbai", "commandName": "Maharashtra Apex Operations Command", "districts": 36, "phcs": 160, "sso": "Dr. V. Deshmukh, MD", "status": "adequate", "stock": 87.5, "beds": 66.4},
    {"id": "INGJ", "name": "Gujarat", "zone": "West", "capital": "Gandhinagar", "commandName": "Gujarat Coastal & Urban Command", "districts": 33, "phcs": 115, "sso": "Dr. P. C. Patel, MD", "status": "adequate", "stock": 88.0, "beds": 63.0},
    {"id": "INGA", "name": "Goa", "zone": "West", "capital": "Panaji", "commandName": "Goa Coastal Surveillance Command", "districts": 2, "phcs": 16, "sso": "Dr. F. Noronha, MD", "status": "adequate", "stock": 89.0, "beds": 58.0},
    {"id": "INDD", "name": "Daman and Diu", "zone": "West", "capital": "Daman", "commandName": "Daman and Diu UT Command", "districts": 2, "phcs": 10, "sso": "Dr. H. Solanki, MD", "status": "normal", "stock": 91.0, "beds": 52.0},
    {"id": "INDN", "name": "Dadra and Nagar Haveli", "zone": "West", "capital": "Silvassa", "commandName": "Dadra and Nagar Haveli UT Command", "districts": 1, "phcs": 8, "sso": "Dr. K. Rathod, MD", "status": "normal", "stock": 90.0, "beds": 54.0},

    # South Zone
    {"id": "INKA", "name": "Karnataka", "zone": "South", "capital": "Bengaluru", "commandName": "Karnataka State Command", "districts": 31, "phcs": 135, "sso": "Dr. K. Sudhakar, MD", "status": "adequate", "stock": 86.0, "beds": 68.0},
    {"id": "INKL", "name": "Kerala", "zone": "South", "capital": "Thiruvananthapuram", "commandName": "Kerala State Command", "districts": 14, "phcs": 90, "sso": "Dr. R. Pillai, MD", "status": "adequate", "stock": 89.0, "beds": 64.0},
    {"id": "INTN", "name": "Tamil Nadu", "zone": "South", "capital": "Chennai", "commandName": "Tamil Nadu State Command", "districts": 38, "phcs": 150, "sso": "Dr. J. Radhakrishnan, MD", "status": "adequate", "stock": 88.0, "beds": 67.0},
    {"id": "INAP", "name": "Andhra Pradesh", "zone": "South", "capital": "Amaravati", "commandName": "Andhra Pradesh Coastal Command", "districts": 26, "phcs": 105, "sso": "Dr. N. Reddy, MD", "status": "adequate", "stock": 85.0, "beds": 65.0},
    {"id": "INTG", "name": "Telangana", "zone": "South", "capital": "Hyderabad", "commandName": "Telangana State Command", "districts": 33, "phcs": 98, "sso": "Dr. G. Srinivas Rao, MD", "status": "adequate", "stock": 87.0, "beds": 66.0},
    {"id": "INPY", "name": "Puducherry", "zone": "South", "capital": "Puducherry", "commandName": "Puducherry UT Surveillance Command", "districts": 4, "phcs": 18, "sso": "Dr. G. Sriramulu, MD", "status": "normal", "stock": 91.0, "beds": 57.0},
    {"id": "INAN", "name": "Andaman and Nicobar Islands", "zone": "Island", "capital": "Port Blair", "commandName": "Andaman & Nicobar Island Command", "districts": 3, "phcs": 14, "sso": "Dr. S. K. Halder, MD", "status": "normal", "stock": 87.0, "beds": 59.0},
    {"id": "INLD", "name": "Lakshadweep", "zone": "Island", "capital": "Kavaratti", "commandName": "Lakshadweep Archipelago Command", "districts": 1, "phcs": 10, "sso": "Dr. K. Koya, MD", "status": "normal", "stock": 89.0, "beds": 51.0},

    # Central Zone
    {"id": "INMP", "name": "Madhya Pradesh", "zone": "Central", "capital": "Bhopal", "commandName": "Madhya Pradesh Central Command", "districts": 52, "phcs": 145, "sso": "Dr. V. Chouhan, MD", "status": "adequate", "stock": 82.0, "beds": 69.0},
    {"id": "INCT", "name": "Chhattisgarh", "zone": "Central", "capital": "Raipur", "commandName": "Chhattisgarh Central Forest Command", "districts": 33, "phcs": 80, "sso": "Dr. P. Shukla, MD", "status": "adequate", "stock": 83.0, "beds": 68.0},

    # North-East Zone
    {"id": "INAS", "name": "Assam", "zone": "North-East", "capital": "Dispur", "commandName": "Assam Brahmaputra Valley Command", "districts": 35, "phcs": 105, "sso": "Dr. B. K. Borah, MD", "status": "critical", "stock": 52.0, "beds": 89.0},
    {"id": "INSK", "name": "Sikkim", "zone": "North-East", "capital": "Gangtok", "commandName": "Sikkim Mountain Surveillance Command", "districts": 6, "phcs": 22, "sso": "Dr. P. Bhutia, MD", "status": "critical", "stock": 55.0, "beds": 86.0},
    {"id": "INAR", "name": "Arunachal Pradesh", "zone": "North-East", "capital": "Itanagar", "commandName": "Arunachal Frontier Command", "districts": 25, "phcs": 42, "sso": "Dr. D. Bagra, MD", "status": "adequate", "stock": 81.0, "beds": 61.0},
    {"id": "INMN", "name": "Manipur", "zone": "North-East", "capital": "Imphal", "commandName": "Manipur Command", "districts": 16, "phcs": 35, "sso": "Dr. K. Rajo Singh, MD", "status": "adequate", "stock": 80.0, "beds": 64.0},
    {"id": "INML", "name": "Meghalaya", "zone": "North-East", "capital": "Shillong", "commandName": "Meghalaya Plateau Command", "districts": 12, "phcs": 32, "sso": "Dr. M. Sangma, MD", "status": "adequate", "stock": 84.0, "beds": 62.0},
    {"id": "INMZ", "name": "Mizoram", "zone": "North-East", "capital": "Aizawl", "commandName": "Mizoram Mountain Command", "districts": 11, "phcs": 28, "sso": "Dr. Z. Ralte, MD", "status": "normal", "stock": 88.0, "beds": 56.0},
    {"id": "INNL", "name": "Nagaland", "zone": "North-East", "capital": "Kohima", "commandName": "Nagaland Hill Surveillance Command", "districts": 16, "phcs": 30, "sso": "Dr. T. Jamir, MD", "status": "adequate", "stock": 83.0, "beds": 60.0},
    {"id": "INTR", "name": "Tripura", "zone": "North-East", "capital": "Agartala", "commandName": "Tripura Border Command", "districts": 8, "phcs": 26, "sso": "Dr. S. Debbarma, MD", "status": "normal", "stock": 86.0, "beds": 58.0},
]

async def seed_states_and_districts():
    print("=== Populating States, Districts, and State Officers in PostgreSQL ===")
    
    # 1. Create tables in PostgreSQL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables verified/created in database.")

    async with async_session_maker() as session:
        # 2. Populate States
        for meta in ALL_36_STATES_METADATA:
            existing = await session.get(State, meta["id"])
            if not existing:
                state_obj = State(
                    id=meta["id"],
                    name=meta["name"],
                    zone=meta["zone"],
                    capital=meta["capital"],
                    command_name=meta["commandName"],
                    total_districts=meta["districts"],
                    total_phcs=meta["phcs"],
                    reporting_phcs=meta["phcs"],
                    stock_health_score=meta["stock"],
                    bed_occupancy_pct=meta["beds"],
                    staff_health_score=87.5,
                    triage_status=meta["status"],
                    sso_name=meta["sso"],
                )
                session.add(state_obj)
            else:
                existing.name = meta["name"]
                existing.zone = meta["zone"]
                existing.capital = meta["capital"]
                existing.command_name = meta["commandName"]
                existing.total_districts = meta["districts"]
                existing.stock_health_score = meta["stock"]
                existing.bed_occupancy_pct = meta["beds"]
                existing.triage_status = meta["status"]
                existing.sso_name = meta["sso"]

        await session.commit()
        print(f"[OK] Populated {len(ALL_36_STATES_METADATA)} States & UTs in 'states' table.")

        # 3. Populate representative districts
        for meta in ALL_36_STATES_METADATA:
            st_id = meta["id"]
            st_name = meta["name"]
            sample_districts = [
                f"{st_name} Central",
                f"{st_name} North",
                f"{st_name} South",
                f"{st_name} East",
            ]
            for d_name in sample_districts:
                existing_d = await session.get(District, d_name)
                if not existing_d:
                    dist_obj = District(
                        id=d_name,
                        name=d_name,
                        state_id=st_id,
                        total_phcs=meta["phcs"] // 4,
                        reporting_phcs=meta["phcs"] // 4,
                        stock_health_score=meta["stock"],
                        bed_occupancy_pct=meta["beds"],
                        critical_stockouts=2 if meta["status"] == "critical" else 0,
                        status="CRITICAL RISK" if meta["status"] == "critical" else "NORMAL BUFFER",
                    )
                    session.add(dist_obj)

        await session.commit()
        print("[OK] Populated representative districts in 'districts' table.")

        # 4. Populate State Surveillance Officers in users table
        for meta in ALL_36_STATES_METADATA:
            st_code = meta["id"].lower()
            username = f"officer_{st_code}"
            user_res = await session.execute(select(User).where(User.username == username))
            if not user_res.scalar_one_or_none():
                user = User(
                    username=username,
                    hashed_password=get_password_hash("password123"),
                    role=UserRoleEnum.STATE_OFFICER,
                    scope_id=meta["id"],
                )
                session.add(user)

        await session.commit()
        print("[OK] Populated State Surveillance Officer accounts in 'users' table.")

    # 5. Verification Query
    async with async_session_maker() as session:
        states_res = await session.execute(select(State).order_by(State.name))
        all_states = states_res.scalars().all()
        print(f"\nFinal State Verification: {len(all_states)} total states in 'states' table.")
        for s in all_states[:5]:
            print(f"  {s.id}: {s.name} ({s.zone} Zone) - Status: {s.triage_status}, Stock: {s.stock_health_score}%, Beds: {s.bed_occupancy_pct}%")
        print("  ...")
        for s in all_states[-3:]:
            print(f"  {s.id}: {s.name} ({s.zone} Zone) - Status: {s.triage_status}, Stock: {s.stock_health_score}%, Beds: {s.bed_occupancy_pct}%")

if __name__ == "__main__":
    asyncio.run(seed_states_and_districts())
