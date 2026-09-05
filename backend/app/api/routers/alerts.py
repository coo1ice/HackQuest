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

def format_alert_response(a: Alert, phc: Optional[PHC]) -> AlertResponse:
    is_ack = bool(a.acknowledged_by)
    status_val = "acknowledged" if is_ack else "active"
    
    facility_name = phc.name if phc else a.phc_id
    district_name = phc.district_id if phc else "Unknown District"
    res_type = a.resource_type.lower()
    
    if "med" in res_type or "antivenom" in res_type or "oxygen" in res_type or "saline" in res_type or "paracetamol" in res_type or "atropine" in res_type:
        title = f"Stockout Depletion Risk: {a.resource_type.upper()}"
        message = f"Depletion projected at {facility_name} ({district_name}) on {a.predicted_date}. Burn rate requires inter-district stock rebalancing."
        action = f"Initiate emergency inter-district reallocation directive" if a.linked_recommendation_id else f"Dispatch priority supply requisition for {a.resource_type}"
    elif "bed" in res_type:
        title = f"Critical Inpatient Bed Surge: {facility_name}"
        message = f"Inpatient capacity buffer depleted past 90% threshold in {district_name}. Patient triage diversion protocol recommended."
        action = "Activate overflow ward beds and coordinate patient triage diversion"
    elif "staff" in res_type:
        title = f"Severe Clinical Staff Deficit: {facility_name}"
        message = f"Clinical duty staffing below mandatory casualty coverage thresholds in {district_name}."
        action = "Mobilize on-call medical response team"
    else:
        title = f"Resource Alert: {a.resource_type.title()}"
        message = f"Surveillance alert logged for {facility_name} ({district_name})."
        action = "Inspect facility operational telemetry"

    return AlertResponse(
        id=a.id,
        phc_id=a.phc_id,
        phc_name=facility_name,
        district_id=phc.district_id if phc else None,
        district_name=district_name,
        state_id=phc.state_id if phc else None,
        resource_type=a.resource_type,
        alert_type=a.resource_type,
        severity=a.severity,
        title=title,
        message=message,
        action_recommended=action,
        predicted_date=a.predicted_date,
        linked_recommendation_id=a.linked_recommendation_id,
        status=status_val,
        acknowledged_by=a.acknowledged_by,
        acknowledged_at=a.acknowledged_at,
        created_at=a.created_at,
    )

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by low, medium, high, critical"),
    status: Optional[str] = Query(None, description="Filter by active, acknowledged, or all"),
    state_id: Optional[str] = Query(None, description="Filter by state code, e.g. INMP, INBR"),
    district_id: Optional[str] = Query(None, description="Filter by district"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return active health resource alerts sorted by urgency with role-based jurisdiction filtering."""
    q = select(Alert, PHC).join(PHC, Alert.phc_id == PHC.id).order_by(desc(Alert.created_at))

    # RBAC jurisdiction enforcement
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

    if severity and severity != "all":
        q = q.where(func.lower(func.cast(Alert.severity, func.text)).like(f"%{severity.lower()}%"))

    if status and status != "all":
        if status == "acknowledged":
            q = q.where(Alert.acknowledged_by.isnot(None))
        elif status in ("active", "unacknowledged"):
            q = q.where(Alert.acknowledged_by.is_(None))

    res = await db.execute(q)
    rows = res.all()

    return [format_alert_response(a, phc) for a, phc in rows]

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
    return format_alert_response(a, phc)

@router.patch("/{id}/status", response_model=AlertResponse)
async def update_alert_status(
    id: int,
    status: str = Query("acknowledged", description="Status to transition to: acknowledged or active"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update alert acknowledgment status (supports both /status and /acknowledge)."""
    a = await db.get(Alert, id)
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{id}' not found")

    if status.lower() in ("acknowledged", "ack"):
        a.acknowledged_by = current_user.username
        a.acknowledged_at = datetime.utcnow()
    else:
        a.acknowledged_by = None
        a.acknowledged_at = None

    await db.commit()
    await db.refresh(a)

    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="UPDATE_ALERT_STATUS",
        target_id=str(id),
        metadata={"phc_id": a.phc_id, "status": status, "severity": a.severity.value},
    )

    phc = await db.get(PHC, a.phc_id)
    return format_alert_response(a, phc)

@router.patch("/{id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an alert as acknowledged by the current officer."""
    return await update_alert_status(id, status="acknowledged", db=db, current_user=current_user)
