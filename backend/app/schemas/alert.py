from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.models.enums import SeverityEnum

class AlertResponse(BaseModel):
    id: int
    phc_id: str
    phc_name: Optional[str] = None
    district_id: Optional[str] = None
    state_id: Optional[str] = None
    resource_type: str
    severity: SeverityEnum
    predicted_date: date
    linked_recommendation_id: Optional[int] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    pass
