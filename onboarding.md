# Onboarding — integracja aplikacji z SSO Portalu AI (BGK)

Ten dokument opisuje, co musi zrobić developer aplikacji z Portalu-AI, aby użytkownik zalogowany w tym hubie nie musiał się logować ponownie po wejściu do ich aplikacji.

---

## Jak działa SSO — mechanizm

Sesja logowania **nie żyje w Portalu ani w Waszej aplikacji** — żyje na serwerach Microsoft Entra ID (Azure AD).

### Pierwsze logowanie (do Portalu)

1. Użytkownik klika "Zaloguj" w Portalu
2. Przeglądarka jest przekierowywana na `login.microsoftonline.com`
3. Użytkownik wpisuje login/hasło
4. Microsoft zapisuje w przeglądarce **własne cookie sesji** — na domenie `login.microsoftonline.com`, nie na domenie Portalu
5. Microsoft przekierowuje użytkownika z powrotem do Portalu z kodem autoryzacji
6. Portal wymienia kod na token (Authorization Code Flow + PKCE) i wpuszcza użytkownika

### Wejście do Waszej aplikacji (ten sam użytkownik, ta sama przeglądarka)

1. Użytkownik klika kafelek/link prowadzący do Waszej aplikacji
2. Wasza aplikacja widzi, że użytkownik nie ma jeszcze swojego tokena → przekierowuje na `login.microsoftonline.com`
3. Microsoft sprawdza przeglądarkę i znajduje cookie sesji z kroku 4 powyżej
4. Microsoft **nie pyta o hasło** — od razu odsyła z kodem autoryzacji
5. Wasza aplikacja wymienia kod na własny token i wpuszcza użytkownika

Efekt: użytkownik nie widzi drugiego ekranu logowania.

### Warunek konieczny

Jedyny wymóg, by to zadziałało: Wasza aplikacja musi używać **tego samego tenant Microsoft Entra ID** co Portal:

```
Tenant ID: 29bb5b9c-200a-4906-89ef-c651c86ab301
Issuer:    https://login.microsoftonline.com/29bb5b9c-200a-4906-89ef-c651c86ab301/v2.0
```

Jeśli Wasza aplikacja skonfiguruje się na inny tenant, mechanizm nie zadziała — to będzie inny dostawca tożsamości, który nie ma zapisanej sesji tego użytkownika.

### Czego NIE trzeba robić

- Nie trzeba przekazywać tokena z Portalu do Waszej aplikacji
- Nie trzeba integrować Waszego backendu z backendem Portalu
- Nie trzeba współdzielić bazy danych ani sesji

Każda aplikacja działa w pełni niezależnie. SSO jest efektem tego, że obie aplikacje pytają o tożsamość użytkownika ten sam Identity Provider (Microsoft).

---

## Co musicie zrobić — krok po kroku

### 1. Zarejestrować własną aplikację w Azure Entra ID

Rekomendowane: osobny **App Registration** w tym samym tenant (nie współdzielenie Client ID Portalu) — lepsza izolacja audytowa, własne scope i uprawnienia.

- Tenant: `29bb5b9c-200a-4906-89ef-c651c86ab301`
- Redirect URI: domena/ścieżka Waszej aplikacji
- Typ: SPA / Web — w zależności od architektury Waszej aplikacji
- Flow: Authorization Code Flow + PKCE (bez client secret w aplikacjach frontendowych)

### 2. Zdefiniować własne API i scope (ważne — patrz pułapka niżej)

W App Registration zdefiniujcie własne API (Application ID URI) i własny scope, np. `api://<wasz-client-id>/access_as_user`. Poproście o ten scope przy logowaniu.

### 3. Frontend — implementacja OIDC

Dowolna biblioteka klienta OIDC obsługująca Authorization Code Flow + PKCE. W Angularze analogicznie do Portalu (`angular-oauth2-oidc`):

```typescript
issuer: 'https://login.microsoftonline.com/29bb5b9c-200a-4906-89ef-c651c86ab301/v2.0',
clientId: '<Wasz własny Client ID>',
responseType: 'code',
scope: 'openid profile email api://<wasz-client-id>/access_as_user',
```

### 4. Backend — weryfikacja tokena

Backend musi weryfikować JWT przez JWKS Microsoft (klucze publiczne pobierane z `.well-known/openid-configuration` danego tenant). Wzorcowa implementacja w repo Portalu:

- `backend/app/core/oidc.py` — pobranie JWKS, weryfikacja podpisu, walidacja `issuer`/`audience`
- `backend/app/dependencies/oidc_auth.py` — dependency FastAPI chroniące endpointy

Logika jest analogiczna niezależnie od języka/frameworka backendu.

---

## Pułapka, którą napotkał Portal — i jak ją uniknąć

Portal musiał wysyłać **ID token** zamiast **access token** jako Bearer do swojego backendu. Powód: Portal prosi tylko o scope `openid profile email`, więc jego access token ma `aud=00000003-0000-0000-c000-000000000000` (to jest Microsoft Graph) — backend Portalu odrzucał taki token, bo nie był przeznaczony dla niego.

**Jak tego uniknąć:** jeśli zdefiniujecie własne API i scope w swoim App Registration (krok 2 powyżej) i o ten scope poprosicie przy logowaniu, Wasz access token będzie mieć poprawny `aud` = Wasza aplikacja. Możecie wtedy normalnie używać access tokena — bez potrzeby żadnego workaroundu.

---

## Jednorazowy ekran zgody (consent)

Jeśli Wasz App Registration wymaga nowych uprawnień, pierwsze logowanie użytkownika może pokazać jednorazowy ekran zgody ("Aplikacja X chce uzyskać dostęp do..."). To **nie jest logowanie** — to potwierdzenie zgody na uprawnienia, pojawia się raz na użytkownika. Po zaakceptowaniu kolejne logowania są już w pełni silent.

Jeśli scope wymaga zgody administratora tenant (np. uprawnienia typu `User.Read` do Microsoft Graph), trzeba to wcześniej zgłosić i uzyskać zgodę admina BGK — w przeciwnym razie logowanie może się nie powiedzie dla zwykłych użytkowników.

---

## Żródło kodu Portal-AI

W razie pytań technicznych dotyczących integracji — zespół Portalu AI, repozytorium `agents_h` (gałąź `dev2`).
