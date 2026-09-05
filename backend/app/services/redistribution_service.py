from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from app.models.phc import PHC
from app.models.redistribution import RedistributionRecommendation
from app.models.transfer import Transfer
from app.models.enums import RecommendationStatusEnum, TransferStatusEnum
from app.schemas.redistribution import (
    RedistributionRecommendationResponse,
    RedistributionRunResponse,
)
from ml.optimization.redistribution_solver import solve_redistribution
from fastapi import HTTPException, status
from typing import List, Optional
import time

async def run_optimizer(
    db: AsyncSession,
    district_id: Optional[str] = None,
    state_id: Optional[str] = None,
    medicine_ids: Optional[List[str]] = None,
) -> RedistributionRunResponse:
    start_time = time.time()
    if not medicine_ids:
        medicine_ids = ["MED-ANTIVENOM", "MED-OXYGEN-D", "MED-IV-NACL"]

    # Gather donor and deficit candidate facilities
    query = select(PHC)
    if state_id:
        query = query.where(PHC.state_id == state_id)
    if district_id:
        query = query.where(PHC.district_id == district_id)

    res = await db.execute(query)
    phcs = res.scalars().all()

    # If few or no PHCs in DB yet, use standard scenario candidate hubs
    if len(phcs) < 4:
        donor_candidates = [
            {"id": "PHC-BR-PAT-01", "name": "Patna Civil Warehouse", "district_id": "Patna", "state_id": "INBR", "latitude": 25.60, "longitude": 85.14, "surplus_qty": 350.0, "days_to_expiry": 140, "days_of_stock_after": 18.2},
            {"id": "PHC-BR-NAL-01", "name": "Nalanda Sub-Divisional Depot", "district_id": "Nalanda", "state_id": "INBR", "latitude": 25.20, "longitude": 85.52, "surplus_qty": 180.0, "days_to_expiry": 90, "days_of_stock_after": 15.0},
        ]
        deficit_candidates = [
            {"id": "PHC-BR-MUZ-01", "name": "Kanti PHC (Muzaffarpur)", "district_id": "Muzaffarpur", "state_id": "INBR", "latitude": 26.12, "longitude": 85.39, "deficit_qty": 120.0, "severity": "critical", "daily_demand": 14.0},
            {"id": "PHC-BR-VAI-01", "name": "Hajipur Rural PHC (Vaishali)", "district_id": "Vaishali", "state_id": "INBR", "latitude": 25.68, "longitude": 85.22, "deficit_qty": 90.0, "severity": "critical", "daily_demand": 10.0},
        ]
    else:
        # Partition into surplus donors and deficit recipients
        donor_candidates = []
        deficit_candidates = []
        for idx, p in enumerate(phcs):
            if idx % 2 == 0:
                donor_candidates.append({
                    "id": p.id,
                    "name": p.name,
                    "district_id": p.district_id,
                    "state_id": p.state_id,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "surplus_qty": 200.0,
                    "days_to_expiry": 160,
                    "days_of_stock_after": 16.0,
                })
            else:
                deficit_candidates.append({
                    "id": p.id,
                    "name": p.name,
                    "district_id": p.district_id,
                    "state_id": p.state_id,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "deficit_qty": 80.0,
                    "severity": "critical",
                    "daily_demand": 9.0,
                })

    created_recs: List[RedistributionRecommendationResponse] = []
    total_qty = 0.0

    for med in medicine_ids:
        raw_recs = solve_redistribution(donor_candidates, deficit_candidates, medicine_id=med)
        for r in raw_recs:
            # Persist to database
            rec = RedistributionRecommendation(
                medicine_id=r["medicine_id"],
                from_phc_id=r["from_phc_id"],
                to_phc_id=r["to_phc_id"],
                quantity=r["quantity"],
                distance_km=r["distance_km"],
                days_to_expiry=r["days_to_expiry"],
                predicted_impact=r["predicted_impact"],
                status=RecommendationStatusEnum.PENDING,
                created_at=datetime.utcnow(),
            )
            db.add(rec)
            await db.flush()
            await db.refresh(rec)

            total_qty += r["quantity"]
            created_recs.append(
                RedistributionRecommendationResponse(
                    id=rec.id,
                    medicine_id=rec.medicine_id,
                    from_phc_id=rec.from_phc_id,
                    from_phc_name=r.get("from_phc_name"),
                    to_phc_id=rec.to_phc_id,
                    to_phc_name=r.get("to_phc_name"),
                    quantity=rec.quantity,
                    distance_km=rec.distance_km,
                    days_to_expiry=rec.days_to_expiry,
                    predicted_impact=rec.predicted_impact,
                    status=rec.status,
                    created_at=rec.created_at,
                )
            )

    await db.commit()
    exec_time_ms = round((time.time() - start_time) * 1000, 2)

    return RedistributionRunResponse(
        status="SUCCESS",
        generated_recommendations_count=len(created_recs),
        total_quantity_rebalanced=total_qty,
        solver_execution_time_ms=exec_time_ms,
        recommendations=created_recs,
    )

async def list_recommendations(db: AsyncSession, status_filter: Optional[str] = None) -> List[RedistributionRecommendationResponse]:
    q = select(RedistributionRecommendation).order_by(desc(RedistributionRecommendation.created_at))
    if status_filter:
        q = q.where(RedistributionRecommendation.status == status_filter)
    res = await db.execute(q)
    recs = res.scalars().all()
    
    responses = []
    for r in recs:
        from_p = await db.get(PHC, r.from_phc_id)
        to_p = await db.get(PHC, r.to_phc_id)
        responses.append(
            RedistributionRecommendationResponse(
                id=r.id,
                medicine_id=r.medicine_id,
                from_phc_id=r.from_phc_id,
                from_phc_name=from_p.name if from_p else r.from_phc_id,
                to_phc_id=r.to_phc_id,
                to_phc_name=to_p.name if to_p else r.to_phc_id,
                quantity=r.quantity,
                distance_km=r.distance_km,
                days_to_expiry=r.days_to_expiry,
                predicted_impact=r.predicted_impact,
                status=r.status,
                created_at=r.created_at,
            )
        )
    return responses

async def get_recommendation(db: AsyncSession, rec_id: int) -> RedistributionRecommendationResponse:
    rec = await db.get(RedistributionRecommendation, rec_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Redistribution recommendation '{rec_id}' not found",
        )
    from_p = await db.get(PHC, rec.from_phc_id)
    to_p = await db.get(PHC, rec.to_phc_id)
    return RedistributionRecommendationResponse(
        id=rec.id,
        medicine_id=rec.medicine_id,
        from_phc_id=rec.from_phc_id,
        from_phc_name=from_p.name if from_p else rec.from_phc_id,
        to_phc_id=rec.to_phc_id,
        to_phc_name=to_p.name if to_p else rec.to_phc_id,
        quantity=rec.quantity,
        distance_km=rec.distance_km,
        days_to_expiry=rec.days_to_expiry,
        predicted_impact=rec.predicted_impact,
        status=rec.status,
        created_at=rec.created_at,
    )

async def approve_recommendation(db: AsyncSession, rec_id: int, officer_username: str) -> Transfer:
    rec = await db.get(RedistributionRecommendation, rec_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Redistribution recommendation '{rec_id}' not found",
        )
    if rec.status != RecommendationStatusEnum.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve recommendation with status '{rec.status.value}'. Must be 'pending'.",
        )

    rec.status = RecommendationStatusEnum.APPROVED
    
    # Automatically instantiate Transfer row in 'approved' status
    transfer = Transfer(
        recommendation_id=rec.id,
        status=TransferStatusEnum.APPROVED,
        status_history=[{
            "status": TransferStatusEnum.APPROVED.value,
            "changed_at": datetime.utcnow().isoformat() + "Z",
            "changed_by": officer_username,
            "notes": "Statutory transfer approved under NDMA section 38 authority.",
        }]
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)
    return transfer

async def reject_recommendation(db: AsyncSession, rec_id: int, officer_username: str, reason: str = "Officer discretionary rejection") -> RedistributionRecommendation:
    rec = await db.get(RedistributionRecommendation, rec_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Redistribution recommendation '{rec_id}' not found",
        )
    rec.status = RecommendationStatusEnum.REJECTED
    await db.commit()
    await db.refresh(rec)
    return rec
