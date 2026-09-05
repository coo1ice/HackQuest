from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BedRecordCreate(BaseModel):
    total_beds: int
    occupied_beds: int
    timestamp: Optional[datetime] = None

class BedRecordResponse(BedRecordCreate):
    id: int
    phc_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
