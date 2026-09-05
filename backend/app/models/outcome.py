from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    stockout_prevented = Column(Boolean, nullable=False)
    logged_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    transfer = relationship("Transfer", back_populates="outcome")
