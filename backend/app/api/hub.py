from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.oidc_auth import get_current_oidc_user
from app.models.catalog_app import CatalogApp

router = APIRouter(prefix="/hub", tags=["hub"])


@router.get("/apps")
async def list_apps(
    claims: dict = Depends(get_current_oidc_user),
    db: Session = Depends(get_db),
):
    user_roles: set[str] = set(claims.get("roles", []))

    all_apps = (
        db.query(CatalogApp)
        .filter(CatalogApp.is_active.is_(True))
        .order_by(CatalogApp.sort_order)
        .all()
    )

    available_apps = [
        {
            "id": app.id,
            "name": app.name,
            "description": app.description,
            "url": app.url,
            "status": app.status,
        }
        for app in all_apps
        if not app.required_roles_list or user_roles.intersection(app.required_roles_list)
    ]

    return {
        "user": {
            "sub": claims.get("sub"),
            "email": claims.get("email") or claims.get("preferred_username"),
            "name": claims.get("name"),
        },
        "roles": list(user_roles),
        "apps": available_apps,
    }
