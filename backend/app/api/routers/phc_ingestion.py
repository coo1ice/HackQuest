from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.stock import StockRecordCreate, StockRecordResponse, SyncBatchRequest, SyncBatchResponse
from app.schemas.bed import BedRecordCreate, BedRecordResponse
from app.schemas.staff import StaffAttendanceCreate, StaffAttendanceResponse
from app.schemas.footfall import FootfallCreate, FootfallResponse
from app.services import ingestion_service, audit_service
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRoleEnum

router = APIRouter(prefix="/phc", tags=["PHC Ingestion"])

@router.post("/{phc_id}/stock", response_model=StockRecordResponse, status_code=status.HTTP_201_CREATED)
async def push_stock_update(
    phc_id: str,
    stock_in: StockRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Push new or updated medicine stock telemetry for a PHC."""
    record = await ingestion_service.ingest_stock(db, phc_id, stock_in)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="INGEST_STOCK",
        target_id=phc_id,
        metadata={"medicine_id": stock_in.medicine_id, "quantity": stock_in.quantity},
    )
    return record

@router.post("/{phc_id}/beds", response_model=BedRecordResponse, status_code=status.HTTP_201_CREATED)
async def push_bed_update(
    phc_id: str,
    bed_in: BedRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Push bed capacity & occupancy update for a PHC."""
    record = await ingestion_service.ingest_beds(db, phc_id, bed_in)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="INGEST_BEDS",
        target_id=phc_id,
        metadata={"total_beds": bed_in.total_beds, "occupied_beds": bed_in.occupied_beds},
    )
    return record

@router.post("/{phc_id}/staff-attendance", response_model=StaffAttendanceResponse, status_code=status.HTTP_201_CREATED)
async def push_staff_attendance(
    phc_id: str,
    staff_in: StaffAttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log individual staff attendance check-in/out."""
    record = await ingestion_service.ingest_staff_attendance(db, phc_id, staff_in)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="INGEST_STAFF",
        target_id=phc_id,
        metadata={"staff_id": staff_in.staff_id, "status": staff_in.status.value},
    )
    return record

@router.post("/{phc_id}/footfall", response_model=FootfallResponse, status_code=status.HTTP_201_CREATED)
async def push_footfall(
    phc_id: str,
    footfall_in: FootfallCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log patient footfall count by department."""
    record = await ingestion_service.ingest_footfall(db, phc_id, footfall_in)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="INGEST_FOOTFALL",
        target_id=phc_id,
        metadata={"patient_count": footfall_in.patient_count, "department": footfall_in.department},
    )
    return record

@router.post("/{phc_id}/sync-batch", response_model=SyncBatchResponse, status_code=status.HTTP_200_OK)
async def sync_offline_batch(
    phc_id: str,
    batch_in: SyncBatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk offline sync endpoint for edge field workers and queued telemetry."""
    response = await ingestion_service.sync_offline_batch(db, phc_id, batch_in)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="SYNC_BATCH",
        target_id=phc_id,
        metadata=response.processed_counts,
    )
    return response

@router.post("/bulk-upload", status_code=status.HTTP_200_OK)
async def upload_bulk_file(
    file: UploadFile = File(..., description="CSV or Excel (.xlsx) file containing PHC telemetry"),
    category: Optional[str] = Form("auto", description="Category: auto, stock, beds, staff, or footfall"),
    default_phc_id: Optional[str] = Form(None, description="Default PHC ID if not specified per row"),
    dry_run: bool = Form(False, description="If true, only validates and previews rows without committing to DB"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Drag and drop bulk file upload for PHC telemetry.
    Supports CSV and Excel (.xlsx) with instant validation ('Check it') when dry_run=True,
    and database commitment ('Allow it') when dry_run=False.
    """
    content = await file.read()
    result = await ingestion_service.process_bulk_file(
        db=db,
        file_bytes=content,
        filename=file.filename or "upload.csv",
        category=category,
        default_phc_id=default_phc_id,
        dry_run=dry_run,
        current_user=current_user,
    )

    if not dry_run and result.get("committed_records_count", 0) > 0:
        await audit_service.log_action(
            db,
            actor_id=current_user.username,
            action="INGEST_BULK_UPLOAD",
            target_id=file.filename or "spreadsheet",
            metadata={
                "category": result["category"],
                "total_rows": result["total_rows"],
                "committed_count": result["committed_records_count"],
            },
        )

    return result
