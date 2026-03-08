# Auditoría CI y Pagos Final — WaitMe

**Fecha:** 2026-03-07

---

## 1. GitHub Actions

### Workflow activo: `.github/workflows/ci.yml`

| Step | Comando | Qué hace |
|------|---------|----------|
| Lint | `npm run lint` | ESLint. 0 errores, 32 warnings (unused vars). |
| Typecheck | `npm run typecheck` | tsc --noEmit |
| Build | `npm run build` | Vite build |
| Playwright | `npx playwright test` | E2E tests |

### Secrets requeridos
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN`

### Causas típicas de CI failed
1. **Lint:** Errores ESLint (actualmente 0).
2. **Typecheck:** Errores TypeScript.
3. **Build:** Falta de env vars o errores de compilación.
4. **Playwright:** Tests que fallan por timing, visibilidad o login.

---

## 2. Por qué llegan emails de CI failed

- GitHub envía notificación cuando un push/PR falla en `main`.
- El job que falla aparece en el email y en la pestaña Actions.

### Cómo identificar el job que falla
1. GitHub → Repo → Actions.
2. Click en el workflow fallido.
3. Ver qué step (Lint, Typecheck, Build, Playwright) falló.

### Cómo arreglar
- **Lint:** Corregir errores o desactivar regla con justificación.
- **Typecheck:** Corregir tipos.
- **Build:** Verificar secrets en Settings → Secrets. En CI las env se inyectan; si faltan, build falla.
- **Playwright:** Revisar logs. Muchos tests tienen `test.skip(!!process.env.CI)` o `test.skip(true)` que ocultan problemas. Arreglar la causa real (ej. selectores, timing) en lugar de skip.

---

## 3. Vercel

- Deploy automático en push a `main`.
- Requiere las mismas env vars en Vercel: Project Settings → Environment Variables.
- Si `VITE_MAPBOX_TOKEN` o Supabase faltan, el build puede fallar o la app no funcionará en producción.

### Cómo dejar de recibir emails de Vercel failed
1. Arreglar la causa (build, env).
2. O desactivar notificaciones en Vercel si no se usan deploys automáticos.

---

## 4. Tests con skip

| Archivo | Tests skip | Motivo |
|---------|------------|--------|
| layout-map-create.spec.js | 2 | Geometría card-nav (skip en CI) |
| map-layout.spec.js | 1 | Geometría |
| measure-card-nav-gap.spec.js | 2 | Geometría, botón no visible |
| create-card-position.spec.js | 2 | Screenshot, botón |
| map-shell-unified.spec.js | 3 | Login en curso |
| verify-ubicate-button.spec.js | 1 | Home no visible |
| create.spec.js | 4 | Varios |

**Recomendación:** No tapar con skip. Arreglar selectores, estabilizar timing o marcar como flaky con retries.

---

## 5. Stripe y Supabase Edge Functions

- **Stripe:** stripeService.js. Integración para pagos.
- **release-payment:** Edge Function para liberar pago.
- **map-match:** Edge Function para Map Matching (Mapbox API). Requiere `MAPBOX_SECRET_TOKEN` en Supabase.

---

## 6. Resumen de acciones

1. Configurar secrets en GitHub (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN).
2. Configurar env vars en Vercel igual que en GitHub.
3. Revisar tests con skip y arreglar causa raíz.
4. Para Map Matching: desplegar map-match y configurar MAPBOX_SECRET_TOKEN en Supabase.
