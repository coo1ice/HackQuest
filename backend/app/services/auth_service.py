from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.enums import UserRoleEnum
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import Token, UserCreate
from fastapi import HTTPException, status
from typing import Optional
import logging

logger = logging.getLogger(__name__)

async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]:
    query = select(User).where(User.username == username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        logger.info(f"authenticate_user: no user found for {username}")
        # keep returning None for authentication failure
        return None
    if not verify_password(password, user.hashed_password):
        logger.info(f"authenticate_user: password mismatch for {username}")
        return None
    return user

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    query = select(User).where(User.username == user_in.username)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        scope_id=user_in.scope_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def generate_user_token(user: User) -> Token:
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "sub": user.username,
            "username": user.username,
            "role": user.role.value,
            "scope_id": user.scope_id,
        }
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        scope_id=user.scope_id,
        username=user.username,
    )
