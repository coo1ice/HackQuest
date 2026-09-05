from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from datetime import datetime
from app.database import get_db
from app.models.alert import Alert
from app.models.phc import PHC
from app.schemas.alert import AlertResponse
from app.services import audit_service
from app.api.deps import get_current_user
from app.models.user import User, UserRoleEnum
from typing import List, Optional

router = APIRouter(prefix="/alerts", tags=["Act & Alerts"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by low, medium, high, critical"),
    state_id: Optional[str] = Query(None, description="Filter by state code, e.g. INMP, INBR"),
    district_id: Optional[str] = Query(None, description="Filter by district"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return active health resource alerts sorted by urgency with role-based jurisdiction filtering."""
    q = select(Alert, PHC).join(PHC, Alert.phc_id == PHC.id).order_by(desc(Alert.created_at))

    # RBAC jurisdiction enforcement
    if current_user.role == UserRoleEnum.STATE_OFFICER:
        # A state officer only sees alerts within their designated state (e.g. INMP)
        q = q.where(PHC.state_id == current_user.scope_id)
    elif current_user.role == UserRoleEnum.DISTRICT_OFFICER:
        # A district officer only sees alerts in their district
        q = q.where(PHC.district_id == current_user.scope_id)
    elif current_user.role == UserRoleEnum.PHC_STAFF:
        # A PHC nurse or medical officer only sees alerts for their facility
        q = q.where(Alert.phc_id == current_user.scope_id)
    else:
        # National admin can filter by state_id or district_id
        if state_id and state_id != "all":
            q = q.where(PHC.state_id == state_id)
        if district_id and district_id != "all":
            q = q.where(PHC.district_id == district_id)

    if severity and severity != "all":
        # Case-insensitive comparison of severity
        q = q.where(func.lower(func.cast(Alert.severity, func.text)).like(f"%{severity.lower()}%"))

    res = await db.execute(q)
    rows = res.all()

    responses = []
    for a, phc in rows:
        responses.append(
            AlertResponse(
                id=a.id,
                phc_id=a.phc_id,
                phc_name=phc.name if phc else a.phc_id,
                district_id=phc.district_id if phc else None,
                state_id=phc.state_id if phc else None,
                resource_type=a.resource_type,
                severity=a.severity,
                predicted_date=a.predicted_date,
                linked_recommendation_id=a.linked_recommendation_id,
                acknowledged_by=a.acknowledged_by,
                acknowledged_at=a.acknowledged_at,
                created_at=a.created_at,
            )
        )
    return responses

@router.get("/summary")
async def alerts_summary(
    state_id: Optional[str] = Query(None),
    district_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregate statistics of active alerts scoped to officer jurisdiction."""
    q = select(Alert, PHC).join(PHC, Alert.phc_id == PHC.id)

    if current_user.role == UserRoleEnum.STATE_OFFICER:
        q = q.where(PHC.state_id == current_user.scope_id)
    elif current_user.role == UserRoleEnum.DISTRICT_OFFICER:
        q = q.where(PHC.district_id == current_user.scope_id)
    elif current_user.role == UserRoleEnum.PHC_STAFF:
        q = q.where(Alert.phc_id == current_user.scope_id)
    else:
        if state_id and state_id != "all":
            q = q.where(PHC.state_id == state_id)
        if district_id and district_id != "all":
            q = q.where(PHC.district_id == district_id)

    res = await db.execute(q)
    rows = res.all()
    alerts = [a for a, _ in rows]

    total = len(alerts)
    critical = sum(1 for a in alerts if str(getattr(a.severity, "value", a.severity)).lower() == "critical")
    warning = sum(1 for a in alerts if str(getattr(a.severity, "value", a.severity)).lower() in ("high", "medium"))
    staff = sum(1 for a in alerts if "staff" in str(a.resource_type).lower())

    return {
        "total_active_alerts": total,
        "critical_count": critical,
        "warning_count": warning,
        "staff_shortage_count": staff,
    }

@router.get("/{id}", response_model=AlertResponse)
async def get_alert(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return single alert detail and associated recommendation link."""
    a = await db.get(Alert, id)
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{id}' not found")
    phc = await db.get(PHC, a.phc_id)
    return AlertResponse(
        id=a.id,
        phc_id=a.phc_id,
        phc_name=phc.name if phc else a.phc_id,
        district_id=phc.district_id if phc else None,
        state_id=phc.state_id if phc else None,
        resource_type=a.resource_type,
        severity=a.severity,
        predicted_date=a.predicted_date,
        linked_recommendation_id=a.linked_recommendation_id,
        acknowledged_by=a.acknowledged_by,
        acknowledged_at=a.acknowledged_at,
        created_at=a.created_at,
    )

@router.patch("/{id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an alert as acknowledged by the current officer."""
    a = await db.get(Alert, id)
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{id}' not found")

    a.acknowledged_by = current_user.username
    a.acknowledged_at = datetime.utcnow()
    await db.commit()
    await db.refresh(a)

    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="ACKNOWLEDGE_ALERT",
        target_id=str(id),
        metadata={"phc_id": a.phc_id, "severity": a.severity.value},
    )

    phc = await db.get(PHC, a.phc_id)
    return AlertResponse(
        id=a.id,
        phc_id=a.phc_id,
        phc_name=phc.name if phc else a.phc_id,
        district_id=phc.district_id if phc else None,
        state_id=phc.state_id if phc else None,
        resource_type=a.resource_type,
        severity=a.severity,
        predicted_date=a.predicted_date,
        linked_recommendation_id=a.linked_recommendation_id,
        acknowledged_by=a.acknowledged_by,
        acknowledged_at=a.acknowledged_at,
        created_at=a.created_at,
    )
