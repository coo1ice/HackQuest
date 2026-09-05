from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class StockRecordCreate(BaseModel):
    medicine_id: str
    quantity: float
    unit: str
    expiry_date: date
    timestamp: Optional[datetime] = None

class StockRecordResponse(StockRecordCreate):
    id: int
    phc_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class SyncBatchRequest(BaseModel):
    stocks: List[StockRecordCreate] = []
    beds: List[dict] = []
    staff_attendances: List[dict] = []
    footfalls: List[dict] = []

class SyncBatchResponse(BaseModel):
    status: str
    processed_counts: dict
    synced_at: datetime
