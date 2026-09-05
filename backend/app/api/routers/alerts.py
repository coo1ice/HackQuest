from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from app.database import get_db
from app.models.alert import Alert
from app.models.phc import PHC
from app.schemas.alert import AlertResponse
from app.services import audit_service
from app.api.deps import get_current_user
from app.models.user import User
from typing import List, Optional

router = APIRouter(prefix="/alerts", tags=["Act & Alerts"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by low, medium, high, critical"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return active health resource alerts sorted by urgency and severity."""
    q = select(Alert).order_by(desc(Alert.created_at))
    if severity:
        q = q.where(Alert.severity == severity)
    res = await db.execute(q)
    alerts = res.scalars().all()

    responses = []
    for a in alerts:
        phc = await db.get(PHC, a.phc_id)
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
