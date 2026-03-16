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
    OIDC_ISSUER_URL: str = "https://login.microsoftonline.com/3cf0f665-a664-4ad7-a75f-520538df5523/v2.0"
    OIDC_DISCOVERY_URL: str = "https://login.microsoftonline.com/3cf0f665-a664-4ad7-a75f-520538df5523/v2.0/.well-known/openid-configuration"
    OIDC_AUDIENCE: str = "4fe1d350-b8b4-4c0b-988d-0323acdf8175"
    OIDC_ALGORITHMS: str = "RS256"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        return value or ""


settings = Settings()
