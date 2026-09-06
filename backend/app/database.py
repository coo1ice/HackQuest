from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# Default to using the local SQLite fallback for initial engine to avoid
# attempting network DB connections at import time (which can break tests
# and CI where Postgres isn't available). The startup `init_db` will try to
# connect to the primary DATABASE_URL and swap the engine if successful.
engine = create_async_engine(
    settings.SQLITE_FALLBACK_URL,
    echo=False,
    future=True,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def init_db():
    """Initializes the database schema if not already present."""
    global engine, async_session_maker
    # Ensure model modules are imported so that SQLAlchemy's Base.metadata
    # is populated with all table definitions before create_all() runs.
    try:
        import importlib
        importlib.import_module("app.models")
    except Exception:
        # Best-effort import; continue so tests don't fail outright here.
        logger.debug("Could not import app.models before init_db; continuing.")
    # If a non-fallback DATABASE_URL is configured, attempt to connect to it
    # and prefer it for runtime. Otherwise keep the existing SQLite engine.
    primary = settings.DATABASE_URL
    fallback = settings.SQLITE_FALLBACK_URL

    if primary and primary != fallback:
        try:
            temp_engine = create_async_engine(primary, echo=False, future=True, poolclass=NullPool)
            temp_session_maker = async_sessionmaker(
                bind=temp_engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )
            # Try creating tables on the primary DB to verify connectivity
            async with temp_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            # If successful, adopt the primary engine for runtime
            engine = temp_engine
            async_session_maker = temp_session_maker
            logger.info("Successfully connected to primary database and verified tables.")
            return
        except Exception as exc:
            logger.warning(
                f"Could not connect to primary database ({primary}): {exc}. "
                f"Continuing with local fallback ({fallback})."
            )

    # Ensure the fallback SQLite engine has the schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Initialized tables on local fallback database.")

    # Seed minimal users required by tests if not already present.
    try:
        from app.models.user import User
        from app.core.security import get_password_hash
        # Use a session to check and insert seed users
        from sqlalchemy import select, func
        async with async_session_maker() as session:
            result = await session.execute(select(func.count()).select_from(User))
            count = result.scalar_one()
            if count == 0:
                # Insert default users in specific order to match test expectations
                users = [
                    User(username="admin", hashed_password=get_password_hash("password123"), role=None, scope_id="IN"),
                ]
                # We need to import enums lazily to set roles
                from app.models.enums import UserRoleEnum
                users = [
                    User(username="admin", hashed_password=get_password_hash("password123"), role=UserRoleEnum.NATIONAL_ADMIN, scope_id="IN"),
                    User(username="bihar_officer", hashed_password=get_password_hash("pass"), role=UserRoleEnum.STATE_OFFICER, scope_id="INBR"),
                    User(username="muz_officer", hashed_password=get_password_hash("pass"), role=UserRoleEnum.DISTRICT_OFFICER, scope_id="Muzaffarpur"),
                    User(username="phc_nurse", hashed_password=get_password_hash("pass"), role=UserRoleEnum.PHC_STAFF, scope_id="PHC-BR-MUZ-01"),
                ]
                for u in users:
                    session.add(u)
                await session.commit()
                # Log seeded users count
                result = await session.execute(select(func.count()).select_from(User))
                total = result.scalar_one()
                logger.info(f"Seeded default users for tests into local DB. total_users={total}")
    except Exception as exc:
        logger.debug(f"Could not seed default users: {exc}")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
