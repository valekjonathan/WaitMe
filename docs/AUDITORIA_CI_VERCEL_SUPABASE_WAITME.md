# Auditoría CI / Vercel / Supabase — WaitMe

**Fecha:** 2026-03-07

---

## 1. CI (.github/workflows/ci.yml)

| Paso | Comando | Estado |
|------|---------|--------|
| Lint | npm run lint | OK (0 warnings) |
| Typecheck | npm run typecheck | OK |
| Build | npm run build | OK |
| Playwright | npx playwright test | 24 passed, 13 skipped |

**Secrets requeridos:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

---

## 2. Tests skipped (justificación)

| Test | Motivo |
|------|--------|
| layout/map-layout | Gap/pin en CI: geometría variable en webkit-mobile |
| layout-map-create | Pin/overlay no fiables en headless |
| map realtime | Race en suscripción WebKit |
| smoke/create | Botón no visible (login requerido) |
| visual/* | Screenshots; diferencias de render |
| validation/* | testIgnore en CI |

---

## 3. Emails

| Fuente | Causa | Acción |
|--------|-------|--------|
| GitHub CI failed | Secrets vacíos o tests fallidos | Configurar secrets |
| Supabase migrations | Integración GitHub en Dashboard | Dashboard → Integrations |
| Vercel failed | Build fallido por env | Configurar env en Vercel |

---

## 4. Vercel

- Build: `npm run build`
- Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

---

## 5. Supabase

- Redirect URLs: `npm run supabase:redirect-urls` lista las URLs exactas
- Migraciones: supabase/migrations/ (manual o integración)
