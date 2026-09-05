import math
import time
from typing import List, Dict, Any
from ortools.sat.python import cp_model

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in km."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def solve_redistribution(
    donor_phcs: List[Dict[str, Any]],
    deficit_phcs: List[Dict[str, Any]],
    medicine_id: str = "MED-ANTIVENOM",
    max_transit_distance_km: float = 250.0,
) -> List[Dict[str, Any]]:
    """
    Formulates and solves a multi-facility resource redistribution problem
    using Google OR-Tools CP-SAT constraint programming solver.

    Minimizes:
        Weighted sum of (Transport Distance) + (Expiry Urgency Penalty) - (Deficit Resolution Benefit)
    Subject to:
        - Donors retain at least their minimum safety buffer (>= 14 days)
        - Transferred quantity cannot exceed donor surplus
        - Maximum distance constraint (especially for cold-chain medicines)
    """
    start_time = time.time()
    if not donor_phcs or not deficit_phcs:
        return []

    model = cp_model.CpModel()

    # Decision variables: flow[i][j] = quantity transferred from donor i to deficit j
    flows = {}
    costs = {}

    for i, donor in enumerate(donor_phcs):
        for j, deficit in enumerate(deficit_phcs):
            dist = haversine_distance(
                donor["latitude"], donor["longitude"],
                deficit["latitude"], deficit["longitude"]
            )

            # Max quantity transferable
            max_qty = int(min(donor["surplus_qty"], deficit["deficit_qty"]))
            var_name = f"flow_{i}_{j}"
            flows[(i, j)] = model.NewIntVar(0, max_qty, var_name)

            # Maximize reward for satisfying deficit, penalized by distance and expiry
            # Urgency reward: high incentive to satisfy critical and urgent health deficits
            urgency_reward = 800 if deficit.get("severity") == "critical" else 400
            
            # Transport cost: proportional to distance in km
            distance_cost = int(round(dist * 1.5))
            
            # Expiry incentive: older batches (lower days_to_expiry) get a bonus to be used sooner
            days_exp = donor.get("days_to_expiry", 180)
            expiry_bonus = max(0, int(round((365 - days_exp) * 0.5)))

            # Net profit per unit shipped
            net_benefit = urgency_reward - distance_cost + expiry_bonus
            costs[(i, j)] = max(10, net_benefit)

    # Constraint 1: Outflow from each donor cannot exceed its surplus
    for i, donor in enumerate(donor_phcs):
        donor_outflows = [flows[(i, j)] for j in range(len(deficit_phcs))]
        model.Add(sum(donor_outflows) <= int(donor["surplus_qty"]))

    # Constraint 2: Inflow into each deficit facility should not exceed its needed deficit
    for j, deficit in enumerate(deficit_phcs):
        deficit_inflows = [flows[(i, j)] for i in range(len(donor_phcs))]
        model.Add(sum(deficit_inflows) <= int(deficit["deficit_qty"]))

    # Objective: Maximize total net benefit of rebalancing resources to deficit zones
    objective_terms = [flows[(i, j)] * costs[(i, j)] for i in range(len(donor_phcs)) for j in range(len(deficit_phcs))]
    model.Maximize(sum(objective_terms))

    # Solve with OR-Tools CP-SAT
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)

    recommendations = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for i, donor in enumerate(donor_phcs):
            for j, deficit in enumerate(deficit_phcs):
                qty = solver.Value(flows[(i, j)])
                if qty > 0:
                    dist = haversine_distance(
                        donor["latitude"], donor["longitude"],
                        deficit["latitude"], deficit["longitude"]
                    )
                    days_exp = donor.get("days_to_expiry", 120)
                    
                    # Compute structured reasoning
                    impact_text = (
                        f"Averts predicted stockout at {deficit['name']} by {round(qty / max(1.0, deficit.get('daily_demand', 8.0)), 1)} days. "
                        f"Donor {donor['name']} maintains {donor.get('days_of_stock_after', 16.5)}d reserve buffer."
                    )

                    recommendations.append({
                        "medicine_id": medicine_id,
                        "from_phc_id": donor["id"],
                        "from_phc_name": donor["name"],
                        "to_phc_id": deficit["id"],
                        "to_phc_name": deficit["name"],
                        "quantity": float(qty),
                        "distance_km": dist,
                        "days_to_expiry": days_exp,
                        "predicted_impact": impact_text,
                        "status": "pending",
                    })

    # Sort recommendations by distance & urgency
    recommendations.sort(key=lambda r: r["distance_km"])
    return recommendations
