# Validación Login Google en Simulator — Checklist

**Fecha:** 2026-03-07

---

## Requisitos previos

1. **Supabase Dashboard** → Authentication → URL Configuration → Redirect URLs:
   - `com.waitme.app://auth/callback`
   - `com.waitme.app://`
   - `capacitor://localhost`
   - `http://localhost:5173`
   - `http://localhost:5173/`

2. **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 Client IDs:
   - El redirect URI de Supabase (ej. `https://xxx.supabase.co/auth/v1/callback`) debe estar en Authorized redirect URIs

3. **Supabase** → Authentication → Providers → Google: habilitado

---

## Bypass DEV mock (obligatorio para probar login real)

En desarrollo, AuthContext usa usuario mock y no llama a Supabase. Para probar Google:

```bash
VITE_DEV_BYPASS_AUTH=true npm run dev
```

O en `.env.local`:
```
VITE_DEV_BYPASS_AUTH=true
```

---

## Pasos de validación

1. **Arrancar app en Simulator:**
   ```bash
   VITE_DEV_BYPASS_AUTH=true npm run dev
   # En otra terminal:
   CAPACITOR_USE_DEV_SERVER=true npx cap run ios
   ```

2. **Pulsar "Continuar con Google"** en la pantalla de Login

3. **Completar login** en Safari (cuenta Google)

4. **Verificar:** La app vuelve al foreground y muestra Home (no Login)

5. **Verificar sesión:** En consola o DevTools, `getSession` debe devolver sesión válida

---

## URLs que debe aceptar processOAuthUrl (App.jsx)

- `com.waitme.app://auth/callback`
- `com.waitme.app://`
- `capacitor://localhost`
- `http://localhost:5173`
- `http://localhost:5173/`

---

## Si falla

| Síntoma | Archivo | Causa | Fix |
|---------|---------|-------|-----|
| No vuelve a la app | Info.plist | CFBundleURLSchemes | Verificar scheme `com.waitme.app` |
| No vuelve | Supabase | Redirect URL no configurada | Añadir en Dashboard |
| exchangeCodeForSession error | App.jsx | code inválido o expirado | Verificar PKCE; flowType en supabaseClient |
| Sesión null tras redirect | AuthContext | onAuthStateChange no dispara | Verificar que exchangeCodeForSession se ejecutó |

---

## Debug

Con `VITE_DEBUG_OAUTH=true` o en DEV, App.jsx loguea:
- `[OAuth] processOAuthUrl called`
- `[OAuth] exchangeCodeForSession executing...`
- `[OAuth] exchangeCodeForSession OK`
