from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FootfallCreate(BaseModel):
    patient_count: int
    department: str
    timestamp: Optional[datetime] = None

class FootfallResponse(FootfallCreate):
    id: int
    phc_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
