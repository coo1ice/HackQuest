from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime
from app.database import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(String(50), primary_key=True, index=True)  # e.g., 'Muzaffarpur', 'Pune'
    name = Column(String(100), nullable=False, index=True)
    state_id = Column(String(10), nullable=False, index=True)
    total_phcs = Column(Integer, default=4)
    reporting_phcs = Column(Integer, default=4)
    stock_health_score = Column(Float, default=85.0)
    bed_occupancy_pct = Column(Float, default=65.0)
    critical_stockouts = Column(Integer, default=0)
    status = Column(String(50), default="NORMAL BUFFER")
    created_at = Column(DateTime, default=datetime.utcnow)
