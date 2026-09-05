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
    staff_present: int = 0
    critical_medicines_count: int = 0
    health_score: float = 100.0

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
    phcs: List[PHCDetailResponse] = []

class StateOverviewResponse(BaseModel):
    state_id: str
    state_name: str
    health_score: float
    total_phcs: int
    reporting_phcs: int
    districts_at_risk: int
    total_districts: int
    triage_status: str

class NationalOverviewResponse(BaseModel):
    timestamp: str
    total_phcs: int
    reporting_phcs: int
    national_health_score: float
    critical_states_count: int
    adequate_states_count: int
    states: List[StateOverviewResponse]
