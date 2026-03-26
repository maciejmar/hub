# CLAUDE.md — Portal aplikacji AI (BGK)

## Cel projektu

Portal aplikacji AI dla BGK (Bank Gospodarstwa Krajowego). Centralny hub umożliwiający pracownikom BGK logowanie przez Microsoft SSO (Azure Entra ID) i dostęp do katalogu wewnętrznych aplikacji AI. Admin może zarządzać katalogiem aplikacji przez panel administracyjny.

---

## Architektura

```
Browser
  │
  ├── HTTPS → Nginx (reverse proxy na Azure VM)
  │             ├── /          → localhost:4200  (ng serve — Angular frontend)
  │             └── /api/      → localhost:18000 (Docker — FastAPI backend)
  │
  ├── Angular (hub-frontend) — SPA, ng serve --host 0.0.0.0 --port 4200
  │     └── HTTP z Bearer token → FastAPI
  │
  └── FastAPI (backend w Dockerze) — port 18000 → 8000 wewnętrznie
        └── PostgreSQL (Docker hub-postgres) — port 55432 → 5432 wewnętrznie
```

**Keycloak** jest w docker-compose ale NIE jest używany w produkcji. Produkcja używa Microsoft Entra ID (Azure AD).

---

## Stack technologiczny

### Backend (Python)
- **FastAPI** — framework REST API
- **SQLAlchemy** — ORM z Mapped/mapped_column (styl deklaratywny)
- **psycopg2** — PostgreSQL adapter
- **python-jose** — JWT weryfikacja
- **httpx** — HTTP klient (do OIDC JWKS fetch + health check aplikacji)
- **pydantic-settings** — konfiguracja z `.env`
- **uvicorn** — ASGI server

### Frontend (TypeScript)
- **Angular 19** — standalone components (bez NgModule)
- **angular-oauth2-oidc** — PKCE flow z Microsoft Entra
- **RxJS** — reaktywność

### Infrastruktura
- **Docker / Docker Compose** — backend + postgres + keycloak
- **Nginx** — reverse proxy na Azure VM
- **Azure VM** — `ai-apps-portal-test.northeurope.cloudapp.azure.com`
- **Azure Entra ID** — SSO provider (BGK tenant)

---

## Komendy

### Lokalne uruchomienie (frontend)
```bash
cd hub-frontend
npm install
npx ng serve --port 4200 --host 0.0.0.0
```

### Docker (backend + postgres)
```bash
# Z katalogu głównego
docker compose up -d
docker compose up --build -d hub-backend   # po zmianie kodu backendu (tylko backend)
docker compose up --build -d               # pełny rebuild wszystkiego
docker logs hub-backend --tail=30
```

> **Ważne**: `docker compose restart` NIE przebudowuje obrazu. Zawsze używaj `--build` po zmianie kodu Pythona.

### Na Azure VM (produkcja)
```bash
# Pull nowego kodu
cd ~/mem_code/app_a/hub
git pull origin prez2

# Restart ng serve (znajdź i zabij stary proces)
lsof -ti :4200 | xargs kill -9
cd hub-frontend
npx ng serve --port 4200 --host 0.0.0.0

# Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Build
```bash
cd hub-frontend
npx ng build --configuration development
npx ng build --configuration production
```

### Baza danych (przez Docker)
```bash
# Kontener postgres ma obciętą nazwę - użyj ID lub:
docker exec 5b035bdbfe80 psql -U postgres hub_db -c "SELECT ..."
# Tabela nazywa się catalog_apps (z 's' na końcu!)
```

---

## Konfiguracja OIDC / Azure Entra

| Parametr | Wartość |
|---|---|
| Tenant ID | `29bb5b9c-200a-4906-89ef-c651c86ab301` |
| Client ID | `e517ed53-e3c5-42b4-b8c9-e35974e369ee` |
| App name | AI-APPS-PORTAL |
| Redirect URI | `https://ai-apps-portal-test.northeurope.cloudapp.azure.com/index.html` |
| Issuer (v2) | `https://login.microsoftonline.com/29bb5b9c-.../v2.0` |

**Krytyczne**: Frontend wysyła **ID token** (nie access token) jako Bearer do backendu. Access token z Microsoft dla scopes `openid profile email` ma `aud=00000003...` (Graph) — backend by go odrzucił. ID token ma `aud=clientId` co backend akceptuje.

Implementacja: `oidc-auth.service.ts` → `getAccessToken()` zwraca `getIdToken() || getAccessToken()`.

---

## Przepływ danych

```
1. Użytkownik → /login → przycisk "Zaloguj przez Microsoft"
2. Angular (angular-oauth2-oidc) → redirect do Microsoft login
3. Microsoft → redirect z code → /index.html (PKCE callback)
4. Angular wymienia code → ID token + access token
5. auth.interceptor.ts → dodaje "Authorization: Bearer {idToken}" do każdego HTTP request
6. GET /api/v1/hub/apps → Nginx → FastAPI
7. FastAPI (oidc_auth.py) → weryfikuje JWT przez JWKS Microsoft
8. hub.py → filtruje catalog_apps po required_roles użytkownika
9. Frontend wyświetla kafelki aplikacji
```

**Role użytkownika** przychodzą z tokenu JWT (claim `roles` lub `groups`) i są zwracane przez `/api/v1/hub/apps` w polu `roles[]`.

---

## Kluczowe pliki

| Plik | Rola |
|---|---|
| `hub-frontend/src/app/environment.ts` | apiBaseUrl + konfiguracja OIDC — **zmieniaj przy każdej zmianie środowiska** |
| `hub-frontend/src/app/core/auth/oidc-auth.service.ts` | Wraper angular-oauth2-oidc, tu jest fix ID token |
| `hub-frontend/src/app/core/auth/auth.interceptor.ts` | Dodaje Bearer token do każdego request |
| `hub-frontend/src/app/features/hub.component.ts` | Główna strona z kafelkami, menu, avatar, motyw |
| `hub-frontend/src/app/features/hub.service.ts` | Wszystkie HTTP calls do backendu |
| `hub-frontend/src/app/app.routes.ts` | Routing + guardy (authGuard, adminGuard) |
| `backend/app/main.py` | FastAPI startup, seed bazy danych, CORS |
| `backend/app/dependencies/oidc_auth.py` | Weryfikacja JWT — dependency dla chronionych endpointów |
| `backend/app/api/hub.py` | Endpoint `/hub/apps` — filtruje apps po rolach |
| `backend/app/api/admin.py` | CRUD catalog_apps + `/admin/health` (httpx health check) — wymaga roli `hub-admin` |
| `backend/app/models/catalog_app.py` | Model tabeli `catalog_apps` (pola: id, name, description, url, required_roles, sort_order, is_active, status) |
| `backend/app/schemas/catalog_app.py` | Pydantic schematy — status: `active\|orange\|gray` |
| `hub-frontend/src/app/features/admin/admin.component.ts` | Panel admina — CRUD + health check aplikacji |
| `hub-frontend/src/styles.css` | Globalne style, zmienne CSS, dark/light theme |
| `docker-compose.yml` | Backend + postgres + keycloak (keycloak nieużywany produkcyjnie) |
| `/etc/nginx/sites-available/ai-apps-portal-test` | Nginx config na Azure VM |

---

## Nginx config (Azure VM) — kluczowy fragment

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:18000;   # BEZ trailing slash — przekazuje pełną ścieżkę
}
location / {
    proxy_pass http://127.0.0.1:4200;
}
```

**Uwaga**: `proxy_pass` dla `/api/` musi być BEZ trailing slash. Z trailing slash Nginx strips prefix i backend dostaje `/v1/...` zamiast `/api/v1/...`.

---

## Konwencje

- **Angular**: standalone components, wszystkie style inline w dekoratorze (`styles: \`...\``)
- **Angular**: lazy loading przez `loadComponent: () => import(...).then(m => m.Component)`
- **CSS**: zmienne CSS (`--text-main`, `--surface`, `--line`, itp.) zdefiniowane w `styles.css`
- **CSS**: dwa motywy — ciemny (default) i jasny (`body.light-theme { ... }`) zapisywane w localStorage
- **Backend**: SQLAlchemy Mapped/mapped_column styl (nie stary Column)
- **Backend**: dependency injection przez `Depends()` — `get_current_oidc_user` chroni endpointy
- **Nazewnictwo tabel**: `catalog_apps` (z 's' — nie `catalog_app`)
- **Git**: aktywna gałąź robocza to `prez2`; `master` to gałąź produkcyjna/stabilna
- **sort_order**: zaczyna się od 1 (nie 0), jest unikalny i ciągły 1..N — backend automatycznie przesuwa pozostałe aplikacje przy każdej operacji CRUD

---

## Rzeczy do zapamiętania (pułapki)

1. **ID token zamiast access token**: Microsoft access token ma `aud=00000003...` (Graph) — backend odrzuca. Frontend wysyła ID token. Nie zmieniać bez przemyślenia.

2. **Tabela: `catalog_apps`** (z 's') — nie `catalog_app`. Seed w `main.py` używa poprawnej nazwy, ale stare INSERT mogą być złe.

3. **URL aplikacji w bazie**: muszą być pełne URLe z domeną produkcyjną (`https://ai-apps-portal-test...`), nie `localhost:4200`. Hub component sprawdza `url.startsWith(window.location.origin)` i robi internal routing — działa tylko gdy URL = produkcyjna domena.

4. **Kafelek `admin-panel`** jest w bazie ale **filtrowany** w `hub.component.ts` (`visibleApps` odfilterowuje `id === 'admin-panel'`). Dostęp do admina jest przez dropdown menu konta.

5. **ng serve na VM**: Angular działa jako dev server (`ng serve`), nie jako zbudowany build serwowany przez Nginx. Po `git pull` trzeba zrestartować `ng serve` żeby załadował nowe pliki.

6. **Nazwa kontenera postgres**: `hub-postgres` może nie być rozpoznawane przez `docker exec` — używaj ID kontenera (`docker ps` → wziąć ID).

7. **Keycloak w docker-compose**: obecny ale nieużywany produkcyjnie. Nie konfigurować — pozostawić jako opcjonalne środowisko dev.

8. **Motyw i avatar**: przechowywane w `localStorage` (`hub_theme`, `hub_avatar`). Motyw aplikowany przez klasę `light-theme` na `body`.

9. **Loga BGK**: `bgk-logo-white.svg` dla ciemnego motywu, `bgk-logo.svg` dla jasnego, `bgk-logo-black.svg` dla jasnego motywu (login page). Pliki w `hub-frontend/src/` (serwowane jako root przez Angular).

10. **Status aplikacji w bazie**: pole `status` w `catalog_apps` — wartości: `active` (zielona kropka), `orange` (pomarańczowa), `gray` (szara). Widoczne jako kolorowa kropka w prawym górnym rogu kafelka na dashboardzie. Kolumna musi istnieć w DB — jeśli nie: `ALTER TABLE catalog_apps ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`.

11. **Health check** (`/admin/health`): backend wykonuje HTTP GET do URL każdej aplikacji i zwraca `active` (200), `inactive` (inny kod), `timeout`, lub `building` (wyjątek). Endpoint wymaga roli `hub-admin`. Po każdej zmianie backendu trzeba przebudować Docker.

12. **Scope `User.Read` zablokowany**: dodanie scope `User.Read` do OIDC powoduje wymaganie zgody administratora BGK w Azure Portal. Nie dodawać bez wcześniejszej zgody admina. Zdjęcia profilowe z Graph API są niedostępne bez tej zgody.

13. **sort_order — ciągłość 1..N**: backend (`admin.py`) zawiera helper `_reorder_apps(db, moving_id, new_order)` który po każdej operacji (create/update/delete) renumeruje wszystkie aplikacje tak by sort_order był unikalny i ciągły od 1. Przy wdrożeniu nowej wersji backendu warto wyrównać istniejące dane:
    ```sql
    UPDATE catalog_apps SET sort_order = subq.rn
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) AS rn FROM catalog_apps) subq
    WHERE catalog_apps.id = subq.id;
    ```

14. **Tabela wierszy w panelu admina**: `td` z `display: flex` (klasa `.actions`) powoduje przesunięcie `border-bottom` przy `border-collapse: collapse`. Przyciski Edytuj/Usuń muszą być w `<div class="actions">` wewnątrz `<td>`, nie bezpośrednio na `<td>`.
