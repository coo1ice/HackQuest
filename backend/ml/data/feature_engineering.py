import pandas as pd
import numpy as np
from typing import Tuple, List

def compute_daily_consumption(df_stocks: pd.DataFrame) -> pd.DataFrame:
    """Derives daily consumed quantity from stock series (delta between consecutive days)."""
    df = df_stocks.sort_values(["phc_id", "medicine_id", "timestamp"]).copy()
    # Compute stock change
    df["prev_quantity"] = df.groupby(["phc_id", "medicine_id"])["quantity"].shift(1)
    # When stock drops, consumption is prev - current. If replenishment happened, clamp to rolling estimate
    df["daily_consumption"] = (df["prev_quantity"] - df["quantity"]).clip(lower=0.0)
    df["daily_consumption"] = df["daily_consumption"].fillna(df["daily_consumption"].median())
    return df

def build_forecasting_features(
    df_stocks: pd.DataFrame,
    df_footfall: pd.DataFrame,
    df_phcs: pd.DataFrame = None,
) -> pd.DataFrame:
    """
    Computes time-series lags, rolling statistics, calendar attributes,
    and z-score outbreak flags for every (phc_id, medicine_id, timestamp).
    """
    df = compute_daily_consumption(df_stocks)
    
    # Merge daily footfall
    ff_daily = df_footfall[["phc_id", "timestamp", "patient_count"]].copy()
    df = pd.merge(df, ff_daily, on=["phc_id", "timestamp"], how="left")
    df["patient_count"] = df["patient_count"].fillna(df["patient_count"].median())

    # Sort strictly by time
    df = df.sort_values(["phc_id", "medicine_id", "timestamp"]).reset_index(drop=True)

    # 1. Lag Features: t-1, t-7, t-14
    for lag in [1, 7, 14]:
        df[f"lag_demand_{lag}d"] = df.groupby(["phc_id", "medicine_id"])["daily_consumption"].shift(lag)

    # 2. Rolling Statistics over 7 and 14 days
    grouped = df.groupby(["phc_id", "medicine_id"])["daily_consumption"]
    df["rolling_mean_7d"] = grouped.transform(lambda x: x.shift(1).rolling(7, min_periods=1).mean())
    df["rolling_std_7d"] = grouped.transform(lambda x: x.shift(1).rolling(7, min_periods=1).std()).fillna(0.0)
    df["rolling_mean_14d"] = grouped.transform(lambda x: x.shift(1).rolling(14, min_periods=1).mean())
    df["rolling_std_14d"] = grouped.transform(lambda x: x.shift(1).rolling(14, min_periods=1).std()).fillna(0.0)

    # 3. Calendar attributes
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # 4. Outbreak flag: footfall z-score exceeding baseline by 1.8 threshold
    ff_mean = df.groupby("phc_id")["patient_count"].transform(lambda x: x.shift(1).rolling(14, min_periods=3).mean())
    ff_std = df.groupby("phc_id")["patient_count"].transform(lambda x: x.shift(1).rolling(14, min_periods=3).std()).replace(0, 1.0)
    df["footfall_zscore"] = (df["patient_count"] - ff_mean) / ff_std
    df["outbreak_flag"] = (df["footfall_zscore"] > 1.8).astype(int)

    # 5. Target Variables:
    # Future 7-day cumulative demand
    target_grouped = df.groupby(["phc_id", "medicine_id"])["daily_consumption"]
    # Forward rolling sum of next 7 days
    df["target_demand_7d"] = target_grouped.transform(
        lambda x: x.iloc[::-1].rolling(7, min_periods=1).sum().iloc[::-1].shift(-1)
    )
    # Stockout risk binary target: 1 if current stock < target_demand_7d, else 0
    df["target_stockout"] = (df["quantity"] < df["target_demand_7d"]).astype(int)

    # Drop early rows with NaN lags
    feature_df = df.dropna(subset=["lag_demand_14d", "target_demand_7d"]).reset_index(drop=True)
    return feature_df

def temporal_train_val_split(
    df: pd.DataFrame,
    val_days: int = 14,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    CRITICAL: Splits strictly by date (earlier dates for training, latest dates for validation).
    NEVER shuffles rows to prevent future information leakage into time-series models.
    """
    max_date = df["timestamp"].max()
    split_date = max_date - pd.Timedelta(days=val_days)

    train_df = df[df["timestamp"] < split_date].copy()
    val_df = df[df["timestamp"] >= split_date].copy()

    # Assert zero future leakage
    assert train_df["timestamp"].max() < val_df["timestamp"].min(), (
        "Fatal: temporal split violated! Max train date is not strictly earlier than min validation date."
    )

    return train_df, val_df
