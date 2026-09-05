from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.enums import SeverityEnum

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_id = Column(String, nullable=False, index=True)
    predicted_demand = Column(Float, nullable=False)
    stockout_risk = Column(Float, nullable=False)  # probability 0.0 to 1.0
    predicted_stockout_date = Column(Date, nullable=True)
    severity = Column(SQLEnum(SeverityEnum), nullable=False, index=True)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    phc = relationship("PHC", back_populates="forecasts")
