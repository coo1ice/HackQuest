"""
Seed multi-state redistribution recommendations and transfers.
Populates realistic directives and transfers across Indian states:
- Madhya Pradesh (INMP)
- Maharashtra (INMH)
- Uttar Pradesh (INUP)
- Gujarat (INGJ)
- Odisha (INOR)
- Assam (INAS)
- Rajasthan (INRJ)
- Tamil Nadu (INTN)
- West Bengal (INWB)
- Delhi (INDL)
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import async_session_maker
from app.models.phc import PHC
from app.models.redistribution import RedistributionRecommendation
from app.models.transfer import Transfer
from app.models.outcome import Outcome
from app.models.enums import RecommendationStatusEnum, TransferStatusEnum

async def seed_state_directives():
    async with async_session_maker() as db:
        print("Checking existing recommendations and transfers...")
        
        # Mapping of states to define directives for
        state_configs = [
            {
                "state_id": "INMP",
                "state_name": "Madhya Pradesh",
                "officer": "officer_inmp",
                "vehicle_prefix": "MP-04",
                "highway": "NH-46",
                "items": [
                    {
                        "med": "MED-ANTIVENOM",
                        "qty": 140.0,
                        "dist": 194.0,
                        "expiry": 120,
                        "impact": "Prevents 18 projected venomous shock casualties during monsoon surge in Indore trauma corridor.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 0, "to_idx": 2,
                    },
                    {
                        "med": "MED-OXYGEN-D",
                        "qty": 65.0,
                        "dist": 312.0,
                        "expiry": 210,
                        "impact": "Buffers critical D-type oxygen cylinder reserve in Bhopal ICU ward without compromising donor safety margins.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 4, "to_idx": 1,
                    },
                    {
                        "med": "MED-CEFTRIAXONE",
                        "qty": 220.0,
                        "dist": 445.0,
                        "expiry": 95,
                        "impact": "Restores broad-spectrum antibiotic stock above minimum critical reserve threshold in high-footfall facility.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 3, "to_idx": 5,
                    },
                    {
                        "med": "MED-IV-NACL",
                        "qty": 350.0,
                        "dist": 195.0,
                        "expiry": 180,
                        "impact": "Emergency intravenous electrolyte replenishment for acute gastroenteritis cluster containment.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.DISPATCHED,
                        "from_idx": 1, "to_idx": 3,
                    },
                    {
                        "med": "MED-PARACETAMOL",
                        "qty": 500.0,
                        "dist": 310.0,
                        "expiry": 240,
                        "impact": "Rebalances antipyretic reserves during viral febrile seasonal peak.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.RECEIVED,
                        "from_idx": 5, "to_idx": 0,
                    },
                    {
                        "med": "MED-ATROPINE",
                        "qty": 80.0,
                        "dist": 192.0,
                        "expiry": 140,
                        "impact": "Pre-positions anticholinergic antidotes for agricultural organophosphate poisoning mitigation.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.APPROVED,
                        "from_idx": 2, "to_idx": 4,
                    },
                ]
            },
            {
                "state_id": "INMH",
                "state_name": "Maharashtra",
                "officer": "officer_inmh",
                "vehicle_prefix": "MH-12",
                "highway": "Mumbai-Pune Expressway / NH-48",
                "items": [
                    {
                        "med": "MED-ANTIVENOM",
                        "qty": 180.0,
                        "dist": 150.0,
                        "expiry": 110,
                        "impact": "Reallocates polyvalent antivenom from surplus urban warehouse to Western Ghats periphery.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 0, "to_idx": 3,
                    },
                    {
                        "med": "MED-OXYGEN-D",
                        "qty": 90.0,
                        "dist": 220.0,
                        "expiry": 190,
                        "impact": "Augments Vidarbha regional respiratory intensive care stock buffer.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 1, "to_idx": 4,
                    },
                    {
                        "med": "MED-IV-NACL",
                        "qty": 400.0,
                        "dist": 145.0,
                        "expiry": 160,
                        "impact": "Emergency resuscitation fluids dispatched under State Disaster Relief protocol.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.DISPATCHED,
                        "from_idx": 2, "to_idx": 0,
                    },
                    {
                        "med": "MED-CEFTRIAXONE",
                        "qty": 250.0,
                        "dist": 180.0,
                        "expiry": 130,
                        "impact": "Averts antibiotic depletion in secondary emergency referral hub.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.RECEIVED,
                        "from_idx": 3, "to_idx": 1,
                    },
                ]
            },
            {
                "state_id": "INUP",
                "state_name": "Uttar Pradesh",
                "officer": "officer_inup",
                "vehicle_prefix": "UP-32",
                "highway": "Purvanchal Expressway",
                "items": [
                    {
                        "med": "MED-ANTIVENOM",
                        "qty": 160.0,
                        "dist": 290.0,
                        "expiry": 135,
                        "impact": "Mitigates high-incidence Terai snakebite surge in Eastern districts.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 0, "to_idx": 2,
                    },
                    {
                        "med": "MED-OXYGEN-D",
                        "qty": 75.0,
                        "dist": 310.0,
                        "expiry": 200,
                        "impact": "Balances neonatal oxygenation support across Varanasi-Lucknow corridor.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 1, "to_idx": 3,
                    },
                    {
                        "med": "MED-IV-NACL",
                        "qty": 450.0,
                        "dist": 280.0,
                        "expiry": 175,
                        "impact": "Direct relief transfer for flood-affected riverine catchment PHCs.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.DISPATCHED,
                        "from_idx": 2, "to_idx": 0,
                    },
                ]
            },
            {
                "state_id": "INGJ",
                "state_name": "Gujarat",
                "officer": "officer_ingj",
                "vehicle_prefix": "GJ-01",
                "highway": "NE-1 National Expressway",
                "items": [
                    {
                        "med": "MED-ANTIVENOM",
                        "qty": 130.0,
                        "dist": 260.0,
                        "expiry": 140,
                        "impact": "Surplus reallocation to Saurashtra and South Gujarat agrarian PHCs.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 0, "to_idx": 2,
                    },
                    {
                        "med": "MED-CEFTRIAXONE",
                        "qty": 210.0,
                        "dist": 140.0,
                        "expiry": 115,
                        "impact": "Immediate antibiotic restocking in coastal tribal medical outposts.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.DISPATCHED,
                        "from_idx": 1, "to_idx": 3,
                    },
                ]
            },
            {
                "state_id": "INOR",
                "state_name": "Odisha",
                "officer": "officer_inor",
                "vehicle_prefix": "OD-02",
                "highway": "NH-16 Coastal Corridor",
                "items": [
                    {
                        "med": "MED-ANTIVENOM",
                        "qty": 150.0,
                        "dist": 120.0,
                        "expiry": 125,
                        "impact": "Pre-cyclonic deployment of antivenom to coastal Puri and Balasore PHCs.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 0, "to_idx": 3,
                    },
                    {
                        "med": "MED-ORS",
                        "qty": 800.0,
                        "dist": 110.0,
                        "expiry": 300,
                        "impact": "Mass rehydration salt pre-positioning for coastal waterborne outbreaks.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.RECEIVED,
                        "from_idx": 1, "to_idx": 2,
                    },
                ]
            },
            {
                "state_id": "INAS",
                "state_name": "Assam",
                "officer": "officer_inas",
                "vehicle_prefix": "AS-01",
                "highway": "NH-27 East-West Corridor",
                "items": [
                    {
                        "med": "MED-ANTIVENOM",
                        "qty": 170.0,
                        "dist": 210.0,
                        "expiry": 105,
                        "impact": "Brahmaputra valley flood-inundation venomous emergency buffer.",
                        "status": RecommendationStatusEnum.PENDING,
                        "from_idx": 0, "to_idx": 3,
                    },
                    {
                        "med": "MED-IV-NACL",
                        "qty": 320.0,
                        "dist": 190.0,
                        "expiry": 150,
                        "impact": "In-transit medical supplies for island char PHC facilities.",
                        "status": RecommendationStatusEnum.APPROVED,
                        "transfer_status": TransferStatusEnum.DISPATCHED,
                        "from_idx": 1, "to_idx": 2,
                    },
                ]
            },
        ]

        total_recs_created = 0
        total_transfers_created = 0

        now = datetime.utcnow()

        for config in state_configs:
            state_id = config["state_id"]
            # Fetch PHCs for this state
            res = await db.execute(select(PHC).where(PHC.state_id == state_id))
            phcs = res.scalars().all()
            if len(phcs) < 2:
                print(f"Skipping {state_id}: fewer than 2 PHCs found ({len(phcs)})")
                continue

            for item in config["items"]:
                from_p = phcs[item["from_idx"] % len(phcs)]
                to_p = phcs[item["to_idx"] % len(phcs)]
                if from_p.id == to_p.id:
                    to_p = phcs[(item["to_idx"] + 1) % len(phcs)]

                # Check if recommendation already exists between these facilities for this medicine
                existing_rec = await db.scalar(
                    select(RedistributionRecommendation).where(
                        RedistributionRecommendation.medicine_id == item["med"],
                        RedistributionRecommendation.from_phc_id == from_p.id,
                        RedistributionRecommendation.to_phc_id == to_p.id,
                    )
                )
                if existing_rec:
                    continue

                rec = RedistributionRecommendation(
                    medicine_id=item["med"],
                    from_phc_id=from_p.id,
                    to_phc_id=to_p.id,
                    quantity=item["qty"],
                    distance_km=item["dist"],
                    days_to_expiry=item["expiry"],
                    predicted_impact=item["impact"],
                    status=item["status"],
                    created_at=now - timedelta(hours=4),
                )
                db.add(rec)
                await db.flush()
                await db.refresh(rec)
                total_recs_created += 1

                # If approved and has transfer status, create Transfer record
                if item.get("transfer_status"):
                    t_status = item["transfer_status"]
                    history = [
                        {
                            "status": TransferStatusEnum.APPROVED.value,
                            "changed_at": (now - timedelta(hours=3, minutes=30)).isoformat() + "Z",
                            "changed_by": config["officer"],
                            "notes": f"Statutory transfer directive authorized under NDMA Section 38 mandate for {config['state_name']} jurisdiction.",
                        }
                    ]

                    if t_status in [TransferStatusEnum.DISPATCHED, TransferStatusEnum.RECEIVED]:
                        history.append({
                            "status": TransferStatusEnum.DISPATCHED.value,
                            "changed_at": (now - timedelta(hours=2)).isoformat() + "Z",
                            "changed_by": f"logistics_{state_id.lower()}",
                            "notes": f"Consignment dispatched via refrigerated truck {config['vehicle_prefix']}-RT-4091 on {config['highway']}. Temperature monitor verified at +3.8°C.",
                        })

                    if t_status == TransferStatusEnum.RECEIVED:
                        history.append({
                            "status": TransferStatusEnum.RECEIVED.value,
                            "changed_at": (now - timedelta(minutes=45)).isoformat() + "Z",
                            "changed_by": f"store_officer_{to_p.id.lower()}",
                            "notes": f"Consignment received in full at {to_p.name}. Integrity seal intact. Reconciled in facility cold ILR.",
                        })

                    transfer = Transfer(
                        recommendation_id=rec.id,
                        status=t_status,
                        status_history=history,
                    )
                    db.add(transfer)
                    await db.flush()
                    await db.refresh(transfer)
                    total_transfers_created += 1

                    if t_status == TransferStatusEnum.RECEIVED:
                        outcome = Outcome(
                            transfer_id=transfer.id,
                            stockout_prevented=True,
                            logged_at=now - timedelta(minutes=40),
                        )
                        db.add(outcome)

        await db.commit()
        print(f"Successfully seeded {total_recs_created} new recommendations and {total_transfers_created} transfers across states!")

if __name__ == "__main__":
    asyncio.run(seed_state_directives())
