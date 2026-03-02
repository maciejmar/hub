from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/hub_db"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    API_V1_PREFIX: str = "/api/v1"

    BACKEND_CORS_ORIGINS: str = "http://localhost:4200"

    OIDC_ENABLED: bool = True
    OIDC_ISSUER_URL: str = "http://localhost:8081/realms/hub"
    OIDC_DISCOVERY_URL: str = ""
    OIDC_AUDIENCE: str = ""
    OIDC_ALGORITHMS: str = "RS256"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        return value or ""


settings = Settings()
