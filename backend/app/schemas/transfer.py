from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.enums import TransferStatusEnum
from app.schemas.redistribution import RedistributionRecommendationResponse

class StatusHistoryItem(BaseModel):
    status: TransferStatusEnum
    changed_at: str
    changed_by: str
    notes: Optional[str] = None

class TransferStatusUpdateRequest(BaseModel):
    status: TransferStatusEnum
    notes: Optional[str] = None

class TransferResponse(BaseModel):
    id: int
    recommendation_id: int
    status: TransferStatusEnum
    status_history: List[Dict[str, Any]]
    recommendation: Optional[RedistributionRecommendationResponse] = None

    class Config:
        from_attributes = True

class OutcomeLogRequest(BaseModel):
    transfer_id: int
    stockout_prevented: bool
    notes: Optional[str] = None

class OutcomeSummaryResponse(BaseModel):
    total_transfers_completed: int
    stockouts_prevented_count: int
    accuracy_percentage: float
