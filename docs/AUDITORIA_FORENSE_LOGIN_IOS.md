# Auditoría Forense Login iOS — WaitMe

**Fecha:** 2026-03-09

---

## 1. FLUJO AUDITADO

### Dónde entra el callback OAuth
- **oauthCapture.js**: `appUrlOpen` (Safari vuelve) o `getLaunchUrl` (cold start)
- URL: `com.waitme.app://auth/callback?code=xxx`

### Argumento de exchangeCodeForSession
- **Corregido**: Supabase API espera `code` (string), NO la URL completa
- Se extrae: `params.get('code')` de la URL
- Línea: `exchangeCodeForSession(code)`

### getSession después del exchange
- Se llama tras exchange para verificar y para workaround #1566
- setSession forzado para actualizar headers en iOS

### onAuthStateChange SIGNED_IN
- AuthContext escucha en useEffect
- Si recibe SIGNED_IN + session → applySession(session)

### applySession(session)
- ensureUserInDb(session.user) → appUser
- Si appUser: setUser(appUser)
- Si falla: setUser(session.user) fallback

### ensureUserInDb
- Puede fallar: insert error, select 401, catch
- Fallback: setUser(session.user) evita bloquear login

### Condición exacta que manda a login
- **App.jsx AuthRouter**: `if (!user?.id)` → Login
- user null o user.id undefined → Login

---

## 2. CAUSA RAÍZ IDENTIFICADA

**Hipótesis principal:** Se pasaba `url` (URL completa) a `exchangeCodeForSession` en lugar de `code`. La API de Supabase espera el código extraído, no la URL.

**Corrección aplicada:** Extraer `code` de la URL y pasar `exchangeCodeForSession(code)`.

**Corrección adicional:** Workaround Supabase #1566 — getSession + setSession tras exchange para actualizar headers en iOS.

---

## 3. LOGS FORENSES AÑADIDOS

| Log | Ubicación |
|-----|-----------|
| [AUTH FORENSIC 1] callback received | oauthCapture |
| [AUTH FORENSIC 2] exchange start | oauthCapture |
| [AUTH FORENSIC 3] exchange success/error | oauthCapture |
| [AUTH FORENSIC 4] getSession after exchange | oauthCapture |
| [AUTH FORENSIC 5] SIGNED_IN received | AuthContext onAuthStateChange |
| [AUTH FORENSIC 6] applySession start | AuthContext |
| [AUTH FORENSIC 7] ensureUserInDb start | AuthContext |
| [AUTH FORENSIC 8] ensureUserInDb success/error | AuthContext |
| [AUTH FORENSIC 9] setUser called | AuthContext |
| [AUTH FORENSIC 10] final user id | AuthContext |
| [AUTH FORENSIC 11] router -> login/home | App AuthRouter |
| [AUTH FORENSIC 12] exact redirect reason | App AuthRouter |
