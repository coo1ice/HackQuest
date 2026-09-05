import asyncio
import os
import sys
from datetime import datetime, date, timedelta
import random

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, async_session_maker
from app.models import (
    PHC, StockRecord, BedRecord, StaffAttendanceRecord,
    Forecast, Alert, SeverityEnum
)
from sqlalchemy import select

# All 36 States & UTs with real representative districts
ALL_36_STATES = {
    "INAN": {"name": "Andaman and Nicobar Islands", "districts": ["South Andaman", "Nicobar", "North and Middle Andaman"]},
    "INAP": {"name": "Andhra Pradesh", "districts": ["Visakhapatnam", "Krishna", "Guntur", "Chittoor"]},
    "INAR": {"name": "Arunachal Pradesh", "districts": ["Papum Pare", "Changlang", "Tawang", "West Kameng"]},
    "INAS": {"name": "Assam", "districts": ["Kamrup", "Dhubri", "Barpeta", "Nagaon"]},
    "INBR": {"name": "Bihar", "districts": ["Muzaffarpur", "Vaishali", "Patna", "Nalanda"]},
    "INCH": {"name": "Chandigarh", "districts": ["Chandigarh Urban", "Chandigarh Rural"]},
    "INCT": {"name": "Chhattisgarh", "districts": ["Raipur", "Bilaspur", "Bastar", "Durg"]},
    "INDD": {"name": "Daman and Diu", "districts": ["Daman", "Diu"]},
    "INDN": {"name": "Dadra and Nagar Haveli", "districts": ["Silvassa", "Dadra"]},
    "INDL": {"name": "Delhi", "districts": ["Central Delhi", "New Delhi", "North Delhi", "South Delhi"]},
    "INGA": {"name": "Goa", "districts": ["North Goa", "South Goa"]},
    "INGJ": {"name": "Gujarat", "districts": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]},
    "INHR": {"name": "Haryana", "districts": ["Gurugram", "Faridabad", "Ambala", "Karnal"]},
    "INHP": {"name": "Himachal Pradesh", "districts": ["Shimla", "Kangra", "Mandi", "Solan"]},
    "INJK": {"name": "Jammu and Kashmir", "districts": ["Srinagar", "Jammu", "Anantnag", "Baramulla"]},
    "INJH": {"name": "Jharkhand", "districts": ["Ranchi", "East Singhbhum", "Dhanbad", "Bokaro"]},
    "INKA": {"name": "Karnataka", "districts": ["Bengaluru Urban", "Mysuru", "Belagavi", "Dharwad"]},
    "INKL": {"name": "Kerala", "districts": ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Malappuram"]},
    "INLD": {"name": "Lakshadweep", "districts": ["Kavaratti", "Agatti", "Andrott"]},
    "INMP": {"name": "Madhya Pradesh", "districts": ["Bhopal", "Indore", "Jabalpur", "Gwalior"]},
    "INMH": {"name": "Maharashtra", "districts": ["Pune", "Nagpur", "Thane", "Nashik"]},
    "INMN": {"name": "Manipur", "districts": ["Imphal East", "Imphal West", "Churachandpur", "Thoubal"]},
    "INML": {"name": "Meghalaya", "districts": ["East Khasi Hills", "West Garo Hills", "Ri-Bhoi"]},
    "INMZ": {"name": "Mizoram", "districts": ["Aizawl", "Lunglei", "Champhai"]},
    "INNL": {"name": "Nagaland", "districts": ["Kohima", "Dimapur", "Mokokchung"]},
    "INOR": {"name": "Odisha", "districts": ["Puri", "Balasore", "Ganjam", "Cuttack"]},
    "INPY": {"name": "Puducherry", "districts": ["Puducherry Central", "Karaikal", "Mahe"]},
    "INPB": {"name": "Punjab", "districts": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"]},
    "INRJ": {"name": "Rajasthan", "districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota"]},
    "INSK": {"name": "Sikkim", "districts": ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"]},
    "INTN": {"name": "Tamil Nadu", "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"]},
    "INTG": {"name": "Telangana", "districts": ["Hyderabad", "Ranga Reddy", "Warangal", "Medchal"]},
    "INTR": {"name": "Tripura", "districts": ["West Tripura", "North Tripura", "South Tripura", "Dhalai"]},
    "INUP": {"name": "Uttar Pradesh", "districts": ["Lucknow", "Varanasi", "Kanpur", "Gorakhpur"]},
    "INUT": {"name": "Uttarakhand", "districts": ["Dehradun", "Haridwar", "Nainital", "Udham Singh Nagar"]},
    "INWB": {"name": "West Bengal", "districts": ["Kolkata", "North 24 Parganas", "Howrah", "Darjeeling"]},
}

MEDICINES = [
    ("MED-ANTIVENOM", "vial", 20.0),
    ("MED-IV-NACL", "bottle", 150.0),
    ("MED-OXYGEN-D", "cylinder", 12.0),
    ("MED-PARACETAMOL", "strip", 500.0),
    ("MED-CEFTRIAXONE", "vial", 45.0),
    ("MED-ORS", "sachet", 300.0),
    ("MED-TETANUS", "ampoule", 80.0),
]

async def seed_all_states():
    print("=== SEEDING ALL 36 INDIAN STATES & UTs INTO DATABASE ===")
    await init_db()

    async with async_session_maker() as session:
        # Check which states already exist
        res = await session.execute(select(PHC.state_id).distinct())
        existing_states = {r[0] for r in res.fetchall()}
        print(f"Currently populated states in DB: {existing_states}")

        states_to_seed = [sid for sid in ALL_36_STATES.keys() if sid not in existing_states]
        print(f"States to seed: {len(states_to_seed)}")

        now = datetime.utcnow()
        today = date.today()

        total_new_phcs = 0

        for sid in states_to_seed:
            s_info = ALL_36_STATES[sid]
            is_critical = sid in ["INSK", "INAR"]
            base_occ = 0.91 if is_critical else 0.65

            for d_idx, dist in enumerate(s_info["districts"][:3]):
                for p_idx in range(1, 3):
                    phc_id = f"PHC-{sid[2:]}-D{d_idx+1}-P{p_idx:02d}"
                    lat = 20.0 + random.uniform(-8.0, 10.0)
                    lon = 78.0 + random.uniform(-7.0, 12.0)

                    # Create PHC
                    phc = PHC(
                        id=phc_id,
                        name=f"{dist} Primary Health Centre #{p_idx}",
                        district_id=dist,
                        state_id=sid,
                        latitude=round(lat, 4),
                        longitude=round(lon, 4),
                    )
                    session.add(phc)
                    total_new_phcs += 1

                    # Bed record
                    total_beds = 16 if p_idx == 1 else 10
                    occ_beds = int(total_beds * base_occ)
                    bed = BedRecord(
                        phc_id=phc_id,
                        timestamp=now,
                        total_beds=total_beds,
                        occupied_beds=occ_beds,
                    )
                    session.add(bed)

                    # Staff record
                    from app.models.enums import StaffStatusEnum
                    staff = StaffAttendanceRecord(
                        phc_id=phc_id,
                        staff_id=f"STF-{phc_id}-01",
                        role="Medical Officer",
                        status=StaffStatusEnum.PRESENT,
                        timestamp=now,
                    )
                    session.add(staff)

                    # Stock records
                    for med_id, unit, base_qty in MEDICINES:
                        stock_mult = 0.3 if (is_critical and "ANTIVENOM" in med_id) else 1.0
                        qty = round(base_qty * stock_mult * random.uniform(0.8, 1.2), 1)
                        stock = StockRecord(
                            phc_id=phc_id,
                            medicine_id=med_id,
                            quantity=qty,
                            unit=unit,
                            expiry_date=today + timedelta(days=random.randint(60, 360)),
                            timestamp=now,
                        )
                        session.add(stock)

                        # Forecast record
                        risk = 0.85 if (is_critical and "ANTIVENOM" in med_id) else 0.15
                        severity = SeverityEnum.CRITICAL if risk > 0.7 else SeverityEnum.LOW
                        forecast = Forecast(
                            phc_id=phc_id,
                            medicine_id=med_id,
                            predicted_demand=round(base_qty * 0.4, 1),
                            stockout_risk=risk,
                            predicted_stockout_date=today + timedelta(days=2 if risk > 0.7 else 14),
                            severity=severity,
                            model_version="v2.0.0-fl-agg",
                            created_at=now,
                        )
                        session.add(forecast)

        await session.commit()
        print(f"SUCCESS: Seeded {total_new_phcs} PHCs with beds, stocks, and forecasts across {len(states_to_seed)} states!")

if __name__ == "__main__":
    asyncio.run(seed_all_states())
