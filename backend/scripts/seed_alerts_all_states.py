import asyncio
import os
import sys
from datetime import datetime, date, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session_maker
from app.models.alert import Alert
from app.models.phc import PHC
from app.models.enums import SeverityEnum
from sqlalchemy import select

STATE_SPECIFIC_ALERTS = {
    "INMP": [
        {
            "phc_id": "PHC-MP-D1-P01",
            "resource": "Antivenom (Polyvalent)",
            "severity": SeverityEnum.CRITICAL,
            "days_ahead": 2,
        },
        {
            "phc_id": "PHC-MP-D1-P02",
            "resource": "D-Type Oxygen Cylinders",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 3,
        },
        {
            "phc_id": "PHC-MP-D2-P01",
            "resource": "ICU Isolation Beds",
            "severity": SeverityEnum.CRITICAL,
            "days_ahead": 1,
        },
        {
            "phc_id": "PHC-MP-D2-P02",
            "resource": "IV Fluid 0.9% NaCl",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 4,
        },
        {
            "phc_id": "PHC-MP-D3-P01",
            "resource": "Pediatric Paracetamol Syrup",
            "severity": SeverityEnum.MEDIUM,
            "days_ahead": 5,
        },
        {
            "phc_id": "PHC-MP-D3-P02",
            "resource": "Clinical Duty Medical Officers",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 2,
        },
    ],
    "INMH": [
        {
            "phc_id": "PHC-MH-D1-P01",
            "resource": "D-Type Oxygen Cylinders",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 3,
        },
        {
            "phc_id": "PHC-MH-D2-P01",
            "resource": "ICU Ventilator Beds",
            "severity": SeverityEnum.CRITICAL,
            "days_ahead": 1,
        },
    ],
    "INUP": [
        {
            "phc_id": "PHC-UP-D1-P01",
            "resource": "Anti-Rabies Vaccine",
            "severity": SeverityEnum.CRITICAL,
            "days_ahead": 2,
        },
        {
            "phc_id": "PHC-UP-D2-P01",
            "resource": "IV Fluid Ringer Lactate",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 3,
        },
    ],
    "INGA": [
        {
            "phc_id": "PHC-GA-D1-P01",
            "resource": "Emergency Trauma Kit",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 3,
        },
    ],
    "INKL": [
        {
            "phc_id": "PHC-KL-D1-P01",
            "resource": "Dengue Diagnostic NS1 Ag Test Kits",
            "severity": SeverityEnum.HIGH,
            "days_ahead": 2,
        },
    ],
}

async def seed_state_alerts():
    print("=== Seeding State-Specific Alerts into PostgreSQL ===")
    async with async_session_maker() as session:
        # Check all PHCs in DB
        phc_res = await session.execute(select(PHC))
        all_phcs = phc_res.scalars().all()
        phc_by_state = {}
        for p in all_phcs:
            phc_by_state.setdefault(p.state_id, []).append(p)

        added_count = 0
        today = date.today()

        for state_id, alerts_data in STATE_SPECIFIC_ALERTS.items():
            phcs_in_state = phc_by_state.get(state_id, [])
            if not phcs_in_state:
                continue

            for idx, a in enumerate(alerts_data):
                # Match facility or pick one from state
                target_phc = next((p for p in phcs_in_state if p.id == a["phc_id"]), phcs_in_state[idx % len(phcs_in_state)])
                
                # Check if identical alert exists
                existing = await session.execute(
                    select(Alert).where(Alert.phc_id == target_phc.id, Alert.resource_type == a["resource"])
                )
                if not existing.scalar_one_or_none():
                    alert_obj = Alert(
                        phc_id=target_phc.id,
                        resource_type=a["resource"],
                        severity=a["severity"],
                        predicted_date=today + timedelta(days=a["days_ahead"]),
                        created_at=datetime.utcnow() - timedelta(hours=idx * 2),
                    )
                    session.add(alert_obj)
                    added_count += 1

        # Also ensure remaining states each have at least 1-2 realistic active alerts
        for st_id, phcs in phc_by_state.items():
            if st_id in STATE_SPECIFIC_ALERTS or st_id == "INBR":
                continue
            if not phcs:
                continue
            p = phcs[0]
            existing = await session.execute(select(Alert).where(Alert.phc_id == p.id))
            if not existing.scalar_one_or_none():
                alert_obj = Alert(
                    phc_id=p.id,
                    resource_type="IV Fluid 0.9% NaCl" if st_id in ["INAS", "INOR"] else "Emergency Bed Buffer",
                    severity=SeverityEnum.HIGH if st_id in ["INAS", "INOR"] else SeverityEnum.MEDIUM,
                    predicted_date=today + timedelta(days=3),
                    created_at=datetime.utcnow() - timedelta(hours=4),
                )
                session.add(alert_obj)
                added_count += 1

        await session.commit()
        print(f"[OK] Added {added_count} state-specific alerts.")

        # Verify alert distribution across states
        alert_res = await session.execute(select(Alert))
        total_alerts = alert_res.scalars().all()
        print(f"[OK] Total active alerts in DB: {len(total_alerts)}")

if __name__ == "__main__":
    asyncio.run(seed_state_alerts())
