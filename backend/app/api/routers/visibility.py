from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.phc import (
    NationalOverviewResponse,
    DistrictSummaryResponse,
)
from app.services import visibility_service
from app.api.deps import get_current_user
from app.models.user import User
from typing import Dict, Any, List

router = APIRouter(tags=["Visibility & Aggregations"])

@router.get("/national/overview", response_model=NationalOverviewResponse)
async def get_national_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate health score, reporting status, and triage tiers per state."""
    return await visibility_service.get_national_overview(db)

@router.get("/states/{state_id}/overview")
async def get_state_overview(
    state_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate health score and triage status across all districts in a state."""
    return await visibility_service.get_state_overview(db, state_id)

@router.get("/districts/{district_id}/phcs", response_model=DistrictSummaryResponse)
async def get_district_phcs(
    district_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all Primary Health Centres in a district with live ICU and stock metrics."""
    return await visibility_service.get_district_phcs(db, district_id)

@router.get("/phc/{phc_id}")
async def get_phc_detail(
    phc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return single PHC detail including current stock, beds, and forecasts."""
    return await visibility_service.get_phc_detail(db, phc_id)

@router.get("/phc/{phc_id}/history")
async def get_phc_history(
    phc_id: str,
    metric: str = Query("stock", description="Metric to query: stock, beds, footfall"),
    from_date: str = Query("2026-01-01", alias="from"),
    to_date: str = Query("2026-12-31", alias="to"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return historical time-series data for charting."""
    return await visibility_service.get_phc_history(db, phc_id, metric, from_date, to_date)
