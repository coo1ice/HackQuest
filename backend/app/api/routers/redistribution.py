from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.redistribution import (
    RedistributionRecommendationResponse,
    RedistributionRunRequest,
    RedistributionRunResponse,
)
from app.schemas.transfer import TransferResponse
from app.services import redistribution_service, transfer_service, audit_service
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRoleEnum
from typing import List, Optional

router = APIRouter(prefix="/redistribution", tags=["Decide & Redistribution"])

@router.get("/recommendations", response_model=List[RedistributionRecommendationResponse])
async def list_recommendations(
    status: Optional[str] = Query(None, description="Filter by pending, approved, or rejected"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List cross-district resource redistribution recommendations produced by OR-Tools solver."""
    return await redistribution_service.list_recommendations(db, status_filter=status)

@router.get("/recommendations/{id}", response_model=RedistributionRecommendationResponse)
async def get_recommendation_detail(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full detail of a recommendation including distance, expiry, and impact reasoning."""
    return await redistribution_service.get_recommendation(db, id)

@router.post(
    "/recommendations/{id}/approve",
    response_model=TransferResponse,
    dependencies=[Depends(require_role(
        UserRoleEnum.DISTRICT_OFFICER,
        UserRoleEnum.STATE_OFFICER,
        UserRoleEnum.NATIONAL_ADMIN
    ))],
)
async def approve_recommendation(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Officer approval for inter-district transfer directive. Initiates transfer record."""
    transfer = await redistribution_service.approve_recommendation(db, id, current_user.username)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="APPROVE_REDISTRIBUTION",
        target_id=str(id),
        metadata={"transfer_id": transfer.id, "status": transfer.status.value},
    )
    return await transfer_service.get_transfer(db, transfer.id)

@router.post(
    "/recommendations/{id}/reject",
    response_model=RedistributionRecommendationResponse,
    dependencies=[Depends(require_role(
        UserRoleEnum.DISTRICT_OFFICER,
        UserRoleEnum.STATE_OFFICER,
        UserRoleEnum.NATIONAL_ADMIN
    ))],
)
async def reject_recommendation(
    id: int,
    reason: str = Query("Discretionary officer override"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Officer rejection for redistribution proposal."""
    rec = await redistribution_service.reject_recommendation(db, id, current_user.username, reason=reason)
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="REJECT_REDISTRIBUTION",
        target_id=str(id),
        metadata={"reason": reason},
    )
    return rec

@router.post(
    "/run",
    response_model=RedistributionRunResponse,
    dependencies=[Depends(require_role(UserRoleEnum.STATE_OFFICER, UserRoleEnum.NATIONAL_ADMIN))],
)
async def run_optimizer(
    req: RedistributionRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger Google OR-Tools CP-SAT multi-facility transportation solver."""
    res = await redistribution_service.run_optimizer(
        db,
        district_id=req.district_id,
        state_id=req.state_id,
        medicine_ids=req.medicine_ids,
    )
    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="RUN_REDISTRIBUTION_OPTIMIZER",
        metadata={
            "recs_generated": res.generated_recommendations_count,
            "quantity_rebalanced": res.total_quantity_rebalanced,
            "exec_time_ms": res.solver_execution_time_ms,
        },
    )
    return res
