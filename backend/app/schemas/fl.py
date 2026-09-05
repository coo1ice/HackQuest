from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class FLTriggerRequest(BaseModel):
    num_rounds: int = 3
    participating_states: Optional[list[str]] = None

class FLRoundStatusResponse(BaseModel):
    round_id: str
    status: str
    num_rounds_completed: int
    participating_clients: int
    convergence_metric: float
    accuracy_before: float
    accuracy_after: float
    loss_history: list[float] = []
    completed_at: Optional[datetime] = None

class FLModelVersionResponse(BaseModel):
    model_type: str
    version: str
    trained_at: datetime
    metrics: Dict[str, Any] = {}
