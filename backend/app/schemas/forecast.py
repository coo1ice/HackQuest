from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from app.models.enums import SeverityEnum

class ForecastResponse(BaseModel):
    phc_id: str
    medicine_id: str
    predicted_demand_7d: float
    stockout_risk: float
    predicted_stockout_date: Optional[date] = None
    severity: SeverityEnum
    current_stock: float
    days_of_stock_left: float
    model_version: str
    forecasted_at: datetime

    class Config:
        from_attributes = True

class DistrictForecastSummaryItem(BaseModel):
    phc_id: str
    phc_name: str
    medicine_id: str
    predicted_demand_7d: float
    stockout_risk: float
    severity: SeverityEnum
    current_stock: float
    days_of_stock_left: float

class DistrictForecastResponse(BaseModel):
    district_id: str
    generated_at: datetime
    high_risk_phcs_count: int
    total_forecasts: int
    items: List[DistrictForecastSummaryItem]
