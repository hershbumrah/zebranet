"""Application configuration via Pydantic settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    """App configuration loaded from environment variables."""

    DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_PRE_PING: bool = True
    DB_ECHO: bool = False

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
