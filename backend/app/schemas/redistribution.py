from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.enums import RecommendationStatusEnum

class RedistributionRecommendationResponse(BaseModel):
    id: int
    medicine_id: str
    from_phc_id: str
    from_phc_name: Optional[str] = None
    to_phc_id: str
    to_phc_name: Optional[str] = None
    quantity: float
    distance_km: float
    days_to_expiry: int
    predicted_impact: str
    status: RecommendationStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True

class RedistributionRunRequest(BaseModel):
    district_id: Optional[str] = None
    state_id: Optional[str] = None
    medicine_ids: Optional[List[str]] = None

class RedistributionRunResponse(BaseModel):
    status: str
    generated_recommendations_count: int
    total_quantity_rebalanced: float
    solver_execution_time_ms: float
    recommendations: List[RedistributionRecommendationResponse]
