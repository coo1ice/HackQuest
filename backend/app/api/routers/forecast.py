from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.forecast import ForecastResponse, DistrictForecastResponse
from app.schemas.fl import FLTriggerRequest, FLRoundStatusResponse, FLModelVersionResponse
from app.services import forecast_service, audit_service
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRoleEnum
from ml.federated.fl_server import run_federated_rounds, FL_ROUNDS_REGISTRY, get_or_create_global_model
from ml.federated.fl_client import PHCFederatedClient
import numpy as np
from datetime import datetime

router = APIRouter(tags=["Predict & Federated Learning"])

@router.get("/forecast/district/{district_id}", response_model=DistrictForecastResponse)
async def get_district_forecast(
    district_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregated forecast and critical risk overview across all PHCs in a district."""
    return await forecast_service.get_district_forecast(db, district_id)

@router.get("/forecast/{phc_id}/{medicine_id}", response_model=ForecastResponse)
async def get_forecast(
    phc_id: str,
    medicine_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return 7-day predicted demand and stockout risk for a specific PHC and medicine."""
    return await forecast_service.get_phc_forecast(db, phc_id, medicine_id)

@router.post(
    "/fl/rounds/trigger",
    response_model=FLRoundStatusResponse,
    dependencies=[Depends(require_role(UserRoleEnum.NATIONAL_ADMIN, UserRoleEnum.STATE_OFFICER))],
)
async def trigger_federated_round(
    req: FLTriggerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: trigger an in-process federated training round across state client silos."""
    # Build simulated state clients with state-specific data distributions
    clients = []
    state_keys = req.participating_states or ["INBR", "INMH", "INAS", "INOR"]

    for sid in state_keys:
        # Generate partitioned feature matrices for each state silo
        np.random.seed(hash(sid) % 1000)
        X_train = np.random.randn(80, 5).astype(np.float32)
        # Binary target with state-specific bias
        bias = 0.6 if sid == "INBR" else 0.2
        y_train = (np.random.rand(80) < bias).astype(np.float32)
        X_val = np.random.randn(20, 5).astype(np.float32)
        y_val = (np.random.rand(20) < bias).astype(np.float32)

        client = PHCFederatedClient(
            client_id=f"client-{sid}",
            X_train=X_train,
            y_train=y_train,
            X_val=X_val,
            y_val=y_val,
        )
        clients.append(client)

    round_id = f"fl-round-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    result = run_federated_rounds(clients, num_rounds=req.num_rounds, round_id=round_id)

    await audit_service.log_action(
        db,
        actor_id=current_user.username,
        action="TRIGGER_FL_ROUND",
        target_id=round_id,
        metadata={
            "rounds": req.num_rounds,
            "convergence_metric": result["convergence_metric"],
            "accuracy_after": result["accuracy_after"],
        },
    )
    return result

@router.get("/fl/rounds/{round_id}/status", response_model=FLRoundStatusResponse)
async def get_fl_round_status(
    round_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return status, loss history, and convergence metric for a federated training round."""
    if round_id not in FL_ROUNDS_REGISTRY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FL round '{round_id}' not found.",
        )
    return FL_ROUNDS_REGISTRY[round_id]

@router.get("/fl/model/version", response_model=FLModelVersionResponse)
async def get_fl_model_version(
    current_user: User = Depends(get_current_user),
):
    """Return current global federated model version, parameters, and metadata."""
    model = get_or_create_global_model()
    weights = model.get_weights()
    param_count = sum(w.size for w in weights)

    return FLModelVersionResponse(
        model_type="federated_base_fedavg",
        version="fl-global-v2.1.0",
        trained_at=datetime.utcnow(),
        metrics={
            "parameter_count": param_count,
            "aggregation_strategy": "FedAvg",
            "global_bias": model.bias,
            "weight_norm": float(np.linalg.norm(model.weights)),
        },
    )
