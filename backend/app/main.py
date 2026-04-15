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
    _migrate_schema()
    _seed_catalog()
    _seed_system_apps()


def _migrate_schema() -> None:
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE catalog_apps ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.commit()


def _seed_system_apps() -> None:
    db = SessionLocal()
    try:
        system_apps = [
            CatalogApp(
                id="portainer",
                name="Portainer",
                description="Zarządzanie obrazami dockerowymi",
                url="https://portal-ai.bank.com.pl/portainer",
                required_roles="hub-admin",
                sort_order=1,
                is_system=True,
            ),
            CatalogApp(
                id="gatus",
                name="Gatus",
                description="Informacje o ruchu aplikacji",
                url="https://portal-ai.bank.com.pl/gatus",
                required_roles="hub-admin",
                sort_order=2,
                is_system=True,
            ),
            CatalogApp(
                id="rejestrator",
                name="Rejestracja środowiska",
                description="Kalendarz wynajęcia serwera",
                url="https://portal-ai.bank.com.pl/rejestrator",
                required_roles="hub-admin",
                sort_order=3,
                is_system=True,
            ),
        ]
        for app in system_apps:
            if not db.get(CatalogApp, app.id):
                db.add(app)
        db.commit()
    finally:
        db.close()


def _seed_catalog() -> None:
    db = SessionLocal()
    try:
        if db.query(CatalogApp).count() > 0:
            return
        initial_apps = [
            CatalogApp(
                id="gacek",
                name="Gacek",
                description="Aplikacja dla Call Center",
                url="http://localhost:4201",
                required_roles="",
                sort_order=0,
            ),
            CatalogApp(
                id="analityk-ai",
                name="Analityk AI",
                description="Analiza i weryfikacja dokumentacji",
                url="http://localhost:4202",
                required_roles="",
                sort_order=1,
            ),
            CatalogApp(
                id="eksplorator",
                name="Eksplorator",
                description="Testowanie aplikacji w GUI",
                url="http://localhost:4200/eksplorator",
                required_roles="",
                sort_order=2,
            ),
            CatalogApp(
                id="proster",
                name="Proster",
                description="Prosty język polski",
                url="http://localhost:4200/proster",
                required_roles="",
                sort_order=3,
            ),
            CatalogApp(
                id="asystent-programisty",
                name="Asystent programisty",
                description="Współtworzenie kodu z AI",
                url="http://localhost:4200/asystent-programisty",
                required_roles="",
                sort_order=4,
            ),
            CatalogApp(
                id="ai-sandbox",
                name="Miejsce na Wasz AI Sandbox",
                description="Wsparcie AI",
                url="http://localhost:4200/ai-sandbox",
                required_roles="",
                sort_order=5,
            ),
            CatalogApp(
                id="admin-panel",
                name="Panel Administracyjny",
                description="Zarzadzanie katalogiem aplikacji i uprawnieniami.",
                url="http://localhost:4200/admin",
                required_roles="hub-admin",
                sort_order=6,
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
