from pydantic import BaseModel
from typing import Optional, List

class PHCBase(BaseModel):
    id: str
    name: str
    district_id: str
    state_id: str
    latitude: float
    longitude: float

class PHCCreate(PHCBase):
    pass

class PHCResponse(PHCBase):
    class Config:
        from_attributes = True

class PHCDetailResponse(PHCBase):
    total_beds: int = 0
    occupied_beds: int = 0
    bed_occupancy_percent: float = 0.0
    bed_occupancy_pct: float = 0.0
    staff_present: int = 0
    critical_medicines_count: int = 0
    health_score: float = 100.0
    stock_health_score: float = 85.0

    class Config:
        from_attributes = True

class DistrictSummaryResponse(BaseModel):
    district_id: str
    state_id: str
    total_phcs: int
    reporting_phcs: int
    avg_icu_load: float
    critical_stockout_count: int
    health_score: float
    last_synced_at: Optional[str] = None
    phcs: List[PHCDetailResponse] = []

class StateOverviewResponse(BaseModel):
    state_id: str
    state_name: str
    health_score: float = 75.0
    stock_health_score: float = 75.0
    bed_occupancy_pct: float = 65.0
    staff_health_score: float = 85.0
    composite_score: float = 75.0
    total_phcs: int = 0
    reporting_phcs: int = 0
    districts_at_risk: int = 0
    critical_phcs_count: int = 0
    total_districts: int = 0
    triage_status: str = "normal"
    status: str = "normal"

class NationalOverviewResponse(BaseModel):
    timestamp: str
    last_synced_at: Optional[str] = None
    total_phcs: int = 0
    reporting_phcs: int = 0
    reporting_rate_pct: float = 98.4
    national_health_score: float = 75.0
    critical_states_count: int = 0
    critical_deficit_states_count: int = 0
    adequate_states_count: int = 0
    national_bed_occupancy_pct: float = 72.5
    in_transit_transfers_count: int = 6
    states: List[StateOverviewResponse] = []
