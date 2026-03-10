# Google Login iOS — Auditoría Específica

---

## 1. Supabase Google Auth

- **Provider:** Google OAuth vía Supabase Auth
- **flowType:** pkce
- **redirectTo (iOS):** `com.waitme.app://auth/callback`
- **Código:** Login.jsx usa `signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } })`
- **InAppBrowser:** Abre URL de Google, usuario autentica, redirect a com.waitme.app://auth/callback

### Configuración requerida en Supabase Dashboard

- **Redirect URLs:** Debe incluir `com.waitme.app://auth/callback`
- **Site URL:** Para web; iOS usa redirect explícito
- **Script:** `npm run supabase:redirect-urls` para imprimir URLs
- **Script:** `npm run supabase:ensure-oauth-ios` para verificar OAuth iOS

---

## 2. Capacitor / iOS Deep Link

- **URL scheme:** com.waitme.app (Info.plist CFBundleURLSchemes)
- **Callback path:** /auth/callback → URL completa: com.waitme.app://auth/callback
- **Captura:** oauthCapture.js — `CapacitorApp.addListener('appUrlOpen')` y `getLaunchUrl()`
- **Procesamiento:** processOAuthUrl(url) → extrae `code` de query → exchangeCodeForSession(code)

### Archivos que controlan

- `src/lib/oauthCapture.js` — initOAuthCapture, processOAuthUrl
- `src/pages/Login.jsx` — redirectTo, handleOAuthLogin
- `ios/App/App/Info.plist` — CFBundleURLTypes con com.waitme.app
- `src/lib/supabaseClient.js` — getAuthOptions (storage Capacitor Preferences)

---

## 3. Xcode / iOS Readiness

- **Bundle ID:** com.waitme.app
- **URL scheme:** Registrado en Info.plist
- **Capacitor:** 8.x, InAppBrowser para OAuth
- **Build:** ios:refresh usa VITE_IOS_DEV_BUILD=1, bundle local

### Verificación

- Info.plist tiene CFBundleURLSchemes con "com.waitme.app" ✓
- capacitor.config.json en ios/App/App no tiene server ✓

---

## 4. Bloqueadores Actuales

| Bloqueador | Tipo | Acción |
|------------|------|--------|
| Passkey Google en simulador | Conocido | Bypass: "Entrar en modo test" (loginAsSimulatorTest) |
| Redirect URLs en Supabase | Config externa | Añadir com.waitme.app://auth/callback en Dashboard |
| Validación en iPhone real | Manual | Probar flujo completo y documentar |

---

## 5. Próxima Acción Exacta

1. Abrir Supabase Dashboard → Authentication → URL Configuration
2. Añadir `com.waitme.app://auth/callback` a Redirect URLs si no está
3. Probar en iPhone físico: Login → Continuar con Google → completar OAuth → verificar redirect a app
4. Revisar logs [AUTH FINAL 1-12] en consola si falla
5. Documentar resultado en docs/AUTH_STATUS.md
