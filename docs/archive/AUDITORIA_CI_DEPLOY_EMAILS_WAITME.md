# Auditoría CI / Deploy / Emails — WaitMe

**Fecha:** 2026-03-07

---

## 1. Jobs que fallan hoy

| Job | Estado | Causa |
|-----|--------|-------|
| `.github/workflows/ci.yml` | Verde si secrets OK | Requiere VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN |
| `workflows_disabled/supabase.yml` | Deshabilitado | No se ejecuta; si se activa, migraciones pueden fallar |
| Vercel | Verde | Build: npm run build |
| Supabase migrations | Emails si hay integración GitHub | Dashboard Supabase → Project Settings → Integrations |

---

## 2. Tests que rompen CI

En CI (process.env.CI=true):
- **Proyecto:** solo webkit-mobile (iPhone 14)
- **testIgnore:** `**/validation/**`, `**/contracts/**`
- **Resultado:** 15 passed, 22 skipped

Tests que hacen `test.skip(!!process.env.CI)`:
- layout/map-layout: gap, pin
- layout-map-create: gap, pin, medidas, zoom, Ubícate
- map: realtime
- smoke/create: algunos en webkit
- smoke/safe-mode
- visual/*
- validation/* (excluido por testIgnore)

---

## 3. Skips y justificación

| Skip | Justificación |
|------|---------------|
| Layout pixel-perfect | Viewport/geometría distinta en headless webkit |
| Ubícate / __WAITME_MAP__ | Geolocation mock no actualiza mapa en headless |
| Realtime | Race en suscripción WebKit |
| Safe mode | Requiere VITE_SAFE_MODE; webServer no lo pasa en CI |
| Visual screenshots | Diferencias de render entre entornos |
| Validation drag/scroll | testIgnore en CI; inestable en headless |

---

## 4. Cómo dejar de recibir emails

### 4.1 GitHub Actions
- **CI failed:** Configurar secrets (VITE_SUPABASE_URL, etc.). Si faltan, build falla.
- **Desactivar emails:** GitHub → Repo → Settings → Notifications → desmarcar "Actions" si no quieres emails.

### 4.2 Supabase
- **Migrations failed:** Si usas Supabase GitHub Integration, los emails vienen de ahí.
- **Desactivar:** Supabase Dashboard → Project Settings → Integrations → desvincular o desactivar notificaciones.

### 4.3 Vercel
- **Deploy failed:** Revisar build logs; suele ser env vars.
- **Desactivar emails:** Vercel → Project → Settings → Notifications.

---

## 5. Acciones recomendadas

1. **Secrets GitHub:** Confirmar que los 3 secrets están configurados.
2. **Supabase Redirect URLs:** Añadir `capacitor://localhost` y `com.waitme.app://` para OAuth.
3. **workflows_disabled:** Mantener supabase.yml deshabilitado hasta tener migraciones estables.
4. **Emails:** Si siguen llegando, identificar fuente exacta (GitHub/Supabase/Vercel) y desactivar en ese servicio.
