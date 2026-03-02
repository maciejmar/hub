# Hub Apps - Keycloak SSO (OIDC)

Projekt zawiera dwa tryby auth:
- lokalny auth (`/api/v1/auth/*`) jako fallback developerski,
- docelowy SSO przez OIDC (Keycloak) dla huba i aplikacji podrzednych.

## 1) Start backend + Keycloak + PostgreSQL

1. Skopiuj env backendu:
   ```bash
   copy backend\.env.example backend\.env
   ```
2. Uruchom kontenery:
   ```bash
   docker-compose up --build
   ```
3. Sprawdz uslugi:
- FastAPI: `http://localhost:18000/health`
- Keycloak: `http://localhost:8081`
- Keycloak admin: `admin / admin`
- PostgreSQL (hub, host): `localhost:55432`

Porty hosta sa konfigurowalne przez plik `.env` w katalogu projektu:
- `HUB_BACKEND_PORT` (domyslnie `18000`)
- `HUB_KEYCLOAK_PORT` (domyslnie `8081`)
- `HUB_PG_PORT` (domyslnie `55432`)

Uwaga:
- Kod `137` przy zatrzymywaniu kontenerow (`Ctrl+C`) jest normalny.
- Backend ma retry polaczenia z Postgres podczas startupu, wiec przy wolniejszym starcie DB nie powinien juz padac.

Keycloak importuje realm `hub` z klientem OIDC:
- `client_id`: `hub-frontend` (public)
- flow: Authorization Code + PKCE (S256)
- testowy user: `hub-user / Pass1234!`

## 2) Backend OIDC

Nowy endpoint chroniony tokenem OIDC:
- `GET /api/v1/sso/me`

Walidacja po stronie FastAPI:
- discovery: `/.well-known/openid-configuration`
- klucze: `jwks_uri`
- podpis JWT + issuer (+ opcjonalnie audience)

Kluczowe pliki:
- `backend/app/core/oidc.py`
- `backend/app/dependencies/oidc_auth.py`
- `backend/app/api/sso.py`

## 3) Angular OIDC (PKCE)

W tym repo jest warstwa integracyjna Angulara:
- `OidcAuthService`
- `authGuard`
- `authInterceptor`
- callback route: `/auth/callback`

W docelowej aplikacji Angular zainstaluj:
```bash
npm install angular-oauth2-oidc
```

Nastepnie wykorzystaj pliki z `frontend/src/app/...`.

## 4) Najwazniejsze URL-e

- OIDC issuer (przegladarka): `http://localhost:8081/realms/hub`
- OIDC discovery/JWKS (z kontenera backend): `http://keycloak:8080/realms/hub/.well-known/openid-configuration`

Uwaga o `issuer`:
- token z przegladarki ma issuer `http://localhost:8081/realms/hub`
- backend musi walidowac ten issuer, ale discovery/JWKS moze pobierac po adresie kontenerowym `keycloak:8080`

## 5) Co dalej pod pelne SSO dla wielu aplikacji

1. Kazda aplikacja dostaje osobnego klienta OIDC w Keycloak.
2. Role i grupy trzymasz w realm/client roles.
3. Hub mapuje role -> widocznosc kafelkow aplikacji.
4. Dla produkcji: TLS, reverse proxy, cookie-based BFF dla refresh tokenow.
