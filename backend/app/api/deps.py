from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.enums import UserRoleEnum
from app.schemas.auth import TokenPayload
from typing import List, Callable


async def _extract_bearer_token(request: Request) -> str | None:
    auth = request.headers.get('authorization')
    if not auth:
        return None
    parts = auth.split(' ')
    if len(parts) != 2:
        return None
    scheme, token = parts
    if scheme.lower() != 'bearer':
        return None
    return token


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = await _extract_bearer_token(request)

    # If no token and DEBUG mode, return seeded admin user for local dev convenience
    from app.config import settings
    if not token and settings.DEBUG:
        query = select(User).where(User.username == 'admin')
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        if user:
            return user
        # fallthrough to credentials_exception if admin not present

    payload: TokenPayload = decode_access_token(token) if token else None
    if payload is None or payload.username is None:
        raise credentials_exception

    query = select(User).where(User.id == payload.user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

def require_role(*allowed_roles: UserRoleEnum) -> Callable:
    """Dependency factory enforcing Role-Based Access Control."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden for role '{current_user.role.value}'. Allowed roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker
