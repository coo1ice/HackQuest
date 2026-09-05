from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.enums import RecommendationStatusEnum

class RedistributionRecommendation(Base):
    __tablename__ = "redistribution_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    medicine_id = Column(String, nullable=False, index=True)
    from_phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    to_phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    days_to_expiry = Column(Integer, nullable=False)
    predicted_impact = Column(String, nullable=False)
    status = Column(SQLEnum(RecommendationStatusEnum), default=RecommendationStatusEnum.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    from_phc = relationship("PHC", foreign_keys=[from_phc_id])
    to_phc = relationship("PHC", foreign_keys=[to_phc_id])
    transfer = relationship("Transfer", back_populates="recommendation", uselist=False)
