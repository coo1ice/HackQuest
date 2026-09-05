from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import Token, UserResponse, LoginRequest, UserCreate
from app.services import auth_service, audit_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Seed or register a new platform user."""
    user = await auth_service.create_user(db, user_in)
    await audit_service.log_action(
        db,
        actor_id=user.username,
        action="USER_REGISTERED",
        target_id=str(user.id),
        metadata={"role": user.role.value, "scope_id": user.scope_id},
    )
    return user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Issue JWT token via standard OAuth2 password flow."""
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = await auth_service.generate_user_token(user)
    await audit_service.log_action(
        db,
        actor_id=user.username,
        action="USER_LOGIN_SUCCESS",
        target_id=str(user.id),
    )
    return token

@router.post("/login-json", response_model=Token)
async def login_json(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Issue JWT token via direct JSON body (convenience for API clients)."""
    user = await auth_service.authenticate_user(db, body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = await auth_service.generate_user_token(user)
    await audit_service.log_action(
        db,
        actor_id=user.username,
        action="USER_LOGIN_SUCCESS",
        target_id=str(user.id),
    )
    return token

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Return currently authenticated user identity, role, and operational scope."""
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
):
    """Refresh active access token."""
    return await auth_service.generate_user_token(current_user)
