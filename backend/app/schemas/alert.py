from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.models.enums import SeverityEnum

class AlertResponse(BaseModel):
    id: int
    phc_id: str
    phc_name: Optional[str] = None
    district_id: Optional[str] = None
    district_name: Optional[str] = None
    state_id: Optional[str] = None
    resource_type: str
    alert_type: Optional[str] = None
    severity: SeverityEnum
    title: Optional[str] = None
    message: Optional[str] = None
    action_recommended: Optional[str] = None
    predicted_date: date
    linked_recommendation_id: Optional[int] = None
    status: str = "active"
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    pass
