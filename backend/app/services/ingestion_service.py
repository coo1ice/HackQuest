from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.models.phc import PHC
from app.models.stock import StockRecord
from app.models.bed import BedRecord
from app.models.staff import StaffAttendanceRecord
from app.models.footfall import FootfallRecord
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
