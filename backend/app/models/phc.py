from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship
from app.database import Base

class PHC(Base):
    __tablename__ = "phcs"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    district_id = Column(String, nullable=False, index=True)
    state_id = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Relationships
    stocks = relationship("StockRecord", back_populates="phc", cascade="all, delete-orphan")
    beds = relationship("BedRecord", back_populates="phc", cascade="all, delete-orphan")
    attendances = relationship("StaffAttendanceRecord", back_populates="phc", cascade="all, delete-orphan")
    footfalls = relationship("FootfallRecord", back_populates="phc", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="phc", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="phc", cascade="all, delete-orphan")
