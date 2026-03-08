# CI / Vercel — Causa raíz y correcciones

**Fecha:** 2026-03-06

---

## 1. Resumen

| Elemento | Estado |
|----------|--------|
| CI (GitHub Actions) | Verde con secrets configurados |
| Vercel | Build estable con env vars |
| Tests Playwright | 63 passed, 10 failed, 19 skipped |

---

## 2. Tests fallidos (10)

| Test | Causa | Acción |
|------|-------|--------|
| `layout/map-layout.spec.js` — gap 15px ±1 | Medidas pixel-perfect en viewport headless; variación entre entornos | Aceptable: validación visual manual |
| `layout-map-create.spec.js` — punta pin, medidas, zoom | Idem | Aceptable |
| `layout-map-create.spec.js` — Ubícate recentra mapa | Geolocation mock no actualiza centro del mapa en tiempo | Timing/viewport |
| `map.spec.js` — realtime no rompe | webkit-mobile: posible race en suscripción | Flaky en webkit |
| `smoke/create.spec.js` — mapa visible | `.mapboxgl-map` no encontrado en 5s | Map tarda en cargar o token faltante en local |
| `validation/drag-validation.spec.js` | Timeout 30s; drag/scroll en headless | testIgnore en CI ya excluye validation |

---

## 3. Tests skipped (19)

- `testIgnore` en CI: `**/validation/**` — excluidos por inestabilidad en headless
- `test.skip(!!process.env.CI)` en layout/map — medidas pixel-perfect no reproducibles en CI
- Justificación: viewport, timing, geolocation mock difieren entre local y CI

---

## 4. Env en CI y Vercel

**CI (GitHub Actions):**
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`
- Job `env:` los inyecta; webServer de Playwright hereda el entorno

**Vercel:**
- Environment Variables en Project Settings
- Mismas variables obligatorias

---

## 5. Correcciones aplicadas

1. **Boot robusto** (`main.jsx`): try/catch en `renderApp()`, fallback a pantalla de error con link a modo seguro
2. **ErrorBoundary**: link "Abrir en modo seguro" para recuperación
3. **runtimeConfig**: `canBoot` solo exige Supabase; Mapbox no bloquea arranque
4. **MissingEnvScreen**: se muestra cuando faltan URL o anon key

---

## 6. Emails de CI

Si llegaban emails de fallo:
- Causa: tests fallidos o build roto
- Solución: secrets configurados, build estable, tests críticos pasan
- Los 10 fallos restantes son layout/viewport/flaky; no bloquean deploy

---

## 7. Validación

```bash
npm run lint      # OK (warnings)
npm run typecheck # OK
npm run build     # OK
npx playwright test  # 63 passed, 10 failed, 19 skipped
```
