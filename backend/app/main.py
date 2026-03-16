import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.catalog_app import CatalogApp

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
    _seed_catalog()


def _seed_catalog() -> None:
    db = SessionLocal()
    try:
        if db.query(CatalogApp).count() > 0:
            return
        initial_apps = [
            CatalogApp(
                id="app-a",
                name="App A - Dni do daty",
                description="Kalkulator liczby dni do wskazanej daty.",
                url="http://localhost:4201",
                required_roles="",
                sort_order=0,
            ),
            CatalogApp(
                id="app-b",
                name="App B - Cisnienie Warszawa",
                description="Aktualne cisnienie atmosferyczne i temperatura.",
                url="http://localhost:4202",
                required_roles="",
                sort_order=1,
            ),
            CatalogApp(
                id="admin-panel",
                name="Panel Administracyjny",
                description="Zarzadzanie katalogiem aplikacji i uprawnieniami.",
                url="http://localhost:4200/admin",
                required_roles="hub-admin",
                sort_order=2,
            ),
        ]
        db.add_all(initial_apps)
        db.commit()
        logger.info("Catalog seeded with %d apps", len(initial_apps))
    finally:
        db.close()


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
