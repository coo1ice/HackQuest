from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.audit_log import AuditLogEntry
from app.schemas.audit import AuditLogResponse
from app.api.deps import require_role
from app.models.enums import UserRoleEnum
from app.models.user import User
from typing import List, Optional

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])

@router.get(
    "",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role(UserRoleEnum.STATE_OFFICER, UserRoleEnum.NATIONAL_ADMIN))],
)
async def query_audit_logs(
    actor_id: Optional[str] = Query(None, description="Filter by user/actor"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    target_id: Optional[str] = Query(None, description="Filter by resource target ID"),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.STATE_OFFICER, UserRoleEnum.NATIONAL_ADMIN)),
):
    """Query immutable audit log entries (restricted to State Officer & National Admin)."""
    q = select(AuditLogEntry).order_by(desc(AuditLogEntry.timestamp)).limit(limit)
    if actor_id:
        q = q.where(AuditLogEntry.actor_id == actor_id)
    if action:
        q = q.where(AuditLogEntry.action == action)
    if target_id:
        q = q.where(AuditLogEntry.target_id == target_id)

    res = await db.execute(q)
    entries = res.scalars().all()
    return entries
