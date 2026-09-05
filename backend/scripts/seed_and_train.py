import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, async_session_maker, engine
from app.models import (
    User, UserRoleEnum, PHC, StockRecord, BedRecord,
    StaffAttendanceRecord, FootfallRecord, Forecast,
    RedistributionRecommendation, Transfer, Alert, ModelVersion,
    SeverityEnum, RecommendationStatusEnum, TransferStatusEnum, ModelTypeEnum,
)
from app.core.security import get_password_hash
from ml.data.synthetic_generator import generate_phc_hierarchy, generate_telemetry_timeseries
from ml.data.feature_engineering import build_forecasting_features
from ml.forecasting.train_xgboost import train_state_models
from ml.optimization.redistribution_solver import solve_redistribution
from datetime import datetime, date, timedelta
from sqlalchemy import select

async def main():
    print("=== NHRM Federated AI Platform: Database Initialization & Seeding ===")
    await init_db()

    async with async_session_maker() as session:
        # 1. Seed Default Users
        user_res = await session.execute(select(User).limit(1))
        if not user_res.scalar_one_or_none():
            print("\n1. Seeding default RBAC users...")
            demo_users = [
                ("admin", "password123", UserRoleEnum.NATIONAL_ADMIN, "IN"),
                ("bihar_officer", "password123", UserRoleEnum.STATE_OFFICER, "INBR"),
                ("muz_officer", "password123", UserRoleEnum.DISTRICT_OFFICER, "Muzaffarpur"),
                ("phc_nurse", "password123", UserRoleEnum.PHC_STAFF, "PHC-BR-MUZ-01"),
            ]
            for uname, pwd, role, scope in demo_users:
                user = User(
                    username=uname,
                    hashed_password=get_password_hash(pwd),
                    role=role,
                    scope_id=scope,
                )
                session.add(user)
            await session.commit()
            print("   -> Created users: admin, bihar_officer, muz_officer, phc_nurse (password: password123)")

        # 2. Seed PHCs and Telemetry
        phc_res = await session.execute(select(PHC).limit(1))
        if not phc_res.scalar_one_or_none():
            print("\n2. Generating synthetic multi-state telemetry (Bihar, Assam, Odisha, Maharashtra)...")
            phcs = generate_phc_hierarchy()
            for p in phcs:
                phc_obj = PHC(**p)
                session.add(phc_obj)
            await session.commit()
            print(f"   -> Seeded {len(phcs)} Primary Health Centres.")

            df_phcs, df_stocks, df_beds, df_staff, df_footfall = generate_telemetry_timeseries(phcs, days=60)
            print(f"   -> Generated {len(df_stocks)} stock records, {len(df_beds)} bed records.")

            # Batch insert telemetry
            print("   -> Ingesting telemetry into database...")
            # Insert recent 14 days of records for rapid query performance
            recent_stocks = df_stocks.tail(len(phcs) * 5 * 14)
            for _, r in recent_stocks.iterrows():
                session.add(StockRecord(
                    phc_id=r["phc_id"],
                    medicine_id=r["medicine_id"],
                    quantity=r["quantity"],
                    unit=r["unit"],
                    expiry_date=r["expiry_date"],
                    timestamp=r["timestamp"],
                ))

            recent_beds = df_beds.tail(len(phcs) * 14)
            for _, r in recent_beds.iterrows():
                session.add(BedRecord(
                    phc_id=r["phc_id"],
                    total_beds=r["total_beds"],
                    occupied_beds=r["occupied_beds"],
                    timestamp=r["timestamp"],
                ))
            await session.commit()
            print("   -> Telemetry ingestion completed.")

            # 3. Train Local XGBoost Models
            print("\n3. Building feature engineering & training local state XGBoost models...")
            features_df = build_forecasting_features(df_stocks, df_footfall)
            print(f"   -> Computed features with lags (t-1, t-7, t-14), rolling statistics & outbreak flags: {len(features_df)} rows.")

            for state_id in ["INBR", "INAS", "INOR", "INMH"]:
                state_feat = features_df[features_df["phc_id"].str.contains(f"-{state_id[2:]}-")].copy()
                if len(state_feat) > 50:
                    metrics = train_state_models(state_feat, state_id, output_dir="ml/model_registry")
                    print(f"   -> State {state_id}: Demand MAE={metrics['demand_mae']}, Stockout AUC={metrics['stockout_auc']}")
                    # Record model version in DB
                    mv = ModelVersion(
                        model_type=ModelTypeEnum.XGBOOST,
                        version=f"xgb-{state_id}-v2.1",
                        trained_at=datetime.utcnow(),
                        metrics=metrics,
                    )
                    session.add(mv)
            await session.commit()

            # 4. Generate Pre-calculated Forecasts & Active Alerts
            print("\n4. Populating active forecasts and triage alerts...")
            for p in phcs[:12]:
                is_crit = p["district_id"] in ["Muzaffarpur", "Vaishali"]
                med_list = ["MED-ANTIVENOM", "MED-OXYGEN-D", "MED-IV-NACL"]
                for med in med_list:
                    demand = 62.0 if is_crit else 28.0
                    risk = 0.88 if is_crit else 0.15
                    sev = SeverityEnum.CRITICAL if is_crit and med == "MED-ANTIVENOM" else (SeverityEnum.HIGH if is_crit else SeverityEnum.LOW)
                    days_left = 2.4 if sev == SeverityEnum.CRITICAL else (4.8 if sev == SeverityEnum.HIGH else 14.5)
                    stk_date = (date.today() + timedelta(days=int(days_left))) if days_left <= 7 else None

                    fc = Forecast(
                        phc_id=p["id"],
                        medicine_id=med,
                        predicted_demand=demand,
                        stockout_risk=risk,
                        predicted_stockout_date=stk_date,
                        severity=sev,
                        model_version="xgb-v2.1",
                        created_at=datetime.utcnow(),
                    )
                    session.add(fc)

                    # Create alert for high / critical
                    if sev in [SeverityEnum.HIGH, SeverityEnum.CRITICAL]:
                        al = Alert(
                            phc_id=p["id"],
                            resource_type="medicine",
                            severity=sev,
                            predicted_date=stk_date or date.today() + timedelta(days=3),
                            created_at=datetime.utcnow(),
                        )
                        session.add(al)
            await session.commit()
            print("   -> Forecasts & Active Alerts populated.")

            # 5. Run OR-Tools Redistribution Solver to generate initial recommendations
            print("\n5. Running Google OR-Tools CP-SAT optimizer for initial redistribution...")
            donor_candidates = [
                {"id": "PHC-BR-PAT-01", "name": "Patna Civil Warehouse", "latitude": 25.60, "longitude": 85.14, "surplus_qty": 350.0, "days_to_expiry": 140, "days_of_stock_after": 18.2},
                {"id": "PHC-BR-NAL-01", "name": "Nalanda Sub-Divisional Depot", "latitude": 25.20, "longitude": 85.52, "surplus_qty": 180.0, "days_to_expiry": 90, "days_of_stock_after": 15.0},
            ]
            deficit_candidates = [
                {"id": "PHC-BR-MUZ-01", "name": "Kanti PHC (Muzaffarpur)", "latitude": 26.12, "longitude": 85.39, "deficit_qty": 120.0, "severity": "critical", "daily_demand": 14.0},
                {"id": "PHC-BR-VAI-01", "name": "Hajipur Rural PHC (Vaishali)", "latitude": 25.68, "longitude": 85.22, "deficit_qty": 90.0, "severity": "critical", "daily_demand": 10.0},
            ]

            recs = solve_redistribution(donor_candidates, deficit_candidates, medicine_id="MED-ANTIVENOM")
            for r in recs:
                rec_db = RedistributionRecommendation(
                    medicine_id=r["medicine_id"],
                    from_phc_id=r["from_phc_id"],
                    to_phc_id=r["to_phc_id"],
                    quantity=r["quantity"],
                    distance_km=r["distance_km"],
                    days_to_expiry=r["days_to_expiry"],
                    predicted_impact=r["predicted_impact"],
                    status=RecommendationStatusEnum.PENDING,
                    created_at=datetime.utcnow(),
                )
                session.add(rec_db)
                await session.flush()

                # Instantiate one active transfer in dispatched status for tracking demo
                if r["from_phc_id"] == "PHC-BR-PAT-01":
                    rec_db.status = RecommendationStatusEnum.APPROVED
                    tr = Transfer(
                        recommendation_id=rec_db.id,
                        status=TransferStatusEnum.DISPATCHED,
                        status_history=[
                            {"status": "approved", "changed_at": (datetime.utcnow() - timedelta(hours=3)).isoformat() + "Z", "changed_by": "bihar_officer", "notes": "Approved under NDMA Sec 38"},
                            {"status": "dispatched", "changed_at": (datetime.utcnow() - timedelta(minutes=45)).isoformat() + "Z", "changed_by": "dispatcher_patna", "notes": "Convoy vehicle BR-01-GB-4421 departed via NH-22"},
                        ]
                    )
                    session.add(tr)
            await session.commit()
            print(f"   -> Generated {len(recs)} optimization recommendations with 1 active live transfer.")

    print("\n=== All Setup & Training Completed Successfully! ===")

if __name__ == "__main__":
    asyncio.run(main())
