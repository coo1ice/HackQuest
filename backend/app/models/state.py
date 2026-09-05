from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime
from app.database import Base

class State(Base):
    __tablename__ = "states"

    id = Column(String(10), primary_key=True, index=True)  # e.g., 'INBR', 'INMH'
    name = Column(String(100), nullable=False, index=True) # e.g., 'Bihar', 'Maharashtra'
    zone = Column(String(50), nullable=True)               # e.g., 'East', 'West', 'North', 'South', 'UT'
    capital = Column(String(100), nullable=True)           # e.g., 'Patna', 'Mumbai'
    command_name = Column(String(150), nullable=True)      # e.g., 'Bihar State Command'
    total_districts = Column(Integer, default=4)
    total_phcs = Column(Integer, default=12)
    reporting_phcs = Column(Integer, default=12)
    stock_health_score = Column(Float, default=85.0)
    bed_occupancy_pct = Column(Float, default=65.0)
    staff_health_score = Column(Float, default=88.0)
    triage_status = Column(String(50), default="adequate") # 'critical', 'adequate', 'normal'
    sso_name = Column(String(150), nullable=True)          # State Surveillance Officer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
