import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.oidc_auth import get_current_oidc_user
from app.models.catalog_app import CatalogApp
from app.schemas.catalog_app import CatalogAppCreate, CatalogAppRead, CatalogAppUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(claims: dict = Depends(get_current_oidc_user)) -> dict:
    roles: list[str] = claims.get("roles", [])
    if "hub-admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return claims


@router.get("/health")
async def check_health(
    _claims: dict = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    apps = db.query(CatalogApp).all()
    results: dict[str, str] = {}
    async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
        for app in apps:
            try:
                r = await client.get(app.url)
                results[app.id] = "active" if r.status_code == 200 else "inactive"
            except httpx.TimeoutException:
                results[app.id] = "timeout"
            except Exception:
                results[app.id] = "building"
    return results


@router.get("/apps", response_model=list[CatalogAppRead])
def list_all_apps(
    _claims: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(CatalogApp).order_by(CatalogApp.sort_order).all()


@router.post("/apps", response_model=CatalogAppRead, status_code=status.HTTP_201_CREATED)
def create_app(
    payload: CatalogAppCreate,
    _claims: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing = db.get(CatalogApp, payload.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="App with this id already exists")

    app = CatalogApp(**payload.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.put("/apps/{app_id}", response_model=CatalogAppRead)
def update_app(
    app_id: str,
    payload: CatalogAppUpdate,
    _claims: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    app = db.get(CatalogApp, app_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    for field, value in payload.model_dump().items():
        setattr(app, field, value)

    db.commit()
    db.refresh(app)
    return app


@router.delete("/apps/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(
    app_id: str,
    _claims: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    app = db.get(CatalogApp, app_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    db.delete(app)
    db.commit()
