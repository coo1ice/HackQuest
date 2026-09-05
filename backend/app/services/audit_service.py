from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLogEntry
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def log_action(
    db: AsyncSession,
    actor_id: str,
    action: str,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditLogEntry:
    """Durably logs an audit record to the database for any critical mutation."""
    entry = AuditLogEntry(
        actor_id=actor_id,
        action=action,
        target_id=str(target_id) if target_id is not None else None,
        timestamp=datetime.utcnow(),
        extra_metadata=metadata or {},
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    logger.info(f"AUDIT: [{actor_id}] performed '{action}' on target '{target_id}'")
    return entry
