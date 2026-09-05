from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.enums import SeverityEnum

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String, nullable=False, index=True)  # medicine, bed, staff, oxygen
    severity = Column(SQLEnum(SeverityEnum), nullable=False, index=True)
    predicted_date = Column(Date, nullable=False)
    linked_recommendation_id = Column(Integer, ForeignKey("redistribution_recommendations.id", ondelete="SET NULL"), nullable=True)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    phc = relationship("PHC", back_populates="alerts")
    recommendation = relationship("RedistributionRecommendation", foreign_keys=[linked_recommendation_id])
