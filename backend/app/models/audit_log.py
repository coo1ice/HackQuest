from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.database import Base

class AuditLogEntry(Base):
    __tablename__ = "audit_log_entries"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    actor_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    target_id = Column(String, nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    extra_metadata = Column(JSON, default=dict, nullable=False)
