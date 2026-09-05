from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.database import Base
from app.models.enums import UserRoleEnum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRoleEnum), nullable=False, index=True)
    scope_id = Column(String, nullable=False, index=True)  # ID of PHC, district, or state
