# Auditoría Maestra Final — WaitMe

**Fecha:** 2026-03-07

---

## 1. Arquitectura general

### Estado
- **Frontend:** React + Vite + Tailwind. Mobile-first.
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage).
- **Mapas:** Mapbox GL JS. Una instancia MapboxMap en Home; ParkingMap en modos search/create y Navigate.
- **Estado:** React Query, Zustand (carsMovementStore, finalizedAtStore).

### Fortalezas
- Capas separadas: data → services → Supabase.
- Pipeline de ubicación profesional (fraud → kalman → smoothing → map matching).
- getPreciseInitialLocation con alta precisión y reintentos.

### Debilidades
- **transactionEngine duplicado:** `lib/transactionEngine.js` (balance, finalize) vs `lib/transaction/transactionEngine.js` (proximidad). Nombres confusos.
- **Map Matching:** locationMapMatcher sigue siendo identity; no conecta a Mapbox API real.

---

## 2. Pantallas

| Pantalla | Estado | Notas |
|----------|--------|-------|
| Home | OK | Núcleo. Modos search/create. 20 coches mock en search. |
| Navigate | Parcial | Usa DEMO_ALERTS (6) o Supabase. Sin modo browse 20 coches. |
| History | OK | Lógica compleja. |
| Chat/Chats | OK | Demo + real. |
| Profile, Settings, Notifications | OK | |

---

## 3. Layout y mapa

- **HOME:** Sin scroll de pantalla. Mapa fijo.
- **CREATE:** Sin scroll. Mapa se mueve con tarjeta.
- **NAVIGATE (search):** Mapa con 20 coches. Usuario más cercano por defecto.
- **MapboxMap:** Solo en Home. ParkingMap en overlays y Navigate.
- **Overlays:** CreateMapOverlay, SearchMapOverlay.

---

## 4. Flujo de ubicación

### Ubicación inicial
- `getPreciseInitialLocation`: getCurrentPosition high accuracy, 3 reintentos si accuracy > 50m.
- Usado en: MapboxMap, CreateAlertCard, Home (mirilla).

### Pipeline
- `LocationEngineStarter` arranca `startLocationEngine({ pipeline: true })`.
- Cadena: GPS raw → fraud → movement validator → kalman → smoothing → **map matching (identity)** → output.
- Un solo watcher. Sin listeners duplicados.

### Pendiente
- Map Matching real (API Mapbox o Supabase map-match).

---

## 5. Flujo de pagos

- `transactionEngine.js`: finalize, OUTCOME, balance.
- `transaction/transactionEngine.js`: startTransactionMonitoring, stopTransactionMonitoring.
- Proximidad ≤5m estables → pago liberado.
- Stripe: stripeService.js. Edge Function release-payment.

---

## 6. CI / Deploy

- **Workflow:** `.github/workflows/ci.yml` (lint, typecheck, build, Playwright).
- **Secrets:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN.
- **Vercel:** Posibles fallos por env vars o build.

### Tests con skip
- `layout-map-create.spec.js`: geometría (skip en CI).
- `map-layout.spec.js`: geometría.
- `measure-card-nav-gap.spec.js`: geometría, botón no visible.
- `create-card-position.spec.js`: screenshot, botón.
- `map-shell-unified.spec.js`: Login en curso.
- `verify-ubicate-button.spec.js`: Home no visible.
- `create.spec.js`: 4 tests skip.

---

## 7. Código muerto / duplicidades

| Elemento | Estado |
|---------|--------|
| transactionEngine (2 módulos) | Duplicado por función; no por código. |
| quarantine/ | Código desactivado. |
| mockOviedoAlerts, mockNearby | Usados en demo. |
| locationSmoothing (lib) vs locationSmoothingAdvanced (pipeline) | Pipeline usa advanced. |
| locationFraudDetector (lib) vs (pipeline) | Pipeline tiene su propio. |

---

## 8. Qué sobra

- Tests con skip que tapan problemas.
- Docs obsoletos (muchos en docs/).
- quarantine/ sin limpieza.

---

## 9. Qué debe unificarse

- Nomenclatura transactionEngine (balance vs proximidad).
- Map Matching: conectar identity → API real.

---

## 10. Qué sigue frágil

- CI: Playwright puede fallar por timing o visibilidad.
- Vercel: env vars deben coincidir.
- Map Matching: sin integración real.

---

## 11. Qué impide 10/10

1. Map Matching en identity.
2. Navigate sin modo browse 20 coches (solo alertId).
3. Tests con skip sin resolver causa.
4. Emails CI/Vercel failed sin diagnóstico claro.
