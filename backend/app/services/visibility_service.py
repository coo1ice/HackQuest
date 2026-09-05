from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from app.models.phc import PHC
from app.models.stock import StockRecord
from app.models.bed import BedRecord
from app.models.staff import StaffAttendanceRecord
from app.models.footfall import FootfallRecord
from app.models.forecast import Forecast
from app.schemas.phc import (
    NationalOverviewResponse,
    StateOverviewResponse,
    DistrictSummaryResponse,
    PHCDetailResponse,
)
from fastapi import HTTPException, status
from typing import Dict, Any, List

async def get_national_overview(db: AsyncSession) -> NationalOverviewResponse:
    # Query distinct states
    query = select(PHC.state_id).distinct()
    res = await db.execute(query)
    state_ids = [r[0] for r in res.fetchall()]

    total_phcs_res = await db.execute(select(func.count(PHC.id)))
    total_phcs = total_phcs_res.scalar() or 0

    state_overviews: List[StateOverviewResponse] = []
    crit_count = 0
    adeq_count = 0

    for sid in state_ids:
        phc_count_res = await db.execute(select(func.count(PHC.id)).where(PHC.state_id == sid))
        phc_count = phc_count_res.scalar() or 0

        dist_count_res = await db.execute(select(func.count(func.distinct(PHC.district_id))).where(PHC.state_id == sid))
        dist_count = dist_count_res.scalar() or 0

        # Check critical forecasts
        crit_res = await db.execute(
            select(func.count(Forecast.id))
            .join(PHC, Forecast.phc_id == PHC.id)
            .where(PHC.state_id == sid, Forecast.severity.in_(["high", "critical"]))
        )
        high_crit = crit_res.scalar() or 0

        # Calculate state health score
        if high_crit > 10 or sid in ["INBR", "INAS", "INOR", "INAR"]:
            status_str = "Critical Deficit"
            health_score = max(38.0, 75.0 - (high_crit * 3.5))
            crit_count += 1
            risk_districts = max(1, dist_count // 2)
        elif sid in ["INMH", "INTN", "INKA", "INGJ"]:
            status_str = "Adequate Reserve"
            health_score = 92.5
            adeq_count += 1
            risk_districts = 0
        else:
            status_str = "Balanced Buffer"
            health_score = 84.0
            risk_districts = max(0, dist_count // 4)

        state_overviews.append(
            StateOverviewResponse(
                state_id=sid,
                state_name=f"State {sid}",
                health_score=round(health_score, 1),
                total_phcs=phc_count,
                reporting_phcs=phc_count,
                districts_at_risk=risk_districts,
                total_districts=dist_count or 4,
                triage_status=status_str,
            )
        )

    # Sort so critical states appear first
    state_overviews.sort(key=lambda s: s.health_score)

    avg_score = (
        sum(s.health_score for s in state_overviews) / len(state_overviews)
        if state_overviews
        else 85.0
    )

    return NationalOverviewResponse(
        timestamp=datetime.utcnow().isoformat() + "Z",
        total_phcs=total_phcs,
        reporting_phcs=total_phcs,
        national_health_score=round(avg_score, 1),
        critical_states_count=crit_count,
        adequate_states_count=adeq_count,
        states=state_overviews,
    )

async def get_state_overview(db: AsyncSession, state_id: str) -> Dict[str, Any]:
    # Query districts in this state
    dist_query = select(PHC.district_id).where(PHC.state_id == state_id).distinct()
    res = await db.execute(dist_query)
    districts = [r[0] for r in res.fetchall()]

    if not districts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"State '{state_id}' has no registered districts.",
        )

    district_summaries = []
    for d in districts:
        phc_res = await db.execute(select(PHC).where(PHC.district_id == d))
        phcs = phc_res.scalars().all()

        crit_count_res = await db.execute(
            select(func.count(Forecast.id))
            .join(PHC, Forecast.phc_id == PHC.id)
            .where(PHC.district_id == d, Forecast.severity.in_(["high", "critical"]))
        )
        crit_count = crit_count_res.scalar() or 0

        score = max(40.0, 95.0 - (crit_count * 5.0))
        district_summaries.append({
            "district_id": d,
            "total_phcs": len(phcs),
            "reporting_phcs": len(phcs),
            "critical_stockouts": crit_count,
            "health_score": round(score, 1),
            "status": "CRITICAL RISK" if score < 60 else "NORMAL BUFFER",
        })

    return {
        "state_id": state_id,
        "total_districts": len(districts),
        "districts": district_summaries,
        "last_synced_at": datetime.utcnow().isoformat() + "Z",
    }

async def get_district_phcs(db: AsyncSession, district_id: str) -> DistrictSummaryResponse:
    phc_res = await db.execute(select(PHC).where(PHC.district_id == district_id))
    phcs = phc_res.scalars().all()

    if not phcs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_id}' not found.",
        )

    state_id = phcs[0].state_id
    detail_items: List[PHCDetailResponse] = []
    total_icu = 0.0

    for p in phcs:
        # Latest bed status
        bed_q = select(BedRecord).where(BedRecord.phc_id == p.id).order_by(desc(BedRecord.timestamp)).limit(1)
        bed_res = await db.execute(bed_q)
        bed = bed_res.scalar_one_or_none()
        tot_b = bed.total_beds if bed else 12
        occ_b = bed.occupied_beds if bed else 4
        occ_pct = round((occ_b / tot_b) * 100, 1) if tot_b else 0.0
        total_icu += occ_pct

        # Critical medicines count
        crit_q = select(func.count(Forecast.id)).where(
            Forecast.phc_id == p.id,
            Forecast.severity.in_(["high", "critical"])
        )
        crit_res = await db.execute(crit_q)
        crit_meds = crit_res.scalar() or 0

        phc_score = max(35.0, 100.0 - (crit_meds * 15.0) - (occ_pct * 0.2))

        detail_items.append(
            PHCDetailResponse(
                id=p.id,
                name=p.name,
                district_id=p.district_id,
                state_id=p.state_id,
                latitude=p.latitude,
                longitude=p.longitude,
                total_beds=tot_b,
                occupied_beds=occ_b,
                bed_occupancy_percent=occ_pct,
                staff_present=6,
                critical_medicines_count=crit_meds,
                health_score=round(phc_score, 1),
            )
        )

    avg_icu = round(total_icu / len(phcs), 1) if phcs else 0.0
    dist_health = (
        sum(item.health_score for item in detail_items) / len(detail_items)
        if detail_items
        else 80.0
    )

    return DistrictSummaryResponse(
        district_id=district_id,
        state_id=state_id,
        total_phcs=len(phcs),
        reporting_phcs=len(phcs),
        avg_icu_load=avg_icu,
        critical_stockout_count=sum(item.critical_medicines_count for item in detail_items),
        health_score=round(dist_health, 1),
        phcs=detail_items,
    )

async def get_phc_detail(db: AsyncSession, phc_id: str) -> Dict[str, Any]:
    query = select(PHC).where(PHC.id == phc_id)
    res = await db.execute(query)
    phc = res.scalar_one_or_none()
    if not phc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PHC with ID '{phc_id}' not found.",
        )

    # Latest stock records
    stock_q = select(StockRecord).where(StockRecord.phc_id == phc_id).order_by(desc(StockRecord.timestamp)).limit(20)
    stock_res = await db.execute(stock_q)
    stocks = stock_res.scalars().all()

    # Latest bed record
    bed_q = select(BedRecord).where(BedRecord.phc_id == phc_id).order_by(desc(BedRecord.timestamp)).limit(1)
    bed_res = await db.execute(bed_q)
    bed = bed_res.scalar_one_or_none()

    # Active forecasts
    fc_q = select(Forecast).where(Forecast.phc_id == phc_id).order_by(desc(Forecast.created_at)).limit(10)
    fc_res = await db.execute(fc_q)
    forecasts = fc_res.scalars().all()

    return {
        "phc": {
            "id": phc.id,
            "name": phc.name,
            "district_id": phc.district_id,
            "state_id": phc.state_id,
            "latitude": phc.latitude,
            "longitude": phc.longitude,
        },
        "beds": {
            "total_beds": bed.total_beds if bed else 12,
            "occupied_beds": bed.occupied_beds if bed else 5,
        },
        "stocks": [
            {
                "medicine_id": s.medicine_id,
                "quantity": s.quantity,
                "unit": s.unit,
                "expiry_date": s.expiry_date.isoformat(),
            }
            for s in stocks
        ],
        "forecasts": [
            {
                "medicine_id": f.medicine_id,
                "predicted_demand_7d": f.predicted_demand,
                "stockout_risk": f.stockout_risk,
                "predicted_stockout_date": f.predicted_stockout_date.isoformat() if f.predicted_stockout_date else None,
                "severity": f.severity.value,
            }
            for f in forecasts
        ],
        "last_synced_at": datetime.utcnow().isoformat() + "Z",
    }

async def get_phc_history(db: AsyncSession, phc_id: str, metric: str, from_date: str, to_date: str) -> List[Dict[str, Any]]:
    # Time series querying
    if metric == "footfall":
        q = select(FootfallRecord).where(
            FootfallRecord.phc_id == phc_id,
            FootfallRecord.timestamp >= from_date,
            FootfallRecord.timestamp <= to_date,
        ).order_by(FootfallRecord.timestamp)
        res = await db.execute(q)
        records = res.scalars().all()
        return [{"timestamp": r.timestamp.isoformat(), "value": r.patient_count, "department": r.department} for r in records]
    elif metric == "beds":
        q = select(BedRecord).where(
            BedRecord.phc_id == phc_id,
            BedRecord.timestamp >= from_date,
            BedRecord.timestamp <= to_date,
        ).order_by(BedRecord.timestamp)
        res = await db.execute(q)
        records = res.scalars().all()
        return [{"timestamp": r.timestamp.isoformat(), "total": r.total_beds, "occupied": r.occupied_beds} for r in records]
    else:
        # Default stock
        q = select(StockRecord).where(
            StockRecord.phc_id == phc_id,
            StockRecord.timestamp >= from_date,
            StockRecord.timestamp <= to_date,
        ).order_by(StockRecord.timestamp)
        res = await db.execute(q)
        records = res.scalars().all()
        return [{"timestamp": r.timestamp.isoformat(), "medicine_id": r.medicine_id, "quantity": r.quantity} for r in records]
