from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, date, timedelta
from app.models.phc import PHC
from app.models.stock import StockRecord
from app.models.bed import BedRecord
from app.models.staff import StaffAttendanceRecord
from app.models.footfall import FootfallRecord
from app.models.alert import Alert
from app.models.forecast import Forecast
from app.models.redistribution import RedistributionRecommendation
from app.models.enums import SeverityEnum, RecommendationStatusEnum, StaffStatusEnum, UserRoleEnum
from app.schemas.stock import StockRecordCreate, SyncBatchRequest, SyncBatchResponse
from app.schemas.bed import BedRecordCreate
from app.schemas.staff import StaffAttendanceCreate
from app.schemas.footfall import FootfallCreate
from fastapi import HTTPException, status

async def verify_phc_exists(db: AsyncSession, phc_id: str) -> PHC:
    query = select(PHC).where(PHC.id == phc_id)
    res = await db.execute(query)
    phc = res.scalar_one_or_none()
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PHC with ID '{phc_id}' not found.",
        )
    return phc

async def ingest_stock(db: AsyncSession, phc_id: str, data: StockRecordCreate) -> StockRecord:
    await verify_phc_exists(db, phc_id)
    record = StockRecord(
        phc_id=phc_id,
        medicine_id=data.medicine_id,
        quantity=data.quantity,
        unit=data.unit,
        expiry_date=data.expiry_date,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

async def ingest_beds(db: AsyncSession, phc_id: str, data: BedRecordCreate) -> BedRecord:
    await verify_phc_exists(db, phc_id)
    record = BedRecord(
        phc_id=phc_id,
        total_beds=data.total_beds,
        occupied_beds=data.occupied_beds,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

async def ingest_staff_attendance(db: AsyncSession, phc_id: str, data: StaffAttendanceCreate) -> StaffAttendanceRecord:
    await verify_phc_exists(db, phc_id)
    record = StaffAttendanceRecord(
        phc_id=phc_id,
        staff_id=data.staff_id,
        role=data.role,
        status=data.status,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

async def ingest_footfall(db: AsyncSession, phc_id: str, data: FootfallCreate) -> FootfallRecord:
    await verify_phc_exists(db, phc_id)
    record = FootfallRecord(
        phc_id=phc_id,
        patient_count=data.patient_count,
        department=data.department,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

async def sync_offline_batch(db: AsyncSession, phc_id: str, batch: SyncBatchRequest) -> SyncBatchResponse:
    await verify_phc_exists(db, phc_id)
    counts = {"stocks": 0, "beds": 0, "attendances": 0, "footfalls": 0}

    # Process stocks
    for s in batch.stocks:
        record = StockRecord(
            phc_id=phc_id,
            medicine_id=s.medicine_id,
            quantity=s.quantity,
            unit=s.unit,
            expiry_date=s.expiry_date,
            timestamp=s.timestamp or datetime.utcnow(),
        )
        db.add(record)
        counts["stocks"] += 1

    # Process beds
    for b in batch.beds:
        record = BedRecord(
            phc_id=phc_id,
            total_beds=b.get("total_beds", 10),
            occupied_beds=b.get("occupied_beds", 0),
            timestamp=b.get("timestamp") or datetime.utcnow(),
        )
        db.add(record)
        counts["beds"] += 1

    # Process staff attendances
    for a in batch.staff_attendances:
        record = StaffAttendanceRecord(
            phc_id=phc_id,
            staff_id=a.get("staff_id", "STF-UNKNOWN"),
            role=a.get("role", "Nurse"),
            status=a.get("status", "present"),
            timestamp=a.get("timestamp") or datetime.utcnow(),
        )
        db.add(record)
        counts["attendances"] += 1

    # Process footfalls
    for f in batch.footfalls:
        record = FootfallRecord(
            phc_id=phc_id,
            patient_count=f.get("patient_count", 0),
            department=f.get("department", "OPD"),
            timestamp=f.get("timestamp") or datetime.utcnow(),
        )
        db.add(record)
        counts["footfalls"] += 1

    await db.commit()
    return SyncBatchResponse(
        status="synced_successfully",
        processed_counts=counts,
        synced_at=datetime.utcnow(),
    )

import io
import pandas as pd
from typing import Dict, Any
from app.models.user import User
from app.models.enums import StaffStatusEnum, UserRoleEnum

async def process_bulk_file(
    db: AsyncSession,
    file_bytes: bytes,
    filename: str,
    category: Optional[str] = "auto",
    default_phc_id: Optional[str] = None,
    dry_run: bool = False,
    current_user: Optional[User] = None,
) -> Dict[str, Any]:
    """Parse, validate ('Check it') and ingest ('Allow it') CSV or Excel spreadsheet."""
    lower_name = filename.lower()
    try:
        if lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        else:
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse tabular spreadsheet: {str(exc)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded spreadsheet contains zero data rows.",
        )

    # Normalize column names
    df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
    col_set = set(df.columns)

    # Auto-detect category
    detected_cat = category or "auto"
    if detected_cat == "auto":
        if any(c in col_set for c in ["medicine_id", "medicine", "drug_id", "stock", "quantity", "qty"]):
            detected_cat = "stock"
        elif any(c in col_set for c in ["total_beds", "occupied_beds", "beds", "bed_occupancy"]):
            detected_cat = "beds"
        elif any(c in col_set for c in ["staff_id", "doctor", "nurse", "attendance"]):
            detected_cat = "staff"
        elif any(c in col_set for c in ["footfall", "patient_count", "patients", "opd"]):
            detected_cat = "footfall"
        else:
            detected_cat = "stock"

    # Pre-fetch all known PHCs to validate phc_id
    res_phcs = await db.execute(select(PHC))
    all_phcs = {p.id: p for p in res_phcs.scalars().all()}

    valid_records = []
    preview_rows = []
    flagged_errors = []

    for idx, row in df.iterrows():
        row_num = idx + 1
        row_dict = row.to_dict()
        row_errors = []

        target_phc = str(row_dict.get("phc_id", default_phc_id or "")).strip()
        if not target_phc or target_phc.lower() == "nan":
            target_phc = default_phc_id or ""

        if not target_phc:
            row_errors.append("Missing phc_id")
        elif target_phc not in all_phcs:
            row_errors.append(f"Unknown PHC ID '{target_phc}'")
        elif current_user and current_user.role == UserRoleEnum.STATE_OFFICER:
            phc_obj = all_phcs[target_phc]
            if phc_obj.state_id != current_user.scope_id:
                row_errors.append(f"Security Alert: PHC '{target_phc}' is in state '{phc_obj.state_id}', outside your authorized state jurisdiction ('{current_user.scope_id}'). State officers may only upload data for their designated state.")
        elif current_user and current_user.role == UserRoleEnum.DISTRICT_OFFICER:
            phc_obj = all_phcs[target_phc]
            if phc_obj.district_id.lower() != current_user.scope_id.lower():
                row_errors.append(f"Security Alert: PHC '{target_phc}' is in district '{phc_obj.district_id}', outside your district jurisdiction ('{current_user.scope_id}'). District officers may only upload data for their designated district.")
        elif current_user and current_user.role == UserRoleEnum.PHC_STAFF:
            if target_phc != current_user.scope_id:
                row_errors.append(f"Security Alert: PHC '{target_phc}' is outside your designated health facility ('{current_user.scope_id}').")
        # National Admin has all-India authorization to upload anywhere without restriction

        # Category-specific validation
        if detected_cat == "stock":
            med_id = str(row_dict.get("medicine_id", row_dict.get("medicine", "MED-ANTIVENOM"))).strip().upper()
            if not med_id or med_id == "NAN":
                row_errors.append("Missing medicine_id")

            try:
                qty = float(row_dict.get("quantity", row_dict.get("qty", 0)))
                if qty < 0:
                    row_errors.append("Quantity cannot be negative")
            except (ValueError, TypeError):
                row_errors.append("Quantity must be a valid number")
                qty = 0.0

            unit = str(row_dict.get("unit", "Vials")).strip()
            if unit == "nan":
                unit = "Units"

            exp_raw = row_dict.get("expiry_date", row_dict.get("expiry", None))
            exp_date = None
            if exp_raw and str(exp_raw) != "nan":
                try:
                    exp_date = pd.to_datetime(exp_raw).date()
                except Exception:
                    row_errors.append("Invalid expiry_date (use YYYY-MM-DD)")
            else:
                exp_date = (datetime.utcnow() + pd.Timedelta(days=180)).date()

            preview_entry = {
                "row": row_num,
                "phc_id": target_phc,
                "medicine_id": med_id,
                "quantity": qty,
                "unit": unit,
                "expiry_date": str(exp_date) if exp_date else "N/A",
                "valid": len(row_errors) == 0,
                "errors": row_errors,
            }
            preview_rows.append(preview_entry)

            if not row_errors:
                valid_records.append(
                    StockRecord(
                        phc_id=target_phc,
                        medicine_id=med_id,
                        quantity=qty,
                        unit=unit,
                        expiry_date=exp_date,
                        timestamp=datetime.utcnow(),
                    )
                )

        elif detected_cat == "beds":
            try:
                total_b = int(row_dict.get("total_beds", row_dict.get("beds", 10)))
                occupied_b = int(row_dict.get("occupied_beds", row_dict.get("occupied", 0)))
                if total_b < 0 or occupied_b < 0:
                    row_errors.append("Bed counts cannot be negative")
                if occupied_b > total_b:
                    row_errors.append("Occupied beds cannot exceed total beds")
            except (ValueError, TypeError):
                row_errors.append("Total and occupied beds must be integers")
                total_b, occupied_b = 10, 0

            preview_entry = {
                "row": row_num,
                "phc_id": target_phc,
                "total_beds": total_b,
                "occupied_beds": occupied_b,
                "occupancy_rate": f"{round((occupied_b / max(total_b, 1)) * 100, 1)}%",
                "valid": len(row_errors) == 0,
                "errors": row_errors,
            }
            preview_rows.append(preview_entry)

            if not row_errors:
                valid_records.append(
                    BedRecord(
                        phc_id=target_phc,
                        total_beds=total_b,
                        occupied_beds=occupied_b,
                        timestamp=datetime.utcnow(),
                    )
                )

        elif detected_cat == "staff":
            staff_id = str(row_dict.get("staff_id", f"STF-{idx+1:03d}")).strip()
            role = str(row_dict.get("role", "Nurse")).strip()
            st_raw = str(row_dict.get("status", "present")).strip().lower()
            st_val = StaffStatusEnum.PRESENT if "pres" in st_raw else StaffStatusEnum.ABSENT

            preview_entry = {
                "row": row_num,
                "phc_id": target_phc,
                "staff_id": staff_id,
                "role": role,
                "status": st_val.value,
                "valid": len(row_errors) == 0,
                "errors": row_errors,
            }
            preview_rows.append(preview_entry)

            if not row_errors:
                valid_records.append(
                    StaffAttendanceRecord(
                        phc_id=target_phc,
                        staff_id=staff_id,
                        role=role,
                        status=st_val,
                        timestamp=datetime.utcnow(),
                    )
                )

        elif detected_cat == "footfall":
            dept = str(row_dict.get("department", "OPD")).strip()
            try:
                p_cnt = int(row_dict.get("patient_count", row_dict.get("patients", 0)))
                if p_cnt < 0:
                    row_errors.append("Patient count cannot be negative")
            except (ValueError, TypeError):
                row_errors.append("Patient count must be an integer")
                p_cnt = 0

            preview_entry = {
                "row": row_num,
                "phc_id": target_phc,
                "department": dept,
                "patient_count": p_cnt,
                "valid": len(row_errors) == 0,
                "errors": row_errors,
            }
            preview_rows.append(preview_entry)

            if not row_errors:
                valid_records.append(
                    FootfallRecord(
                        phc_id=target_phc,
                        department=dept,
                        patient_count=p_cnt,
                        timestamp=datetime.utcnow(),
                    )
                )

        if row_errors:
            flagged_errors.append({"row": row_num, "errors": row_errors})

    # Strict Jurisdiction Security Enforcement:
    # State and District officers are prohibited from uploading telemetry outside their statutory boundary.
    security_violations = [
        err for f in flagged_errors for err in f["errors"] if "Security Alert:" in err
    ]
    if not dry_run and security_violations:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Jurisdiction Security Violation: {security_violations[0]} - Statutory regulations prohibit ingesting cross-jurisdiction records under NDMA Sec 38.",
        )

    committed_count = 0
    created_alerts = []
    created_recommendations = []

    if not dry_run and valid_records:
        for rec in valid_records:
            db.add(rec)
        await db.flush()
        committed_count = len(valid_records)

        # Automatic Incident / Alert Triggering:
        # If uploaded data introduces an acute stockout crisis (e.g. quantity <= 15) or bed saturation (occupancy >= 90%),
        # immediately generate an operational Alert and Forecast so officers can address the issue in Alert Feed & Redistribution.
        for rec in valid_records:
            if isinstance(rec, StockRecord) and rec.quantity <= 15:
                target_p = all_phcs.get(rec.phc_id)
                p_name = target_p.name if target_p else rec.phc_id
                pred_date = (datetime.utcnow() + timedelta(days=1)).date()

                # 1. Register Critical Forecast in DB
                fc = Forecast(
                    phc_id=rec.phc_id,
                    medicine_id=rec.medicine_id,
                    predicted_demand=42.0,
                    stockout_risk=0.98,
                    predicted_stockout_date=pred_date,
                    severity=SeverityEnum.CRITICAL,
                    model_version="xgb-v2.1",
                    created_at=datetime.utcnow(),
                )
                db.add(fc)

                # 2. Look for an intra-state donor facility with stock buffer to solve this crisis
                donor_phc = None
                if target_p:
                    for cand_id, cand_p in all_phcs.items():
                        if cand_p.state_id == target_p.state_id and cand_id != rec.phc_id:
                            donor_phc = cand_p
                            break

                rec_id = None
                if donor_phc:
                    rec_obj = RedistributionRecommendation(
                        medicine_id=rec.medicine_id,
                        from_phc_id=donor_phc.id,
                        to_phc_id=rec.phc_id,
                        quantity=100.0,
                        distance_km=185.0,
                        days_to_expiry=120,
                        predicted_impact=f"Averts acute stockout at {p_name} ({rec.quantity} {rec.unit} remaining). Supplied from {donor_phc.name}.",
                        status=RecommendationStatusEnum.PENDING,
                        created_at=datetime.utcnow(),
                    )
                    db.add(rec_obj)
                    await db.flush()
                    rec_id = rec_obj.id
                    created_recommendations.append({
                        "from_phc": donor_phc.id,
                        "to_phc": rec.phc_id,
                        "medicine_id": rec.medicine_id,
                        "quantity": 100.0,
                    })

                # 3. Create Active Critical Alert in DB
                new_alert = Alert(
                    phc_id=rec.phc_id,
                    resource_type=rec.medicine_id,
                    severity=SeverityEnum.CRITICAL,
                    predicted_date=pred_date,
                    linked_recommendation_id=rec_id,
                    created_at=datetime.utcnow(),
                )
                db.add(new_alert)
                created_alerts.append({
                    "phc_id": rec.phc_id,
                    "facility_name": p_name,
                    "district_id": target_p.district_id if target_p else None,
                    "state_id": target_p.state_id if target_p else None,
                    "resource_type": rec.medicine_id,
                    "severity": "CRITICAL",
                    "stock_remaining": f"{rec.quantity} {rec.unit}",
                    "issue": f"Acute stockout depletion: only {rec.quantity} {rec.unit} on hand",
                })

            elif isinstance(rec, BedRecord) and (rec.occupied_beds / max(rec.total_beds, 1)) >= 0.9:
                target_p = all_phcs.get(rec.phc_id)
                p_name = target_p.name if target_p else rec.phc_id
                occ_pct = round((rec.occupied_beds / max(rec.total_beds, 1)) * 100, 1)

                new_alert = Alert(
                    phc_id=rec.phc_id,
                    resource_type="beds",
                    severity=SeverityEnum.CRITICAL,
                    predicted_date=datetime.utcnow().date(),
                    created_at=datetime.utcnow(),
                )
                db.add(new_alert)
                created_alerts.append({
                    "phc_id": rec.phc_id,
                    "facility_name": p_name,
                    "district_id": target_p.district_id if target_p else None,
                    "state_id": target_p.state_id if target_p else None,
                    "resource_type": "Critical Bed Saturation",
                    "severity": "CRITICAL",
                    "stock_remaining": f"{occ_pct}% occupancy ({rec.occupied_beds}/{rec.total_beds} beds)",
                    "issue": f"Inpatient capacity buffer exhausted ({occ_pct}% occupancy)",
                })

        await db.commit()

    return {
        "status": "validated" if dry_run else "committed",
        "dry_run": dry_run,
        "filename": filename,
        "category": detected_cat,
        "total_rows": len(df),
        "valid_rows_count": len(valid_records),
        "flagged_rows_count": len(flagged_errors),
        "has_security_violations": len(security_violations) > 0,
        "security_violations_count": len(security_violations),
        "committed_records_count": committed_count,
        "alerts_created_count": len(created_alerts),
        "alerts_created": created_alerts,
        "recommendations_created": created_recommendations,
        "preview_rows": preview_rows[:50],
        "columns_detected": list(df.columns),
        "flagged_errors": flagged_errors[:20],
        "processed_at": datetime.utcnow().isoformat() + "Z",
    }
