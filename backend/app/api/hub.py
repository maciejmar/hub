from fastapi import APIRouter, Depends

from app.dependencies.oidc_auth import get_current_oidc_user

router = APIRouter(prefix="/hub", tags=["hub"])

APP_CATALOG = [
    {
        "id": "inbox",
        "name": "App A - Dni do daty",
        "description": "Kalkulator liczby dni do wskazanej daty.",
        "url": "http://localhost:4201",
        "required_roles": [],
    },
    {
        "id": "pressure",
        "name": "App B - Cisnienie Warszawa",
        "description": "Aktualne cisnienie atmosferyczne i temperatura.",
        "url": "http://localhost:4202",
        "required_roles": ["offline_access"],
    },
    {
        "id": "admin-panel",
        "name": "Panel Administracyjny",
        "description": "Zarzadzanie konfiguracja i uprawnieniami systemu.",
        "url": "https://hub.local/apps/admin",
        "required_roles": ["hub-admin"],
    },
]


@router.get("/apps")
async def list_apps(claims: dict = Depends(get_current_oidc_user)):
    realm_roles = set(claims.get("realm_access", {}).get("roles", []))

    available_apps: list[dict] = []
    for app in APP_CATALOG:
        required_roles = set(app["required_roles"])
        if not required_roles or required_roles.issubset(realm_roles):
            available_apps.append(
                {
                    "id": app["id"],
                    "name": app["name"],
                    "description": app["description"],
                    "url": app["url"],
                }
            )

    return {
        "user": {
            "sub": claims.get("sub"),
            "email": claims.get("email"),
            "name": claims.get("name"),
            "preferred_username": claims.get("preferred_username"),
        },
        "roles": sorted(realm_roles),
        "apps": available_apps,
    }
