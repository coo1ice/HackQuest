from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class FootfallRecord(Base):
    __tablename__ = "footfall_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_count = Column(Integer, nullable=False)
    department = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    phc = relationship("PHC", back_populates="footfalls")
