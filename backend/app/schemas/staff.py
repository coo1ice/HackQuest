from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.enums import StaffStatusEnum

class StaffAttendanceCreate(BaseModel):
    staff_id: str
    role: str
    status: StaffStatusEnum
    timestamp: Optional[datetime] = None

class StaffAttendanceResponse(StaffAttendanceCreate):
    id: int
    phc_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
