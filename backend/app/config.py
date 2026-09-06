from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Federated AI Platform for National PHC Health Resource Management"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    SECRET_KEY: str = "nhrm-federated-ai-super-secret-jwt-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Default to local SQLite fallback for development and CI/test environments.
    DATABASE_URL: str = "sqlite+aiosqlite:///./phc_health_db.sqlite"
    SQLITE_FALLBACK_URL: str = "sqlite+aiosqlite:///./phc_health_db.sqlite"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    MODEL_REGISTRY_DIR: str = "ml/model_registry"
    SYNTHETIC_DATA_DAYS: int = 90
    DEFAULT_FL_ROUNDS: int = 3

settings = Settings()
