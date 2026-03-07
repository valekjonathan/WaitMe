# Auditoría Final Completa — WaitMe

Fecha: 2025-03-07

---

## 1. ESTRUCTURA GENERAL

### Árbol de carpetas

```
src/
├── App.jsx, Layout.jsx, main.jsx
├── config/          — alerts.js
├── core/            — ErrorBoundary.jsx
├── data/            — adapters (alerts, chat, notifications, profiles, transactions, uploads, userLocations)
├── dev/             — diagnostics.js, layoutInspector.js
├── diagnostics/     — MissingEnvScreen, SafeModeShell
├── hooks/           — useMyAlerts.js, useProfileGuard.ts
├── lib/             — AuthContext, mapLayoutPadding, supabaseClient, vehicleIcons, etc.
├── components/      — MapboxMap, CreateMapOverlay, CreateAlertCard, CenterPin, MapZoomControls, etc.
├── pages/           — Home, History, Chat, Chats, Login, Navigate, Profile, Settings, etc.
├── services/        — *Supabase.js (alerts, chat, notifications, profiles, transactions, uploads, userLocations)
├── system/          — layout (AppDeviceFrame, MapLayer, OverlayLayer), map (MapScreenPanel, MapViewportShell)
├── types/           — global.d.ts
├── utils/           — carUtils.js, index.ts
└── styles/          — no-zoom.css

tests/               — smoke, visual, layout, contracts
scripts/             — dev-ios, ios-run, pwa-icon-validator, environment-guard, etc.
docs/                — 90+ archivos .md
quarantine/          — código legacy (hooks, realtime, componentes antiguos)
```

### Componentes críticos

| Componente | Función |
|------------|---------|
| MapboxMap | Mapa fullscreen, GPS, marcadores, ResizeObserver |
| CreateMapOverlay | Overlay "Estoy aparcado aquí", CreateAlertCard, CenterPin, MapZoomControls |
| CreateAlertCard | Tarjeta con Ubícate, AddressAutocompleteInput, sliders precio/tiempo |
| MapViewportShell | MapLayer + OverlayLayer, geometría del mapa |
| MapScreenPanel | Posición tarjeta (gap 20px, padding) |

---

## 2. CÓDIGO MUERTO O SOBRANTE

### Archivos no usados (Knip)

- `src/system/map/index.js` — exporta MapScreenShell, MapScreenPanel, MapViewportShell; nadie importa desde el index
- `src/system/map/MapScreenShell.jsx` — deprecated, re-export de MapViewportShell; no se usa

### Props no usadas

- `CreateMapOverlay`: recibe `onUseCurrentLocation` de Home pero no lo usa
- `CreateAlertCard`: recibe `useCurrentLocationLabel` pero no lo usa

### Funciones no usadas en CreateAlertCard

- `flyToCoords` — definida pero no llamada (handleLocate hace easeTo inline)
- `fallbackToMapCenter` — definida pero no llamada

### Duplicidad reverse geocode

- `src/lib/reverseGeocode.js` — usado por CreateAlertCard
- `Home.jsx` líneas 266-277 — implementación inline idéntica
- Al llamar `onRecenter`, Home ejecuta su `reverseGeocode`; CreateAlertCard también llama al de lib → doble fetch

### quarantine/

- 21 archivos legacy; no se usan en la app activa
- Mantener por historial; no eliminar sin decisión explícita

---

## 3. ARQUITECTURA

### Separación de responsabilidades

- **Correcta**: data/ → services/, componentes → adapters
- **Props drilling**: mapRef pasa Home → CreateMapOverlay → CreateAlertCard; necesario para Ubícate

### Duplicidad mapa

- MapboxMap (Home) y ParkingMap (Navigate, modos search/create) — distintos casos de uso; no duplicidad real

### Lógica repartida

- Geolocalización: MapboxMap (GPS interno), Home (watchPosition, getCurrentLocation), CreateAlertCard (handleLocate)
- Reverse geocode: Home y CreateAlertCard; duplicado

---

## 4. MAPA Y MAPBOX

### Flujo recenter / flyTo / easeTo

| Origen | Destino | Cuándo |
|--------|---------|--------|
| MapboxMap useEffect | map.easeTo | useCenterPin + mapReady → auto-fly a effectiveCenter |
| CreateAlertCard handleLocate | map.easeTo | Al pulsar Ubícate |
| Home handleStreetSelect | mapRef.current?.flyTo | Al seleccionar dirección en search |
| MapZoomControls | map.easeTo | Zoom +/- |

### Problema detectado

**MapboxMap líneas 316-343**: Cuando `useCenterPin` es true (modo create), el mapa hace `easeTo` automático a la ubicación del usuario cada vez que cambia `effectiveCenter`. Eso provoca que **el mapa se mueva al entrar** en modo create, en contra del comportamiento deseado.

### Padding

- `getMapLayoutPadding()` en mapLayoutPadding.js — fuente única
- CreateAlertCard lo usa en handleLocate
- MapboxMap lo usa en flyToUser y en el useEffect de useCenterPin

---

## 5. UBICACIÓN / GEOLOCALIZACIÓN

### Dónde se pide geolocalización

| Archivo | Uso |
|---------|-----|
| MapboxMap.jsx:118 | getCurrentPosition al montar (location inicial) |
| MapboxMap.jsx:144 | watchPosition continuo |
| Home.jsx:298 | getCurrentLocation (one-shot para mirilla) |
| Home.jsx:321 | getCurrentPosition inicial (baja precisión) |
| Home.jsx:336 | watchPosition (alta precisión) |
| CreateAlertCard.jsx:57 | getCurrentPosition en handleLocate (Ubícate) |
| Chats.jsx:265 | getCurrentPosition |
| Navigate.jsx | getCurrentPosition |

### Dónde se guarda / actualiza

- `selectedPosition` — Home (useState)
- `userLocation` — Home (useState)
- `address` — Home (useState), actualizado por reverseGeocode

### Dónde reverse geocode

- Home.jsx: reverseGeocode inline (Nominatim)
- CreateAlertCard: @/lib/reverseGeocode (Nominatim) — duplicado con handleRecenter

### Flujo Ubícate (trazado completo)

1. Usuario pulsa botón LocateFixed en CreateAlertCard
2. `handleLocate` ejecuta
3. `window.__WAITME_MAP__ = mapRef.current` (para tests)
4. `navigator.geolocation.getCurrentPosition(success, error, opts)`
5. Success callback:
   - `onRecenter({ lat, lng })` → Home.handleRecenter → setSelectedPosition + reverseGeocode
   - `reverseGeocode(lat, lng)` (lib) → **duplicado**, handleRecenter ya lo hace
   - `onAddressChange(address)` → setAddress
   - `map.easeTo({ center, zoom: 17, padding })`

### Causa raíz Ubícate (corregida 2025-03-07)

1. **Mapa se mueve al entrar**: MapboxMap useEffect (líneas 316-343) con `useCenterPin` hacía `easeTo` automático a `effectiveCenter` cada vez que cambiaba la ubicación GPS. No había forma de desactivarlo en modo create. **Fix**: prop `skipAutoFlyWhenCenterPin`; Home pasa `true` cuando `mode === 'create'`.

2. **Doble reverse geocode**: handleRecenter ya llama reverseGeocode; CreateAlertCard también lo hacía. **Fix**: eliminado de CreateAlertCard; handleRecenter es la única fuente.

3. **Código muerto**: flyToCoords, fallbackToMapCenter, reverseGeocode.js (lib) no se usaban. **Fix**: eliminados.

---

## 6. VISUAL / LAYOUT

### Riesgos

- gap tarjeta/nav: 20px — MapScreenPanel, mapLayoutPadding
- pin centrado: (headerBottom + cardTop) / 2 — CenterPin, CreateMapOverlay
- Tests: layout-map-create.spec.js, tests/layout/map-layout.spec.js

### Safe areas

- globals.css: --bottom-nav-h, env(safe-area-inset-*)
- mapLayoutPadding usa header y nav del DOM

---

## 7. ENTORNO / AUTOMATIZACIÓN

### Herramientas activas

- ESLint, Prettier, TypeScript (tsc --noEmit)
- Husky + lint-staged (prettier, eslint, typecheck)
- Playwright (E2E, smoke, layout, visual)
- Vitest (contracts, Storybook)
- Biome (lint:fast)
- Turbo (cache)
- Dependabot
- Sentry (si VITE_SENTRY_DSN)
- PWA validator, env guard

### CI

- lint → typecheck → build → Playwright

---

## 8. RECOMENDACIONES

### Prioridad alta

1. **Ubícate**: Añadir prop `skipAutoFlyWhenCenterPin` a MapboxMap para no mover mapa al entrar en create.
2. **CreateAlertCard**: Eliminar reverseGeocode y onAddressChange duplicados; handleRecenter ya lo hace.
3. **CreateAlertCard**: Eliminar flyToCoords y fallbackToMapCenter no usadas.

### Prioridad media

4. Eliminar props no usadas (onUseCurrentLocation, useCurrentLocationLabel).
5. Mantener MapScreenShell/index por compatibilidad; documentar como deprecated.

### Prioridad baja

6. Revisar dependencias no usadas (knip) — muchas son de shadcn/ui; no eliminar sin verificar.
7. **quarantine/**: Mantener. Ya documentado en quarantine/README.md. Contiene código legacy de referencia (ErrorBoundary, hooks, logger, etc.). No eliminar sin decisión explícita.

### Home.jsx — Cambio realizado (justificado)

**Cambio**: Se añadió `skipAutoFlyWhenCenterPin={mode === 'create'}` a MapboxMap.

**Justificación**: Imprescindible para cumplir el requisito "el mapa NO se mueve al entrar". MapboxMap tiene un useEffect que hace `easeTo` automático cuando `useCenterPin` es true. Home es el único componente que conoce `mode`. No es posible mover esta lógica fuera de Home sin pasar el mode desde Home. Es un cambio mínimo (una línea, solo paso de prop).
