from pydantic import BaseModel
from typing import Optional
from app.models.enums import UserRoleEnum

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRoleEnum
    scope_id: str
    username: str

class TokenPayload(BaseModel):
    user_id: int
    username: str
    role: UserRoleEnum
    scope_id: str
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRoleEnum
    scope_id: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRoleEnum
    scope_id: str

    class Config:
        from_attributes = True
