import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Dict, List, Tuple
import os

# Configuration of states, districts, and PHCs aligned with dashboard
STATE_CONFIG = {
    "INBR": {
        "name": "Bihar",
        "bias": "infectious_respiratory",  # Outbreaks of encephalitis/respiratory/snakebite
        "districts": ["Muzaffarpur", "Vaishali", "Patna", "Nalanda"],
        "medicines": ["MED-ANTIVENOM", "MED-IV-NACL", "MED-OXYGEN-D", "MED-CEFTRIAXONE", "MED-PARACETAMOL"],
        "base_footfall": 120,
    },
    "INAS": {
        "name": "Assam",
        "bias": "flood_waterborne",  # Water purification, antimalarials, oral rehydration
        "districts": ["Kamrup", "Dhubri", "Barpeta", "Nagaon"],
        "medicines": ["MED-CHLOROQUINE", "MED-ORS", "MED-AMOXICILLIN", "MED-IV-NACL", "MED-PARACETAMOL"],
        "base_footfall": 95,
    },
    "INOR": {
        "name": "Odisha",
        "bias": "coastal_cyclone",  # Emergency trauma kits, tetanus, waterborne
        "districts": ["Puri", "Balasore", "Ganjam", "Cuttack"],
        "medicines": ["MED-TETANUS", "MED-BETADINE", "MED-ANTIVENOM", "MED-OXYGEN-D", "MED-PARACETAMOL"],
        "base_footfall": 105,
    },
    "INMH": {
        "name": "Maharashtra",
        "bias": "industrial_trauma",  # High surplus buffer, trauma, cardiac
        "districts": ["Pune", "Nagpur", "Thane", "Nashik"],
        "medicines": ["MED-ANTIVENOM", "MED-IV-NACL", "MED-OXYGEN-D", "MED-ATROPINE", "MED-PARACETAMOL"],
        "base_footfall": 140,
    },
}

PHCS_PER_DISTRICT = 3

def generate_phc_hierarchy() -> List[Dict]:
    """Generates the static geographic hierarchy for the simulated states."""
    phcs = []
    # Seeded coordinates
    coords = {
        "INBR": (25.5941, 85.1376),
        "INAS": (26.1445, 91.7362),
        "INOR": (20.2961, 85.8245),
        "INMH": (19.7515, 75.7139),
    }

    for state_id, s_conf in STATE_CONFIG.items():
        base_lat, base_lon = coords[state_id]
        for d_idx, dist in enumerate(s_conf["districts"]):
            for p_idx in range(1, PHCS_PER_DISTRICT + 1):
                phc_id = f"PHC-{state_id[2:]}-{dist[:3].upper()}-{p_idx:02d}"
                # Add slight jitter for realistic spatial clustering
                lat = base_lat + (d_idx * 0.18) + (p_idx * 0.03) + np.random.uniform(-0.02, 0.02)
                lon = base_lon + (d_idx * 0.22) + (p_idx * 0.04) + np.random.uniform(-0.02, 0.02)
                phcs.append({
                    "id": phc_id,
                    "name": f"{dist} Community PHC #{p_idx}",
                    "district_id": dist,
                    "state_id": state_id,
                    "latitude": round(lat, 4),
                    "longitude": round(lon, 4),
                })
    return phcs

def generate_telemetry_timeseries(
    phcs: List[Dict],
    days: int = 90,
    end_date: date = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Generates synthetic time series for stock, beds, attendance, and footfall.
    Includes normal consumption drift, weekend seasonality, and realistic outbreak spikes.
    """
    if end_date is None:
        end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    dates = pd.date_range(start=start_date, end=end_date, freq="D")

    stocks_data = []
    beds_data = []
    staff_data = []
    footfall_data = []

    np.random.seed(42)

    for phc in phcs:
        state_id = phc["state_id"]
        phc_id = phc["id"]
        state_info = STATE_CONFIG[state_id]
        medicines = state_info["medicines"]
        base_ff = state_info["base_footfall"]

        # Track rolling stock levels per medicine
        current_stocks = {med: float(np.random.randint(150, 400)) for med in medicines}

        # If it's Muzaffarpur or Vaishali (Bihar deficit hubs), start with lower buffer
        if phc["district_id"] in ["Muzaffarpur", "Vaishali"]:
            current_stocks["MED-ANTIVENOM"] = float(np.random.randint(25, 45))
            current_stocks["MED-OXYGEN-D"] = float(np.random.randint(10, 20))

        # Total bed capacity
        total_beds = int(np.random.choice([10, 15, 20]))

        # Outbreak window: Day 60 to 75 in Bihar
        is_bihar = state_id == "INBR"

        for idx, dt in enumerate(dates):
            dow = dt.dayofweek
            is_weekend = dow >= 5

            # Footfall calculation with seasonality and outbreak surge
            surge_multiplier = 1.0
            if is_bihar and 55 <= idx <= 75:
                surge_multiplier = 2.4  # Peak surge
            elif not is_bihar and 30 <= idx <= 42 and state_id == "INAS":
                surge_multiplier = 1.8  # Flood surge

            ff_count = int(np.random.normal(base_ff, 15) * (0.75 if is_weekend else 1.0) * surge_multiplier)
            ff_count = max(20, ff_count)

            footfall_data.append({
                "phc_id": phc_id,
                "patient_count": ff_count,
                "department": "OPD",
                "timestamp": dt.to_pydatetime(),
            })

            # Beds
            occupancy_rate = min(0.98, (0.45 + (surge_multiplier - 1.0) * 0.35) + np.random.uniform(-0.08, 0.08))
            occupied = int(round(total_beds * occupancy_rate))
            occupied = min(total_beds, max(1, occupied))

            beds_data.append({
                "phc_id": phc_id,
                "total_beds": total_beds,
                "occupied_beds": occupied,
                "timestamp": dt.to_pydatetime(),
            })

            # Staff attendance (doctors, nurses, pharmacists)
            roles = [("STF-01", "Medical Officer"), ("STF-02", "Staff Nurse"), ("STF-03", "Pharmacist")]
            for stf_id, role in roles:
                is_present = np.random.choice(["present", "absent"], p=[0.92, 0.08])
                staff_data.append({
                    "phc_id": phc_id,
                    "staff_id": f"{phc_id}-{stf_id}",
                    "role": role,
                    "status": is_present,
                    "timestamp": dt.to_pydatetime(),
                })

            # Stocks consumption & replenishment
            for med in medicines:
                # Daily consumption linked to footfall
                consumption_rate = (ff_count / 100.0) * np.random.uniform(4.0, 8.5)
                if "OXYGEN" in med:
                    consumption_rate = (occupied * 0.6) + np.random.uniform(0.5, 2.0)
                elif "ANTIVENOM" in med and is_bihar and 55 <= idx <= 75:
                    consumption_rate *= 3.2

                current_stocks[med] = max(0.0, current_stocks[med] - consumption_rate)

                # Periodic replenishment if stock gets low (except for Bihar deficit demonstration)
                if current_stocks[med] < 20.0 and not (is_bihar and phc["district_id"] in ["Muzaffarpur", "Vaishali"] and idx > 50):
                    current_stocks[med] += float(np.random.randint(120, 250))

                exp_date = (dt + timedelta(days=np.random.randint(60, 365))).date()
                stocks_data.append({
                    "phc_id": phc_id,
                    "medicine_id": med,
                    "quantity": round(current_stocks[med], 1),
                    "unit": "cylinders" if "OXYGEN" in med else "vials",
                    "expiry_date": exp_date,
                    "timestamp": dt.to_pydatetime(),
                })

    df_phcs = pd.DataFrame(phcs)
    df_stocks = pd.DataFrame(stocks_data)
    df_beds = pd.DataFrame(beds_data)
    df_staff = pd.DataFrame(staff_data)
    df_footfall = pd.DataFrame(footfall_data)

    return df_phcs, df_stocks, df_beds, df_staff, df_footfall
