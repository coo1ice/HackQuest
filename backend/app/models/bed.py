from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class BedRecord(Base):
    __tablename__ = "bed_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    total_beds = Column(Integer, nullable=False)
    occupied_beds = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    phc = relationship("PHC", back_populates="beds")
