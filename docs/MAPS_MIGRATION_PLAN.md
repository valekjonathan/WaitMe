# WaitMe — Map Migration Plan

Plan para unificar el sistema de mapas. **No modifica código**; solo documenta el plan.

---

## 1. CURRENT MAP INVENTORY

### Components

| File | What it does | Who uses it |
|------|--------------|-------------|
| **MapboxMap** | `src/components/MapboxMap.jsx` | Mapa con clusters de alertas, marcador usuario, geolocation. Usa `useAppStore` (alerts, location). Dynamic import mapbox-gl. | **Home.jsx** (modo logo, `showBackgroundMap`) |
| **ParkingMap** | `src/components/map/ParkingMap.jsx` | Mapa con markers individuales (coches, usuario, vendedor, comprador), rutas OSRM, center pin, click-to-select. Props: alerts, userLocation, selectedAlert, showRoute, sellerLocation, etc. Static import mapbox-gl. | **Home.jsx** (modo search, modo create), **Navigate.jsx** |
| **MapFilters** | `src/components/map/MapFilters.jsx` | Panel de filtros (precio, minutos, distancia). Props: filters, onFilterChange, onClose, alertsCount. | **Home.jsx** (modo search) |
| **SellerLocationTracker** | `src/components/SellerLocationTracker.jsx` | Mini-mapa embebido que muestra usuario + comprador(es) en tiempo real. Base44 ParkingAlert + UserLocation. Crea su propia instancia Mapbox. | **History.jsx** (por cada alerta reservada) |

### Hooks / Services

| File | What it does | Who uses it |
|------|--------------|-------------|
| **useRealtimeAlerts** | `src/hooks/useRealtimeAlerts.js` | Carga alertas de Supabase y suscribe Realtime → `appStore.alerts`. | **Layout.jsx** |
| **useMapMatch** | `src/hooks/useMapMatch.js` | Acumula puntos GPS, llama Edge Function map-match cada 5s. Devuelve `addPoint`, `corrected`. | **Nadie** (no importado) |
| **geohash** | `src/lib/geohash.js` | encode, getNeighborPrefixes. | **alertService.js** (no usado en flujo principal) |

### Data flow summary

| Component | Alerts source | Location source |
|-----------|---------------|-----------------|
| MapboxMap | appStore.alerts (Supabase Realtime) | appStore.location (geolocation watch) |
| ParkingMap (Home search) | searchAlerts (getMockNearbyAlerts) | userLocation (Home state) |
| ParkingMap (Home create) | — | userLocation + center pin |
| ParkingMap (Navigate) | [] | userLocation (Navigate state) + sellerLocation |
| SellerLocationTracker | Base44 ParkingAlert | userLocation (History) + buyerLocations (Base44) |

---

## 2. DECISION

### Single source of truth for map state

**Zustand store (`src/state/appStore.js`)** será la fuente única:

- `alerts.items` — alertas a mostrar en el mapa
- `location` — `{ lat, lng, accuracy }` del usuario
- (Opcional futuro) `mapMode`, `selectedAlert`, `sellerLocation`, `route` si se unifican en el store

Los consumidores de mapa leerán del store en lugar de recibir props locales.

### One map component to keep

**MapboxMap** (`src/components/MapboxMap.jsx`).

Se extenderá para soportar todas las capacidades que hoy tiene ParkingMap:

- Modo clusters (actual) vs modo markers individuales (coches, usuario, vendedor, comprador)
- Rutas OSRM (polyline)
- Center pin + onMapMove / onMapMoveEnd
- Click en mapa para seleccionar posición
- fitBounds para rutas

ParkingMap se eliminará una vez completada la migración (excepto mientras aplique la restricción de no tocar Home.jsx).

---

## 3. REPLACEMENT PLAN (STEP BY STEP)

### Constraint: DO NOT touch `src/pages/Home.jsx`

Home.jsx no se modifica en esta migración. ParkingMap y MapFilters seguirán usándose en Home hasta una fase posterior.

### Order of changes

| Step | Action | Files to change | Rationale |
|------|--------|-----------------|-----------|
| 1 | Crear módulo compartido de mapas | `src/lib/maps/` (nuevo) | Evitar romper nada; solo añadir código. |
| 2 | Extraer carColors, marker HTML, constantes | `src/lib/maps/mapConstants.js`, `src/lib/maps/mapMarkers.js` | Unificar lógica duplicada. |
| 3 | Extender MapboxMap con props opcionales | `src/components/MapboxMap.jsx` | Añadir modo markers, route, center pin, etc. sin romper uso actual en Home. |
| 4 | Añadir map state al appStore (opcional) | `src/state/appStore.js` | selectedAlert, sellerLocation, route, mapMode si se unifican. |
| 5 | Reemplazar ParkingMap por MapboxMap en Navigate | `src/pages/Navigate.jsx` | Navigate es el único consumidor que podemos tocar además de Home. |
| 6 | Refactorizar SellerLocationTracker | `src/components/SellerLocationTracker.jsx` | Usar MapboxMap o módulo compartido; reducir duplicación. |
| 7 | (Futuro) Reemplazar ParkingMap en Home | `src/pages/Home.jsx` | Cuando se levante la restricción. |
| 8 | Eliminar ParkingMap | `src/components/map/ParkingMap.jsx` | Tras migrar todos los consumidores. |

### Exact file list to change (por paso)

**Paso 1–2: Crear módulo compartido**

- Crear: `src/lib/maps/mapConstants.js`
- Crear: `src/lib/maps/mapMarkers.js`
- Crear: `src/lib/maps/index.js` (re-exports)

**Paso 3: Extender MapboxMap**

- Modificar: `src/components/MapboxMap.jsx`

**Paso 4: appStore (opcional)**

- Modificar: `src/state/appStore.js`

**Paso 5: Navigate**

- Modificar: `src/pages/Navigate.jsx` — sustituir `<ParkingMap ... />` por `<MapboxMap ... />` con las props equivalentes.

**Paso 6: SellerLocationTracker**

- Modificar: `src/components/SellerLocationTracker.jsx` — usar `mapMarkers` y, si se decide, MapboxMap como subcomponente.

**Paso 7–8: (Futuro) Home y eliminación**

- Modificar: `src/pages/Home.jsx`
- Eliminar: `src/components/map/ParkingMap.jsx`
- Revisar: `src/components/map/MapFilters.jsx` (se mantiene; no es un mapa, solo UI de filtros).

---

## 4. DUPLICATED LOGIC CLEANUP

### Duplicados identificados

| Logic | Locations | Propuesta |
|-------|-----------|-----------|
| **carColors** | ParkingMap.jsx, History.jsx, HistorySellerView, HistoryBuyerView, IncomingRequestModal, MarcoCard, UserAlertCard, Notifications, carUtils.js, Profile.jsx | Unificar en `src/utils/carUtils.js` (ya existe `CAR_COLOR_MAP`, `getCarFill`). Eliminar duplicados y usar solo carUtils. |
| **createCarMarkerHtml** | ParkingMap.jsx | Mover a `src/lib/maps/mapMarkers.js`. |
| **createUserLocationHtml** | ParkingMap.jsx, SellerLocationTracker.jsx | Mover a `src/lib/maps/mapMarkers.js`. |
| **createBuyerMarkerHtml** | ParkingMap.jsx, SellerLocationTracker.jsx | Mover a `src/lib/maps/mapMarkers.js`. |
| **createSellerMarkerHtml** | ParkingMap.jsx | Mover a `src/lib/maps/mapMarkers.js`. |
| **OVIEDO_CENTER / defaultCenter** | MapboxMap (OVIEDO_CENTER), ParkingMap ([43.3619, -5.8494]) | Constante única en `src/lib/maps/mapConstants.js`. |
| **DARK_STYLE** | MapboxMap, ParkingMap, SellerLocationTracker | Constante en `src/lib/maps/mapConstants.js`. |
| **Bounds / fitBounds** | ParkingMap (showRoute) | Lógica en MapboxMap o en helper. |
| **Route fetch (OSRM)** | ParkingMap | Mantener en MapboxMap o extraer a `src/lib/maps/routeService.js`. |

### Módulo compartido propuesto

```
src/lib/maps/
├── index.js          # re-exports
├── mapConstants.js   # OVIEDO_CENTER, DEFAULT_ZOOM, DARK_STYLE, etc.
├── mapMarkers.js     # createCarMarkerHtml, createUserLocationHtml, createBuyerMarkerHtml, createSellerMarkerHtml
└── routeService.js   # (opcional) fetchRoute(start, end) → { coords, distance, duration }
```

`carColors` / `getCarFill` ya están en `src/utils/carUtils.js`; `mapMarkers.js` importará `getCarFill` de ahí en lugar de duplicar.

---

## 5. CONSTRAINTS

1. **DO NOT touch `src/pages/Home.jsx`**  
   Home.jsx no se modifica en esta migración. ParkingMap y MapFilters permanecen en Home.

2. **Do not change visuals**  
   Mantener la UI actual. Mismos colores, tamaños, animaciones, layout.

3. **Prefer small changes per commit**  
   Cada paso del plan = 1 commit. No mezclar refactors con nuevas features.

4. **MapFilters**  
   MapFilters no es un componente de mapa; es UI de filtros. Se mantiene y no se sustituye por MapboxMap.

---

## 6. OUTPUT — CHECKLIST

Ejecutar en orden. Cada ítem = una tarea ejecutable con Cursor.

### Fase A: Módulo compartido

- [ ] **A1** Crear `src/lib/maps/mapConstants.js` con: `OVIEDO_CENTER`, `DEFAULT_ZOOM`, `DEFAULT_PITCH`, `DARK_STYLE`.
- [ ] **A2** Crear `src/lib/maps/mapMarkers.js` con: `createCarMarkerHtml`, `createUserLocationHtml`, `createBuyerMarkerHtml`, `createSellerMarkerHtml` (usar `getCarFill` de `carUtils.js`).
- [ ] **A3** Crear `src/lib/maps/index.js` que re-exporte mapConstants y mapMarkers.

### Fase B: Extender MapboxMap

- [ ] **B1** Añadir props opcionales a MapboxMap: `mode` ('clusters' | 'markers'), `showRoute`, `sellerLocation`, `selectedAlert`, `onAlertClick`, `useCenterPin`, `onMapMove`, `onMapMoveEnd`, `isSelecting`, `selectedPosition`, `setSelectedPosition`, `buyerLocations`, `userPhotoHtml`, `sellerPhotoHtml`, `onRouteLoaded`.
- [ ] **B2** Implementar modo `markers` en MapboxMap (usar markers desde `mapMarkers.js` cuando `mode === 'markers'`).
- [ ] **B3** Implementar capa de ruta OSRM en MapboxMap cuando `showRoute` y hay `sellerLocation` o `selectedAlert`.
- [ ] **B4** Implementar `useCenterPin` + `onMapMove` / `onMapMoveEnd` en MapboxMap.
- [ ] **B5** Implementar `isSelecting` + click en mapa para `setSelectedPosition` en MapboxMap.
- [ ] **B6** Implementar `fitBounds` cuando hay ruta (user + seller).
- [ ] **B7** Soportar `alerts` por props cuando se pasen (para Navigate/Home) además de `useAppStore`.

### Fase C: Migrar Navigate

- [ ] **C1** En `Navigate.jsx`, sustituir import de `ParkingMap` por `MapboxMap`.
- [ ] **C2** Sustituir `<ParkingMap ... />` por `<MapboxMap ... />` con las props equivalentes (alerts, userLocation, selectedAlert, showRoute, sellerLocation, onRouteLoaded, etc.).
- [ ] **C3** Verificar que la UI de Navigate se ve igual (ruta, marcadores, distancia, ETA).

### Fase D: Refactorizar SellerLocationTracker

- [ ] **D1** En `SellerLocationTracker.jsx`, importar `createUserMarkerHtml` y `createBuyerMarkerHtml` desde `src/lib/maps/mapMarkers.js`.
- [ ] **D2** Eliminar las funciones locales duplicadas en SellerLocationTracker.
- [ ] **D3** (Opcional) Evaluar si SellerLocationTracker puede usar MapboxMap como subcomponente en lugar de crear su propio Map.

### Fase E: Limpieza de carColors (fuera de mapas)

- [ ] **E1** En `ParkingMap.jsx`, reemplazar `carColors` local por import de `getCarFill` desde `carUtils.js`.
- [ ] **E2** Verificar que los colores renderizados coinciden con el resto de la app.

### Fase F: (Futuro) Migrar Home y eliminar ParkingMap

- [ ] **F1** Cuando se levante la restricción: en `Home.jsx`, sustituir `ParkingMap` por `MapboxMap` en modo search.
- [ ] **F2** En `Home.jsx`, sustituir `ParkingMap` por `MapboxMap` en modo create.
- [ ] **F3** Eliminar `src/components/map/ParkingMap.jsx`.
- [ ] **F4** Eliminar import de ParkingMap en Home.jsx.
- [ ] **F5** Verificar que MapFilters sigue funcionando con MapboxMap en Home.

### Fase G: useMapMatch (opcional)

- [ ] **G1** Si `useMapMatch` no se usa: documentar como dead code o eliminarlo.
- [ ] **G2** Si se usará: integrar en Navigate o en el flujo de ubicación del mapa.

---

*Documento generado sin modificar código.*
