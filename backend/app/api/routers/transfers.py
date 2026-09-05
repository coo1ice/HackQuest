from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.transfer import (
    TransferResponse,
    TransferStatusUpdateRequest,
    OutcomeLogRequest,
    OutcomeSummaryResponse,
)
from app.services import transfer_service, audit_service
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRoleEnum
from typing import List, Optional

router = APIRouter(tags=["Act & Transfers"])

@router.get("/transfers", response_model=List[TransferResponse])
async def list_transfers(
    status: Optional[str] = Query(None, description="Filter by approved, dispatched, received"),
    state_id: Optional[str] = Query(None, description="Filter by state ID e.g. INMP"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List inter-district emergency resource transfers with status and cargo timeline."""
    effective_state_id = state_id
    if current_user.role == UserRoleEnum.STATE_OFFICER:
        effective_state_id = current_user.scope_id

    return await transfer_service.list_transfers(
        db, status_filter=status, state_id=effective_state_id
    )

@router.get("/transfers/{id}", response_model=TransferResponse)
async def get_transfer_detail(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return complete transfer metadata, cargo manifest, and transit timeline."""
    return await transfer_service.get_transfer(db, id)

@router.patch("/transfers/{id}/status", response_model=TransferResponse)
async def update_transfer_status(
    id: int,
    req: TransferStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update transfer lifecycle status. Validates strict transition: approved -> dispatched -> received."""
    transfer = await transfer_service.update_transfer_status(
        db, id, req, actor_username=current_user.username
    )
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="UPDATE_TRANSFER_STATUS",
        target_id=str(id),
        metadata={"new_status": req.status.value, "notes": req.notes},
    )
    return await transfer_service.get_transfer(db, id)

@router.post("/outcomes/log", status_code=status.HTTP_201_CREATED)
async def log_outcome(
    req: OutcomeLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record whether a completed transfer prevented an impending stockout (feeds ML feedback loop)."""
    outcome = await transfer_service.log_outcome(db, req)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="LOG_OUTCOME",
        target_id=str(req.transfer_id),
        metadata={"stockout_prevented": req.stockout_prevented},
    )
    return {"status": "SUCCESS", "transfer_id": outcome.transfer_id, "stockout_prevented": outcome.stockout_prevented}

@router.get("/outcomes/summary", response_model=OutcomeSummaryResponse)
async def get_outcomes_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return historical outcome accuracy metrics and stockouts prevented."""
    return await transfer_service.get_outcomes_summary(db)
