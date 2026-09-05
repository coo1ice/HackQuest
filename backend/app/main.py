from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.api.routers import (
    auth,
    phc_ingestion,
    visibility,
    forecast,
    redistribution,
    transfers,
    alerts,
    audit,
)
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nhrm_platform")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connections and tables...")
    await init_db()
    logger.info("NHRM Federated AI Platform ready for operations.")
    yield
    logger.info("Shutting down NHRM Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Federated AI Platform for National PHC Health Resource & Supply Chain Management",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health-check endpoint
@app.get("/health", tags=["System Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Federated AI National PHC Health Resource Platform",
        "version": "2.0.0",
        "mode": "Hackathon MVP",
    }

# Register all API v1 routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(phc_ingestion.router, prefix=api_prefix)
app.include_router(visibility.router, prefix=api_prefix)
app.include_router(forecast.router, prefix=api_prefix)
app.include_router(redistribution.router, prefix=api_prefix)
app.include_router(transfers.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)

# Also mount at root for direct paths specified in SRS (e.g. /auth/login, /national/overview, /forecast/*, etc.)
app.include_router(auth.router)
app.include_router(phc_ingestion.router)
app.include_router(visibility.router)
app.include_router(forecast.router)
app.include_router(redistribution.router)
app.include_router(transfers.router)
app.include_router(alerts.router)
app.include_router(audit.router)
