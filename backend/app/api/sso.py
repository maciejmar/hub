from fastapi import APIRouter, Depends

from app.dependencies.oidc_auth import get_current_oidc_user

router = APIRouter(prefix="/sso", tags=["sso"])


@router.get("/me")
async def me(claims: dict = Depends(get_current_oidc_user)):
    return {
        "sub": claims.get("sub"),
        "email": claims.get("email"),
        "preferred_username": claims.get("preferred_username"),
        "name": claims.get("name"),
        "realm_roles": claims.get("realm_access", {}).get("roles", []),
        "resource_access": claims.get("resource_access", {}),
    }
