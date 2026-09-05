import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

_MODEL_CACHE: Dict[str, Any] = {}

def get_loaded_models(state_id: str, model_dir: str = "ml/model_registry") -> tuple:
    reg_key = f"reg_{state_id}"
    clf_key = f"clf_{state_id}"

    if reg_key not in _MODEL_CACHE or clf_key not in _MODEL_CACHE:
        reg_path = os.path.join(model_dir, f"xgboost_demand_{state_id}.joblib")
        clf_path = os.path.join(model_dir, f"xgboost_stockout_{state_id}.joblib")

        # Fallback to general model if state-specific isn't present
        if not os.path.exists(reg_path):
            reg_path = os.path.join(model_dir, "xgboost_demand_INBR.joblib")
            clf_path = os.path.join(model_dir, "xgboost_stockout_INBR.joblib")

        if os.path.exists(reg_path) and os.path.exists(clf_path):
            _MODEL_CACHE[reg_key] = joblib.load(reg_path)
            _MODEL_CACHE[clf_key] = joblib.load(clf_path)
        else:
            return None, None

    return _MODEL_CACHE.get(reg_key), _MODEL_CACHE.get(clf_key)

def predict_demand_and_risk(
    state_id: str,
    feature_row: Dict[str, Any],
    model_dir: str = "ml/model_registry",
) -> Dict[str, Any]:
    """
    Executes real-time inference using pre-loaded XGBoost artifacts.
    Does not retrain on request.
    """
    reg_model, clf_model = get_loaded_models(state_id, model_dir)
    df_row = pd.DataFrame([feature_row])

    if reg_model is not None and clf_model is not None:
        pred_demand = float(reg_model.predict(df_row)[0])
        pred_demand = max(5.0, pred_demand)
        stockout_prob = float(clf_model.predict_proba(df_row)[0, 1])
    else:
        # Graceful heuristic fallback if model artifacts are not yet saved
        lag7 = feature_row.get("lag_demand_7d", 45.0)
        outbreak = feature_row.get("outbreak_flag", 0)
        mult = 2.4 if outbreak else 1.0
        pred_demand = lag7 * mult
        current_stock = feature_row.get("current_stock", 50.0)
        stockout_prob = 0.95 if current_stock < pred_demand else 0.15

    # Determine severity
    if stockout_prob > 0.75:
        severity = "critical"
    elif stockout_prob > 0.45:
        severity = "high"
    elif stockout_prob > 0.25:
        severity = "medium"
    else:
        severity = "low"

    return {
        "predicted_demand_7d": round(pred_demand, 1),
        "stockout_risk": round(stockout_prob, 3),
        "severity": severity,
    }
