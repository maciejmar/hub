from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.oidc import oidc_verifier

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_oidc_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        claims = await oidc_verifier.verify_access_token(credentials.credentials)
    except ValueError as exc:
        import logging
        logging.getLogger(__name__).error("OIDC verify failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return claims
