import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="Hub Auth API")
logger = logging.getLogger(__name__)


@app.on_event("startup")
def on_startup() -> None:
    max_attempts = 30
    delay_seconds = 2

    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            break
        except OperationalError:
            if attempt == max_attempts:
                logger.exception("Database is not ready after %s attempts", max_attempts)
                raise
            logger.warning(
                "Database not ready yet (attempt %s/%s), retrying in %ss",
                attempt,
                max_attempts,
                delay_seconds,
            )
            time.sleep(delay_seconds)

    Base.metadata.create_all(bind=engine)


allowed_origins = [o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
