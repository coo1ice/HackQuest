from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.enums import StaffStatusEnum

class StaffAttendanceRecord(Base):
    __tablename__ = "staff_attendance_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    phc_id = Column(String, ForeignKey("phcs.id", ondelete="CASCADE"), nullable=False, index=True)
    staff_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)
    status = Column(SQLEnum(StaffStatusEnum), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    phc = relationship("PHC", back_populates="attendances")
