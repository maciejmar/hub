import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
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
        .filter(CatalogApp.is_active.is_(True), CatalogApp.is_system.is_(False))
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


@router.get("/system-apps")
async def list_system_apps(
    claims: dict = Depends(get_current_oidc_user),
    db: Session = Depends(get_db),
):
    user_roles: set[str] = set(claims.get("roles", []))
    if "hub-admin" not in user_roles:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin only")

    system_apps = (
        db.query(CatalogApp)
        .filter(CatalogApp.is_active.is_(True), CatalogApp.is_system.is_(True))
        .order_by(CatalogApp.sort_order)
        .all()
    )

    return {
        "apps": [
            {
                "id": app.id,
                "name": app.name,
                "description": app.description,
                "url": app.url,
                "status": app.status,
            }
            for app in system_apps
        ]
    }


@router.get("/check")
async def check_app(
    url: str,
    claims: dict = Depends(get_current_oidc_user),
):
    try:
        async with httpx.AsyncClient(verify=False, timeout=3.0, follow_redirects=True) as client:
            resp = await client.get(url)
            return {"available": resp.status_code < 400}
    except Exception:
        return {"available": False}


@router.get("/portainer-token")
async def get_portainer_token(
    claims: dict = Depends(get_current_oidc_user),
):
    async with httpx.AsyncClient(verify=False, timeout=5.0) as client:
        resp = await client.post(
            "http://10.112.32.19:9000/api/auth",
            json={"username": "user", "password": "portainer-user"},
        )
        resp.raise_for_status()
        return {"jwt": resp.json()["jwt"]}


@router.get("/portainer-login", response_class=HTMLResponse)
async def portainer_login_page():
    """Strona HTML która loguje się do Portainera bezpośrednio z przeglądarki."""
    return """<!DOCTYPE html>
<html>
<head><title>Portainer</title></head>
<body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <p id="msg">Logowanie do Portainer...</p>
  <script>
    fetch('/portainer/api/auth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: 'user', password: 'portainer-user'})
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      localStorage.setItem('portainer.JWT', data.jwt);
      window.location.replace('/portainer/');
    })
    .catch(function(e) {
      document.getElementById('msg').textContent = 'Błąd logowania: ' + e.message;
    });
  </script>
</body>
</html>"""
