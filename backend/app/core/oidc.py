import time
from typing import Any

import httpx
from jose import JWTError, jwt

from app.core.config import settings


class OIDCVerifier:
    def __init__(self) -> None:
        self._config_cache: dict[str, Any] | None = None
        self._jwks_cache: dict[str, Any] | None = None
        self._cache_until: float = 0

    async def _load_openid_config(self) -> dict[str, Any]:
        if self._config_cache and time.time() < self._cache_until:
            return self._config_cache

        url = settings.OIDC_DISCOVERY_URL.strip() or (
            f"{settings.OIDC_ISSUER_URL.rstrip('/')}/.well-known/openid-configuration"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            self._config_cache = response.json()
            self._cache_until = time.time() + 300
        return self._config_cache

    async def _load_jwks(self) -> dict[str, Any]:
        if self._jwks_cache and time.time() < self._cache_until:
            return self._jwks_cache

        config = await self._load_openid_config()
        jwks_uri = config.get("jwks_uri")
        if not jwks_uri:
            raise ValueError("Missing jwks_uri in OIDC configuration")

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_uri)
            response.raise_for_status()
            self._jwks_cache = response.json()
            self._cache_until = time.time() + 300
        return self._jwks_cache

    async def verify_access_token(self, token: str) -> dict[str, Any]:
        if not settings.OIDC_ENABLED:
            raise ValueError("OIDC disabled")

        try:
            header = jwt.get_unverified_header(token)
        except JWTError as exc:
            raise ValueError("Invalid token header") from exc

        kid = header.get("kid")
        if not kid:
            raise ValueError("Missing kid")

        jwks = await self._load_jwks()
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            raise ValueError("Signing key not found")

        options: dict[str, Any] = {"verify_at_hash": False}
        if not settings.OIDC_AUDIENCE:
            options["verify_aud"] = False

        decode_kwargs: dict[str, Any] = {
            "key": key,
            "algorithms": [a.strip() for a in settings.OIDC_ALGORITHMS.split(",") if a.strip()],
            "issuer": settings.OIDC_ISSUER_URL or (await self._load_openid_config()).get("issuer"),
            "options": options,
        }
        if settings.OIDC_AUDIENCE:
            decode_kwargs["audience"] = settings.OIDC_AUDIENCE

        try:
            claims = jwt.decode(token, **decode_kwargs)
        except JWTError as exc:
            import logging
            try:
                raw = jwt.decode(token, key, algorithms=["RS256"], options={"verify_signature": False, "verify_aud": False, "verify_iss": False, "verify_exp": False})
                logging.getLogger(__name__).error("JWT decode failed: %s | token_aud=%s token_iss=%s expected_iss=%s expected_aud=%s", exc, raw.get("aud"), raw.get("iss"), decode_kwargs.get("issuer"), decode_kwargs.get("audience"))
            except Exception:
                logging.getLogger(__name__).error("JWT decode failed: %s | issuer=%s audience=%s", exc, decode_kwargs.get("issuer"), decode_kwargs.get("audience"))
            raise ValueError("Invalid access token") from exc

        import logging
        logging.getLogger(__name__).info("Token OK — aud=%s iss=%s typ=%s", claims.get("aud"), claims.get("iss"), claims.get("typ"))
        token_type = claims.get("typ")
        if token_type and token_type.lower() not in {"bearer", "jwt", "access"}:
            raise ValueError("Token is not an access token")
        return claims


oidc_verifier = OIDCVerifier()
