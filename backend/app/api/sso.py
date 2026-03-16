from fastapi import APIRouter, Depends

from app.dependencies.oidc_auth import get_current_oidc_user

router = APIRouter(prefix="/sso", tags=["sso"])


@router.get("/me")
async def me(claims: dict = Depends(get_current_oidc_user)):
    return {
        "sub": claims.get("sub"),
        "email": claims.get("email") or claims.get("preferred_username"),
        "name": claims.get("name"),
        "tid": claims.get("tid"),
    }
