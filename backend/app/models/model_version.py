from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum as SQLEnum
from datetime import datetime
from app.database import Base
from app.models.enums import ModelTypeEnum

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    model_type = Column(SQLEnum(ModelTypeEnum), nullable=False, index=True)
    version = Column(String, nullable=False, index=True)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    metrics = Column(JSON, default=dict, nullable=False)
