# Auditoría maestra de estabilidad — WaitMe

**Fecha:** 2026-03-07

---

## 1. Estado general

| Área | Estado | Notas |
|------|--------|-------|
| Boot | OK | MissingEnvScreen, ErrorBoundary, try/catch en main |
| Web | OK | App carga, smoke tests pasan |
| Simulator | OK | ios-run.sh lanza correctamente |
| iPhone físico | No validado | Requiere dispositivo conectado |
| OAuth Google iOS | ROTO | No vuelve a la app tras login |
| CI | Verde con skips | 15 passed, 22 skipped en webkit |
| Vercel | Estable | Build correcto |
| Ubicación | Frágil | Múltiples fuentes, posible race |
| Mapa | Markers DOM | Sin GeoJSON source/layer escalable |
| Mac caliente | Sí | Vite + Simulator + Mapbox + Cursor |

---

## 2. Qué está bien

- **Arquitectura:** Adapters → Supabase, no llamadas directas
- **Auth web:** Login con Google funciona
- **Boot:** runtimeConfig, MissingEnvScreen, ErrorBoundary con recovery
- **Regla coches:** carsMovementStore, solo 1 coche dinámico en WaitMe activo
- **Pipeline ubicación:** fraud → movement → kalman → smoothing → map matching
- **transactionEngine:** arrival confidence, release-payment
- **CI básica:** lint, typecheck, build, Playwright

---

## 3. Qué está mal

| Problema | Causa | Prioridad |
|----------|-------|-----------|
| OAuth no vuelve en iOS | redirect capacitor://localhost; Safari no handoff; Supabase Redirect URLs | P0 |
| Mac calienta | Vite HMR + Simulator + Mapbox WebGL + logs | P1 |
| Emails CI/Supabase/Vercel | Jobs fallidos, tests skipped, migraciones | P1 |
| Ubicación imprecisa | Race getPreciseInitialLocation vs locationEngine; Mapbox recentra con posición vieja | P0 |
| Tests skipped | 22 skipped; layout/viewport en headless | P2 |

---

## 4. Qué sobra

- **quarantine/:** Código legacy; no se usa
- **docs obsoletos:** Muchos CODEBASE_EXPORT_PART_*, auditorías duplicadas
- **RENDER_LOG:** ~11 archivos con logs en DEV; algunos agresivos
- **mockNavigateCars, mockOviedoAlerts:** Demo; mantener pero documentar

---

## 5. Qué está duplicado

- **locationFraudDetector:** lib/location vs locationPipeline
- **locationMovementValidator:** idem
- **MapboxMap vs ParkingMap:** Home usa MapboxMap; Navigate usa ParkingMap
- **vehicleIcons:** getCarWithPriceHtml, getCarIconHtml en ambos mapas

---

## 6. Qué es frágil

- **Ubicación inicial:** MapboxMap tiene su propio watchPosition además de locationFromEngine
- **OAuth iOS:** Depende de Safari handoff a capacitor://
- **Layout tests:** Pixel-perfect en headless; skip en CI
- **Supabase migrations:** Workflow deshabilitado; emails si se activa

---

## 7. Qué impide 10/10

1. OAuth Google en iOS no funcional
2. Ubicación con posibles races
3. Mapa con markers DOM (no escalable)
4. Logs y re-renders en dev
5. Tests con muchos skips
6. Documentación dispersa
