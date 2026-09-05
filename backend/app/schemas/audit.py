from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional

class AuditLogResponse(BaseModel):
    id: int
    actor_id: str
    action: str
    target_id: Optional[str] = None
    timestamp: datetime
    extra_metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True
