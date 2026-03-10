# iOS OAuth Runtime — Causa Raíz y Corrección

---

## 1. Causa raíz del error "Error cargando WaitMe"

**Síntoma:** Tras volver desde Safari/OAuth en iPhone físico, la app mostraba "Error cargando WaitMe" (ErrorBoundary).

**Causa:** Race condition entre:
1. `initOAuthCapture()` — procesa `getLaunchUrl()` y `processOAuthUrl()` de forma asíncrona (fire-and-forget)
2. Montaje de React y `AuthContext` — ejecuta `getSession()` al iniciar

Cuando la app se abre por deep link `com.waitme.app://auth/callback?code=xxx`:
- React montaba antes de que `processOAuthUrl` terminara
- `getSession()` devolvía null (la sesión aún no estaba en Preferences)
- Se renderizaba Login
- Luego `exchangeCodeForSession` + `setSession` completaban
- `onAuthStateChange` SIGNED_IN disparaba `applySession`
- Transición a Home — algún componente del árbol lanzaba durante el render (posible estado intermedio o dependencia no lista)
- ErrorBoundary capturaba → "Error cargando WaitMe"

**Componente que mostraba el error:** `src/core/ErrorBoundary.jsx` (línea 59).

---

## 2. Qué se corrigió

**Archivos modificados:**
- `src/lib/oauthCapture.js` — `initOAuthCapture()` ahora retorna una Promise que resuelve cuando el launch URL (si existe) fue procesado
- `src/main.jsx` — En native, se espera a que `initOAuthCapture()` complete (o timeout 2.5s) antes de montar React

**Flujo corregido:**
1. App abre por deep link
2. `main.jsx` llama `initOAuthCapture()` y espera (Promise.race con 2.5s)
3. `getLaunchUrl()` devuelve la URL
4. `processOAuthUrl()` ejecuta `exchangeCodeForSession`, `setSession`
5. Sesión queda en Capacitor Preferences
6. Solo entonces se monta React
7. `AuthContext` ejecuta `getSession()` — ya tiene sesión
8. Se renderiza Home directamente, sin transición ni race

---

## 3. Flujo oficial limpio de instalación iPhone

```bash
npm run ios:device
```

Pasos internos:
1. Limpiar env (sin CAPACITOR_USE_DEV_SERVER)
2. Build web
3. Generar iconos iOS (`npm run icons:ios`)
4. Sync Capacitor (cap-sync-clean)
5. Verificar: no server block en capacitor.config.json
6. Abrir Xcode

En Xcode: seleccionar iPhone físico y Run.

---

## 4. Cómo verificar que quedó bien

| Verificación | Comando / Acción |
|--------------|------------------|
| Sin server.url | `grep -q '"server"' ios/App/App/capacitor.config.json && echo "MAL" || echo "OK"` |
| OAuth callback | Login → Google → completar → debe volver a Home sin error |
| Logs | Console.app: `[AUTH FINAL 1]`, `[AUTH FINAL 2] exchange success` |
| Redirect URL Supabase | `com.waitme.app://auth/callback` en Dashboard |

---

## 5. Configuración OAuth requerida

- **redirectTo (iOS):** `com.waitme.app://auth/callback`
- **skipBrowserRedirect:** true
- **Captura:** `oauthCapture.js` vía `appUrlOpen` y `getLaunchUrl`
- **URL scheme:** com.waitme.app en Info.plist
