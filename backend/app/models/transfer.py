from sqlalchemy import Column, Integer, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import TransferStatusEnum

class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("redistribution_recommendations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    status = Column(SQLEnum(TransferStatusEnum), default=TransferStatusEnum.APPROVED, nullable=False, index=True)
    status_history = Column(JSON, default=list, nullable=False)

    recommendation = relationship("RedistributionRecommendation", back_populates="transfer", lazy="selectin")
    outcome = relationship("Outcome", back_populates="transfer", uselist=False, lazy="selectin")
