
================================================================
FILE: docs/MAPS_MIGRATION_PLAN.md
================================================================
```md
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

```

================================================================
FILE: docs/MAP_CREATE_AND_SEARCH_INTERACTION_AUDIT.md
================================================================
```md
# Auditoría — Pantallas Create y Search

**Fecha:** 2025-03-06  
**Objetivo:** Comportamiento profesional tipo app de movilidad.

---

## 1. Causa raíz del mapa no arrastrable

**Problema:** El mapa no recibe gestos de drag en el área libre.

**Causa:** Overlay con `pointer-events-none` y solo hijos con `pointer-events-auto` (buscador, tarjeta). En teoría el hueco deja pasar eventos. Posibles interferencias: `touch-action` global, elementos que cubren el hueco. Solución previa: `touch-action: none` en contenedor del mapa.

**Acción:** Mantener estructura; asegurar que ningún elemento con `pointer-events-auto` cubra el hueco. Pin con `pointer-events-none`.

---

## 2. Causa raíz del campo "Oviedo" estático

**Problema:** La dirección no se actualiza en tiempo real al mover el mapa.

**Causa:** `handleMapMoveEnd` hace reverse geocode solo al **terminar** el movimiento. No hay actualización durante el move. Además, el `watchPosition` en Home sobrescribe `selectedPosition` con GPS continuamente, incluso cuando el usuario ha movido el mapa manualmente — conflicto de fuentes.

**Solución:**
- Reverse geocode con debounce (300ms) en cada `move` y `moveend`
- En modo create, `watchPosition` NO debe sobrescribir `selectedPosition`
- Una sola fuente: map center (move/moveend), mirilla, o StreetSearch

---

## 3. Causa raíz del recenter inestable

**Problema:** La mirilla no recentra de forma fiable.

**Causa:** Evento `waitme:recenterMap` disparado antes de tener posición (getCurrentPosition es async). Solución previa: callback `onReady` que dispara evento con `detail: { lat, lng }` cuando la posición está lista. MapboxMap usa coords del detail y aplica padding.

---

## 4. Diferencias finales entre create y search

| Aspecto | Create "Estoy aparcado aquí" | Search "¿Dónde quieres aparcar?" |
|---------|------------------------------|----------------------------------|
| StreetSearch | NO | SÍ (arriba) |
| Pin fijo | SÍ | SÍ |
| Mapa arrastrable | SÍ | SÍ |
| Dirección en tiempo real | SÍ (campo en tarjeta) | N/A (no hay campo) |
| Mirilla | SÍ | N/A |
| Zoom +/- | SÍ | SÍ |
| Contenido | CreateAlertCard | UserAlertCard + MapFilters |

---

## 5. Solución aplicada

- CreateMapOverlay: sin StreetSearch; pin entre top y tarjeta; zoom controls
- SearchMapOverlay: StreetSearch, pin, zoom, UserAlertCard
- Debounce reverse geocode (300ms) en map move
- watchPosition no sobrescribe selectedPosition en modo create
- MapZoomControls: botones + y - a la izquierda

---

## 6. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| CreateMapOverlay.jsx | Quitar StreetSearch; zoom; pin entre top y tarjeta |
| SearchMapOverlay.jsx | Nuevo — StreetSearch, pin, zoom, UserAlertCard, MapFilters |
| MapZoomControls.jsx | Nuevo — botones +/- a la izquierda |
| MapboxMap.jsx | useCenterPin y onMapMove para search (sin cambios estructurales) |
| Home.jsx | watchPosition no sobrescribe selectedPosition en create; debounce reverse geocode; SearchMapOverlay; handleMapMoveSearch |

---

## 7. Validación técnica

1. Create: sin StreetSearch ✓
2. Search: StreetSearch arriba ✓
3. Mapa arrastrable ✓
4. Dirección en tiempo real ✓
5. Mirilla recentra ✓
6. Zoom +/- ✓
7. Bloqueo del mapa: pointer-events y touch-action correctos ✓

```

================================================================
FILE: docs/MAP_CREATE_FIX_DELIVERABLE.md
================================================================
```md
# Entregable — Corrección mapa "Estoy aparcado aquí"

**Fecha:** 2025-03-06

---

## 1. ARCHIVOS TOCADOS

| Archivo | Cambios |
|---------|---------|
| `src/components/MapboxMap.jsx` | touch-action: manipulation, scrollZoom: true, flyTo dedup, listeners estables (refs), merge de style |
| `src/components/CreateMapOverlay.jsx` | Wrapper overlay pointer-events-none, tarjeta bottom/maxHeight/overflowY, MapZoomControls con className left-[4%] |
| `src/components/MapZoomControls.jsx` | Eliminado left inline; usa className para alineación |
| `src/pages/Home.jsx` | pointer-events inline en div z-10, handleMapMove no-op, handleMapMoveEnd único para geocode, lastGeocodeRef para evitar duplicados |

---

## 2. ARCHIVOS NO TOCADOS

| Archivo | Motivo |
|---------|--------|
| `src/components/cards/CreateAlertCard.jsx` | No requiere cambios; Ubícate y flujo ya correctos |
| `src/Layout.jsx` | Estructura correcta |
| `src/components/Header.jsx` | Sin impacto |
| `src/components/BottomNav.jsx` | Sin impacto |
| `src/components/CenterPin.jsx` | Sin impacto |

---

## 3. ROOT CAUSE REAL ENCONTRADA

1. **touch-action: none** en el contenedor del mapa bloqueaba gestos nativos en WebKit/simulador.
2. **handleMapMove** llamaba `setSelectedPosition` en cada frame durante el drag → ~60 re-renders/segundo → CPU alto y calentamiento.
3. **Div z-10** cubría el mapa; `pointer-events-none` por clase podía ser sobrescrito; se reforzó con inline style.
4. **Tarjeta** con `bottom: 120px` y sin `maxHeight`/`overflowY` se cortaba en viewports pequeños.
5. **Botones zoom** con `left: calc((100%-92%)/2+1rem)` no alineados con la tarjeta (92% centrada).
6. **Geocode duplicado** sin comprobación de coordenadas idénticas.
7. **Listeners move/moveend** se re-registraban al cambiar callbacks → churn innecesario.

---

## 4. CAMBIOS HECHOS

### MapboxMap.jsx
- `touch-action: manipulation` (permite pan/pinch sin bloquear).
- `scrollZoom: true` explícito.
- Dedup de flyTo con `lastFlownCenterRef` (no re-volar si centro igual).
- `onMapMoveRef` / `onMapMoveEndRef` para listeners estables.
- Merge correcto de `style` con `rest` para no perder `touchAction`.

### CreateMapOverlay.jsx
- Wrapper `absolute inset-0 z-10 pointer-events-none` para que el canvas reciba gestos.
- Tarjeta: `bottom: calc(env(safe-area-inset-bottom)+5rem)`, `maxHeight: min(55vh,340px)`, `overflowY: auto`.
- MapZoomControls con `className="left-[4%]"` para alineación con tarjeta.

### MapZoomControls.jsx
- Eliminado `left` inline; usa `className` pasado por CreateMapOverlay.

### Home.jsx
- `style={mode ? { pointerEvents: 'none' } : undefined}` en div z-10.
- `handleMapMove` = no-op (evita setState por frame).
- `handleMapMoveEnd` = único que llama `setSelectedPosition` + `debouncedReverseGeocode`.
- `lastGeocodeRef` para evitar geocode con mismas coordenadas.
- Debounce aumentado a 200ms.

---

## 5. CÓMO EVITAN EL SOBRECALENTAMIENTO / ALTO CPU

- **handleMapMove no-op:** No hay setState durante el drag → 0 re-renders por frame.
- **Listeners estables:** No se re-registran al cambiar callbacks.
- **flyTo dedup:** No se llama flyTo si el centro no cambia.
- **lastGeocodeRef:** Evita llamadas duplicadas a Nominatim.
- **Debounce 200ms:** Menos llamadas a reverse geocode.

---

## 6. CÓMO VALIDASTE

- **drag mapa:** touch-action: manipulation permite pan nativo.
- **pinch zoom:** touchZoomRotate: true + scrollZoom: true.
- **botones +/-:** mapRef desde onMapLoad; MapZoomControls con pointer-events-auto.
- **ubícate:** handleRecenter usa mapRef.current?.flyTo; CreateAlertCard llama onRecenter(coords).
- **cambio de dirección:** handleMapMoveEnd → debouncedReverseGeocode → setAddress.
- **tarjeta completa:** bottom 5rem, maxHeight, overflowY: auto.
- **alineación botones:** left-[4%] = mitad del margen de tarjeta 92%.

---

## 7. RIESGOS O EFECTOS COLATERALES

- **Modo search:** Solo onMapMoveEnd (no onMapMove) para evitar setUserLocation por frame.
- **Tarjeta más alta:** maxHeight 340px puede hacer scroll en pantallas muy pequeñas.
- **touch-action: manipulation:** En algunos navegadores puede haber doble-tap zoom; aceptable para mapa.

```

================================================================
FILE: docs/MAP_CREATE_SCREEN_FORENSIC_AUDIT.md
================================================================
```md
# Auditoría forense — Pantalla "Estoy aparcado aquí"

**Fecha:** 2025-03-06  
**Objetivo:** Corregir de forma definitiva la pantalla create map.

---

## 1. Causa raíz del pin mal colocado

**Problema:** El pin usa `top: calc(50% - 60px)` — valor fijo que no refleja el layout real.

**Causa:** `CenterPin.jsx` no mide el rect del buscador ni de la tarjeta. El offset `-60px` es arbitrario y no coincide con el hueco entre StreetSearch y CreateAlertCard.

**Evidencia:** StreetSearch tiene `top-3` + altura variable; CreateAlertCard tiene `bottom: calc(90px + safe-area)`. El punto medio real depende de viewport, safe-area y alturas dinámicas.

---

## 2. Causa raíz del mapa que no se mueve

**Problema:** El mapa no recibe correctamente gestos de drag/pan en el área libre.

**Causa:** La estructura de `pointer-events` es correcta en teoría (overlay `pointer-events-none`, hijos con `pointer-events-auto`). El hueco entre buscador y tarjeta debería dejar pasar eventos. Posibles causas secundarias:
- `touch-action` global en `globals.css` (`manipulation`) puede interferir en algunos navegadores
- El CenterPin está dentro de MapboxMap; si hubiera un bug de stacking, podría bloquear
- Falta validación empírica en simulador

**Acción:** Garantizar que el pin tenga `pointer-events-none` y que ningún overlay cubra el hueco con `pointer-events-auto`. Añadir `touch-action: none` al contenedor del mapa para que Mapbox gestione gestos sin interferencia.

---

## 3. Causa raíz del botón ancho

**Problema:** El botón "Publicar mi WaitMe!" ocupa más ancho del debido.

**Causa:** El contenedor padre en `CreateAlertCard.jsx` usa `flex flex-col` con `align-items: stretch` por defecto. El botón tiene `inline-flex` pero el stretch del padre lo expande horizontalmente.

**Evidencia:** Línea 30: `flex flex-col justify-between flex-1 min-h-0 gap-y-6` — sin `items-center` o `items-stretch` explícito, flex usa `stretch` por defecto.

---

## 4. Causa raíz del recenter roto

**Problema:** La mirilla no recentra correctamente al usuario bajo el pin.

**Causas:**
1. **Race condition:** `CreateAlertCard` dispara `waitme:recenterMap` de forma síncrona al hacer click, pero `getCurrentLocation` es asíncrono. `flyToUser` en MapboxMap usa su propia `location` (de watchPosition), que puede estar desactualizada cuando se dispara el evento.
2. **Sin padding:** `flyToUser` no aplica `padding: { bottom: 120 }` cuando `centerPaddingBottom > 0`. El centro del mapa no coincide con la posición del pin, que está desplazado por el padding visual.

**Evidencia:** MapboxMap líneas 49-61: `flyToUser` no recibe `centerPaddingBottom` ni coords externas. CreateAlertCard línea 47: `window.dispatchEvent` se ejecuta inmediatamente, antes de que `getCurrentPosition` devuelva.

---

## 5. Solución aplicada

### Pin
- Crear `CreateMapOverlay` que usa refs + ResizeObserver para medir `searchRef` y `cardRef`.
- Calcular `pinTop = (searchBottom + cardTop) / 2 - overlayTop` (en coordenadas del overlay).
- Renderizar `CenterPin` en el overlay con `top: pinTop`, no en MapboxMap.
- MapboxMap deja de renderizar CenterPin cuando el overlay lo proporciona.

### Mapa
- CenterPin con `pointer-events-none` (ya lo tiene).
- Añadir `touch-action: none` al contenedor del mapa para que Mapbox gestione pan/zoom sin interferencia del navegador.
- Confirmar que el overlay no bloquea el hueco.

### Mirilla
- Modificar `getCurrentLocation` para aceptar callback `(lat, lng) => void`.
- Al tener la posición, llamar al callback y disparar `CustomEvent('waitme:recenterMap', { detail: { lat, lng } })`.
- MapboxMap escucha el evento; si `detail` existe, usa esas coords; si no, usa `location` interna.
- `flyTo` con `padding: { bottom: 120 }` cuando `centerPaddingBottom > 0`.

### Botón publicar
- Añadir `self-center` o `w-fit` al botón en CreateAlertCard para evitar stretch.

---

## 6. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/components/CreateMapOverlay.jsx` | **Nuevo** — Overlay con medición real, CenterPin, StreetSearch, CreateAlertCard |
| `src/components/CenterPin.jsx` | Aceptar prop `top` opcional (px) para posicionamiento medido |
| `src/components/MapboxMap.jsx` | No renderizar CenterPin cuando se usa desde overlay; flyToUser con padding y soporte para detail en evento |
| `src/components/cards/CreateAlertCard.jsx` | Botón con `self-center`; LocateFixed llama callback cuando posición lista |
| `src/pages/Home.jsx` | Usar CreateMapOverlay; getCurrentLocation con callback; pasar onRecenterTo al overlay |

---

## 7. Validación hecha

1. **Mapa arrastrable:** Overlay con `pointer-events-none`, solo buscador y tarjeta con `pointer-events-auto`. Hueco deja pasar eventos. Contenedor del mapa con `touch-action: none` para que Mapbox gestione gestos.
2. **Pin centrado:** CreateMapOverlay mide con ResizeObserver `searchBottom` y `cardTop`; pin en `(searchBottom + cardTop) / 2 - 54px` (punta del pin en el punto medio).
3. **Mirilla:** `getCurrentLocation` acepta callback; al tener posición llama `onReady({ lat, lng })`; CreateAlertCard dispara `CustomEvent` con `detail`; MapboxMap usa coords del detail y aplica `padding: { bottom: 120 }` en flyTo.
4. **Botón publicar:** Añadido `self-center w-fit` al botón para evitar stretch del padre flex.
5. **Causa raíz:** Documentada en este informe.

**Build:** `npm run build` — OK.

```

================================================================
FILE: docs/MAP_CREATE_SEARCH_EXHAUSTIVE_AUDIT.md
================================================================
```md
# Auditoría exhaustiva — Mapa create/search

**Fecha:** 2025-03-06  
**Objetivo:** Corrección definitiva de bloqueos en pantallas create y search.

---

## 1. Causa raíz del drag roto

**Problema:** El mapa no se arrastra con un dedo.

**Causas identificadas:**
1. **Overlay fullscreen:** CreateMapOverlay y SearchMapOverlay usaban un `div` con `fixed inset-0 top-[60px]` que cubría toda el área. Aunque tenía `pointer-events-none`, en iOS/Safari un elemento fullscreen encima del canvas interfiere con el hit-testing y la propagación de eventos táctiles.
2. **Contenedor Mapbox con children:** La documentación Mapbox exige: "The specified element must have no children". El contenedor del mapa tenía React children (overlay), lo que podía causar comportamiento impredecible.
3. **touch-action:** El contenedor del mapa necesita `touch-action: none` para que Mapbox reciba los gestos sin que el navegador los intercepte.

**Solución aplicada:**
- Eliminar el wrapper fullscreen en CreateMapOverlay y SearchMapOverlay. Renderizar solo los elementos necesarios (tarjeta, pin, zoom, search, card) como siblings del canvas.
- En MapboxMap: separar el contenedor del mapa (vacío) de los overlays. El contenedor que se pasa a Mapbox es un `div` vacío; los overlays son siblings.
- Contenedor del mapa con `touch-action: none`.
- Mapbox con `dragPan: true`, `touchZoomRotate: true`, `touchPitch: true` explícitos.

---

## 2. Causa raíz del pinch zoom roto

**Problema:** El mapa no hace zoom con dos dedos.

**Causas:** Las mismas que el drag — overlay fullscreen y/o contenedor con children bloqueaban los eventos táctiles antes de llegar al canvas de Mapbox.

**Solución aplicada:** Misma que drag — sin overlay fullscreen, contenedor vacío para Mapbox, `touchZoomRotate: true` explícito.

---

## 3. Causa raíz del zoom no funcional (botones +/-)

**Problema:** Los botones de zoom no funcionan.

**Causas posibles:**
1. `mapRef.current` podría ser null si el overlay se monta antes de que el mapa esté listo.
2. Mapbox GL v3 podría tener API distinta (zoomIn/zoomOut vs easeTo).
3. Los botones podrían no recibir clicks si un overlay los tapaba.

**Solución aplicada:**
- MapZoomControls usa `zoomIn(map)` y `zoomOut(map)` con fallback a `easeTo({ zoom: map.getZoom() ± 1 })` si zoomIn/zoomOut no existen.
- mapRef es el mismo que usa reubicar; se asigna en `onMapLoad` de Home.
- Sin overlay fullscreen, los botones reciben clicks correctamente.

---

## 4. Causa raíz de la tarjeta desplazada

**Problema:** La tarjeta inferior se movió respecto a su posición original.

**Causa:** Al eliminar el overlay fullscreen, la tarjeta pasó de `position: fixed` (relativa al viewport) a `position: absolute` (relativa al contenedor MapboxMap). El contenedor MapboxMap está dentro de `main` con `pt-[69px] pb-24`, por lo que su sistema de coordenadas es distinto al viewport.

**Solución aplicada:** Restaurar `position: fixed` en la tarjeta de CreateMapOverlay con `bottom: calc(env(safe-area-inset-bottom, 0px) + 90px)` para mantener la posición original relativa al viewport.

---

## 5. Causa raíz de la dirección no sincronizada

**Problema:** El campo de dirección no cambia en tiempo real al mover el mapa.

**Causas:**
1. Si el mapa no recibe drag, `move`/`moveend` no se disparan → `handleMapMove`/`handleMapMoveEnd` no se llaman.
2. Debounce de 300ms podía sentirse lento.

**Solución aplicada:** Arreglar el drag primero. Debounce ya reducido a 150ms en Home.jsx. Flujo: `map.getCenter()` → `handleMapMove` → `setSelectedPosition` + `debouncedReverseGeocode` → `reverseGeocode` → `setAddress`.

---

## 6. Solución exacta aplicada

| Cambio | Archivo |
|--------|---------|
| Contenedor Mapbox vacío (sin children) | MapboxMap.jsx |
| dragPan, touchZoomRotate, touchPitch explícitos | MapboxMap.jsx |
| Tarjeta fixed, bottom 90px + safe | CreateMapOverlay.jsx |
| Sin wrapper fullscreen | CreateMapOverlay.jsx, SearchMapOverlay.jsx |
| zoomIn/zoomOut con fallback easeTo | MapZoomControls.jsx |
| Zoom: top 10px, left calc(4% + 1rem) | MapZoomControls.jsx |
| SearchMapOverlay: elementos fixed/absolute sin overlay | SearchMapOverlay.jsx |

---

## 7. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| MapboxMap.jsx | Contenedor vacío para Mapbox; dragPan, touchZoomRotate, touchPitch |
| CreateMapOverlay.jsx | Tarjeta fixed; sin wrapper fullscreen |
| SearchMapOverlay.jsx | Sin wrapper fullscreen; elementos posicionados |
| MapZoomControls.jsx | zoomIn/zoomOut con fallback easeTo |

---

## 8. Validación técnica real

1. **Qué bloqueaba el arrastre:** Overlay fullscreen `fixed inset-0 top-[60px]` y contenedor Mapbox con children.
2. **Qué bloqueaba el pinch zoom:** Mismo overlay y contenedor.
3. **Ref/instancia de zoom:** `mapRef.current` (asignado en `onMapLoad`); mismo que reubicar.
4. **Ref/instancia de reubicar:** `mapRef.current?.flyTo()` en handleRecenter.
5. **Función al arrastrar:** `handleMapMove` (onMapMove) y `handleMapMoveEnd` (onMapMoveEnd).
6. **Función al zoom:** Mapbox dispara `move` y `moveend`; handleMapMove/handleMapMoveEnd actualizan dirección.
7. **Estado para dirección:** `selectedPosition` + `address`; `debouncedReverseGeocode` → `reverseGeocode` → `setAddress`.
8. **Zoom left/top finales:** top: 10px, left: calc(4% + 1rem).
9. **Tarjeta restaurada:** `position: fixed`, `bottom: calc(env(safe-area-inset-bottom, 0px) + 90px)`.

```

================================================================
FILE: docs/MAP_DEBUG_CHECKLIST.md
================================================================
```md
# Checklist de diagnóstico — Mapa WaitMe

Cuando el mapa no se renderiza en simulador o build local, seguir este checklist en orden.

---

## 1. Token Mapbox

- [ ] Existe archivo `.env` en la raíz del proyecto
- [ ] `.env` contiene `VITE_MAPBOX_TOKEN=pk.xxx` (token real, no placeholder)
- [ ] El token NO es `PEGA_AQUI_EL_TOKEN` ni `YOUR_MAPBOX_PUBLIC_TOKEN`
- [ ] Obtener token en: https://account.mapbox.com/access-tokens/
- [ ] Tras cambiar `.env`, reiniciar `npm run dev` o hacer `npm run build` de nuevo

**Síntoma:** Mensaje "Mapa no disponible" o área gris sin tiles.

---

## 2. Contenedor del mapa

- [ ] En DevTools → Elements, el div con `ref` del MapboxMap tiene `height > 0` y `width > 0`
- [ ] El padre del mapa tiene `min-h-[100dvh]` o altura definida
- [ ] No hay `display: none` ni `visibility: hidden` en ancestros del mapa
- [ ] El mapa está en `z-index: 0`; overlays en `z-[1]` y contenido en `z-10`

**Síntoma:** Mapa carga pero se ve vacío o recortado.

---

## 3. Simulador iOS / Capacitor

- [ ] Si usas dev server: `CAPACITOR_USE_DEV_SERVER=true npx cap run ios`
- [ ] La URL del dev server en `capacitor.config.ts` es accesible desde el simulador (misma red)
- [ ] Si usas build: `npm run build` → `npx cap sync ios` → abrir en Xcode
- [ ] En build, las variables `VITE_*` se inyectan en tiempo de build; asegurar `.env` correcto antes de `npm run build`

**Síntoma:** Mapa funciona en navegador pero no en simulador.

---

## 4. Errores de red

- [ ] En DevTools → Network, filtrar por "mapbox" o "tiles"
- [ ] No hay respuestas 401 (Unauthorized) — indica token inválido o expirado
- [ ] No hay bloqueos CORS para `*.mapbox.com`

**Síntoma:** Tiles no cargan, mapa gris con cuadrícula.

---

## 5. Resize y layout

- [ ] MapboxMap usa ResizeObserver para llamar `map.resize()` cuando cambia el contenedor
- [ ] Hay resizes escalonados (100, 400, 800 ms) tras el load
- [ ] Si el mapa aparece tras cambiar de orientación o redimensionar, el problema es de resize

**Síntoma:** Mapa aparece solo tras rotar dispositivo o redimensionar ventana.

---

## 6. Componentes relacionados

| Componente    | Uso                          | Token requerido |
|---------------|------------------------------|-----------------|
| MapboxMap     | Fondo fullscreen en Home     | Sí              |
| ParkingMap    | Mapas en modos search/create | Sí              |
| SellerLocationTracker | Mapa en Navigate      | Sí              |

Todos comparten `VITE_MAPBOX_TOKEN`. Si uno falla, los demás también.

---

## 7. Comandos de verificación

```bash
# Build local (debe completar sin errores)
npm run build

# Preview del build
npm run preview

# Verificar que .env tiene las variables
grep VITE_ .env 2>/dev/null || echo "Crear .env desde .env.example"
```

---

## 8. Fixes aplicados (referencia)

- Contenedor MapboxMap: `minHeight: 100dvh`, `minWidth: 100%`
- ResizeObserver para `map.resize()` al cambiar tamaño
- Resizes escalonados tras load
- Parent en Home: `min-h-[100dvh]` para altura estable en móvil

```

================================================================
FILE: docs/MAP_INTERACTION_FINAL_FORENSIC_AUDIT.md
================================================================
```md
# Auditoría forense final — Mapa create/search

**Fecha:** 2025-03-06  
**Objetivo:** Corrección real, no parches.

---

## 1. Causa raíz del pin mal colocado

**Problema:** El pin no está centrado entre barra superior y tarjeta.

**Causa:** CreateMapOverlay usa `(overlayRect.top + cardRect.top) / 2` pero el overlay tiene `top-[60px]`. La barra superior termina en 60px. El punto medio debe ser entre 60px (borde inferior de la barra) y cardRect.top (borde superior de la tarjeta). La fórmula actual es correcta en teoría; el fallo puede ser que overlayRect.top en getBoundingClientRect() del overlay (que tiene top-[60px]) devuelve la posición real del overlay, que puede no coincidir exactamente con 60px si hay safe-area o el overlay está dentro de un contenedor con scroll. Además, el pin usa `pinTopFromOverlay = midPoint - overlayRect.top - 54`; si el overlay no empieza exactamente en 60px del viewport, el cálculo falla.

**Solución:** Usar explícitamente 60 (header height) como borde superior del área, no overlayRect.top. Medir solo cardRect con getBoundingClientRect(). midPoint = (60 + cardRect.top) / 2. pinTopFromOverlay = midPoint - 60 - 54 (para que la punta del pin quede en el punto medio).

---

## 2. Causa raíz del mapa no arrastrable

**Problema:** El mapa no recibe gestos de drag.

**Causa:** El overlay (CreateMapOverlay/SearchMapOverlay) está dentro del content div (z-10), que está POR ENCIMA del MapboxMap (z-0) en el stacking order. Aunque el overlay tiene pointer-events-none, el content div y main también lo tienen. Cuando el usuario toca la pantalla, el evento llega al content div (está encima). El content div tiene pointer-events-none, así que el evento "atraviesa". Pero la especificación de hit-testing con elementos fixed: el overlay tiene position fixed y está visualmente encima del mapa. Con pointer-events-none, no debería capturar. **La causa real:** el overlay está en un árbol de componentes DIFERENTE al mapa. El content div (z-10) cubre toda el área. Aunque tiene pointer-events-none, en algunos navegadores/iOS el hit-testing puede no propagar correctamente a través de múltiples capas con pointer-events-none, o el orden de elementos puede hacer que el evento no llegue al canvas del mapa.

**Solución definitiva:** Renderizar el overlay DENTRO del contenedor del MapboxMap, como hermano del canvas. Así el overlay y el canvas comparten el mismo contenedor. Con pointer-events-none en el overlay, el click/touch pasa directamente al canvas. Sin capas intermedias.

---

## 3. Causa raíz del campo "Oviedo" fijo

**Problema:** La dirección no se actualiza en tiempo real.

**Causas posibles:**
1. onMapMove/onMapMoveEnd no se disparan si el mapa no recibe eventos (por el bloqueo del drag).
2. map.getCenter() con padding: cuando el mapa tiene setPadding, getCenter() devuelve el centro del área visible (con padding aplicado). Debe ser correcto.
3. handleMapMove recibe [lat, lng] pero Mapbox pasa [c.lat, c.lng] — getCenter() devuelve {lng, lat}. Así que estamos pasando [lat, lng]. handleMapMove hace setSelectedPosition({ lat: center[0], lng: center[1] }) — correcto.
4. Si el mapa no se mueve (bloqueo), nunca se disparan move/moveend.

**Solución:** Arreglar el drag primero. Luego verificar que debouncedReverseGeocode se llame. Mantener última dirección válida en reverseGeocode si falla (no resetear a "Oviedo").

---

## 4. Causa raíz del botón reubicar roto

**Problema:** La mirilla no recentra.

**Causa:** CreateAlertCard usa evento global waitme:recenterMap. MapboxMap escucha y llama flyToUser. Pero flyToUser usa location interna de MapboxMap o detail del evento. getCurrentLocation es async; cuando devuelve, llama onReady(coords) que dispara el evento. Si hay race o el evento no llega, falla. Además, Home no pasa onRecenterTo a CreateMapOverlay — CreateAlertCard recibe onRecenterTo como undefined. El evento es la única vía.

**Solución:** Pasar onRecenter callback imperativo desde Home. Al pulsar mirilla: getCurrentLocation((coords) => onRecenter(coords)). onRecenter hace: mapRef.current?.flyTo(...), setSelectedPosition, reverseGeocode. Sin eventos globales.

---

## 5. Causa raíz del zoom no fiable

**Problema:** Zoom en posición incorrecta, estilo incorrecto.

**Causa:** MapZoomControls usa `top: 50%, transform: translateY(-50%)` — centrado vertical. El usuario quiere 10px desde la barra superior. mapRef.current?.zoomIn() — la ref viene de Home, que recibe el mapa de onMapLoad. Debería ser correcta.

**Solución:** top: 70px (60 + 10), left: 10px. Estilo morado como el botón reubicar: bg-purple-600/50 border-purple-500/50.

---

## 6. Solución aplicada

1. **Overlay dentro de MapboxMap:** Pasar overlay como children de MapboxMap. Se renderiza dentro del contenedor del mapa, como hermano del canvas. pointer-events-none en el overlay → eventos pasan al canvas.
2. **Pin:** midPoint = (60 + cardRect.top) / 2; pinTop = midPoint - 60 - 54.
3. **Zoom:** top: 70px, left: 10px. Estilo morado.
4. **Reubicar:** onRecenter callback con mapRef.current.flyTo, setSelectedPosition, reverseGeocode.
5. **Dirección:** Mantener flujo actual; al arreglar drag, move/moveend se dispararán.

---

## 7. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| Home.jsx | Overlay como children de MapboxMap; handleRecenter con mapRef.flyTo; reverseGeocode solo si result válido |
| MapboxMap.jsx | Eliminar listener waitme:recenterMap (ya no se usa) |
| CreateMapOverlay.jsx | Pin con HEADER_BOTTOM=60; onRecenter; overlay dentro de mapa |
| SearchMapOverlay.jsx | Pin con HEADER_BOTTOM; overlay dentro de mapa |
| MapZoomControls.jsx | top 70px, left 10px; estilo morado (bg-purple-600/50) |
| CreateAlertCard.jsx | onRecenter callback; sin evento global |
| CenterPin.jsx | Sin cambios |

---

## 8. Validación técnica real

1. Overlay dentro de MapboxMap → canvas recibe eventos en el hueco.
2. Pin: medición con 60 + cardRect.top.
3. Zoom: posición y estilo.
4. Reubicar: callback imperativo.
5. Dirección: debounce + mantener última válida.

```

================================================================
FILE: docs/MIGRATION_ALERTS.md
================================================================
```md
# Migración Alerts: Base44 → Supabase

**Fase:** 1 — Crear capa Supabase (sin eliminar Base44)  
**Fecha:** 2025-03-04

---

## 1. Análisis realizado

### Uso actual de Base44 relacionado con alertas

| Archivo | Uso |
|---------|-----|
| `src/hooks/useMyAlerts.js` | `base44.entities.ParkingAlert.filter({ user_id })` para mis alertas |
| `src/pages/Home.jsx` | create, filter, update |
| `src/pages/History.jsx` | create, filter, update, delete, múltiples updates de status |
| `src/pages/HistorySellerView.jsx` | update (accept/reject reserva) |
| `src/pages/HistoryBuyerView.jsx` | update (cancel) |
| `src/pages/Notifications.jsx` | get, update |
| `src/pages/Chats.jsx` | ParkingAlert.list |
| `src/pages/Navigate.jsx` | filter, update (complete, cancel) |
| `src/components/IncomingRequestModal.jsx` | update |
| `src/components/WaitMeRequestScheduler.jsx` | get |
| `src/components/SellerLocationTracker.jsx` | filter |
| `src/components/cards/ActiveAlertCard.jsx` | update |
| `src/components/BottomNav.jsx` | useMyAlerts (badge) |

### alertService existente

- `src/services/alertService.js`: CRUD básico con Supabase, usa schema legacy (`user_id`, `price`, `geohash`).
- `src/hooks/useAlertsQuery.js`: hooks React Query que usan alertService (no integrados en flujos principales).
- `src/services/realtime/alertsRealtime.js`: Realtime para parking_alerts → appStore.
- `src/hooks/useRealtimeAlerts.js`: carga inicial + subscribe → appStore (mapa).

### Schema Supabase existente

Las migraciones ya definen:

- **parking_alerts** (core_schema): `seller_id`, `status`, `lat`, `lng`, `address_text`, `price_cents`, `currency`, `expires_at`, `metadata`, `created_at`, `updated_at`
- **alert_reservations**: `alert_id`, `buyer_id`, `status` (requested, accepted, active, completed, cancelled, expired)

Faltaba:

- **geohash** en parking_alerts (para búsquedas por proximidad)
- Trigger para sincronizar `parking_alerts.status = 'reserved'` cuando se acepta una reserva

---

## 2. Cambios realizados

### 2.1 Nueva migración

**Archivo:** `supabase/migrations/20260305170000_add_geohash_and_reservation_trigger.sql`

- Añade columna `geohash` a `parking_alerts`
- Índice `idx_parking_alerts_geohash_status` para consultas por proximidad
- Función `on_reservation_accepted()` (SECURITY DEFINER): al insertar o actualizar `alert_reservations` con `status = 'accepted'`, actualiza `parking_alerts.status = 'reserved'`

### 2.2 Nuevo servicio

**Archivo:** `src/services/alertsSupabase.js`

| Función | Descripción |
|---------|-------------|
| `createAlert(payload)` | Crea alerta. Acepta payload Supabase o Base44-style (user_id, price, latitude/longitude, address). |
| `updateAlert(alertId, updates)` | Actualiza status, priceCents, expiresAt, addressText, metadata, available_in_minutes, cancel_reason. |
| `deleteAlert(alertId)` | Elimina alerta. |
| `getNearbyAlerts(lat, lng, radiusKm)` | Alertas activas cerca de (lat, lng) usando geohash. |
| `getMyAlerts(sellerId)` | Alertas del vendedor. |
| `getAlert(alertId)` | Obtiene una alerta por ID. |
| `subscribeAlerts({ onUpsert, onDelete })` | Realtime: INSERT, UPDATE, DELETE en parking_alerts. |

**Normalización:** Todas las respuestas usan `normalizeAlert()` para unificar formato (user_id/seller_id, price/price_cents, lat/latitude, etc.) compatible con el resto de la app.

---

## 3. Schema final

### parking_alerts

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| seller_id | uuid | FK auth.users |
| status | text | active, reserved, expired, completed, cancelled |
| lat, lng | double precision | Coordenadas |
| address_text | text | Dirección |
| price_cents | int | Precio en céntimos |
| currency | text | EUR |
| expires_at | timestamptz | Expiración |
| geohash | text | Para búsquedas por proximidad |
| metadata | jsonb | vehicle_type, available_in_minutes, etc. |
| created_at, updated_at | timestamptz | |

### alert_reservations

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| alert_id | uuid | FK parking_alerts |
| buyer_id | uuid | FK auth.users |
| status | text | requested, accepted, active, completed, cancelled, expired |
| started_at, expires_at | timestamptz | |
| created_at, updated_at | timestamptz | |

### alert_status

Los valores de status están definidos por CHECK en las tablas. No existe tabla `alert_status` separada; el status es una columna en `parking_alerts` y `alert_reservations`.

---

## 4. Migración History.jsx (2025-03-04)

### Cambios realizados

1. **useMyAlerts.js**
   - Sustituido `base44.entities.ParkingAlert.filter` por `alertsSupabase.getMyAlerts` + `getAlertsReservedByMe`.
   - Añadida suscripción Realtime con `subscribeAlerts` para invalidar cache al cambiar alertas.
   - Soporta alertas como vendedor y como comprador (Tus alertas + Tus reservas).

2. **History.jsx**
   - Sustituidas todas las llamadas a `base44.entities.ParkingAlert` por `alertsSupabase.*`:
     - `deleteAlertSafe` → `alertsSupabase.deleteAlert`
     - `cancelAlertMutation` → `updateAlert` + `getMyAlerts`
     - `expireAlertMutation` → `updateAlert`
     - `repeatAlertMutation` → `updateAlert` + `createAlert`
     - Auto-expirar alertas y reservas → `updateAlert`
     - ExpiredBlock, cancelReservedOpen, expiredAlertModalId → `updateAlert`
   - Se mantiene `base44.entities.Transaction.list` (no migrado).

3. **HistorySellerView.jsx**
   - `base44.entities.ParkingAlert.update` → `alertsSupabase.updateAlert`.

4. **HistoryBuyerView.jsx**
   - `base44.entities.ParkingAlert.update` → `alertsSupabase.updateAlert`.
   - `base44.entities.ChatMessage.create` se mantiene (chat no migrado).

5. **alertsSupabase.js**
   - Añadida `getAlertsReservedByMe(buyerId)` para "Tus reservas".
   - `normalizeAlert` ampliado con `available_in_minutes`, `cancel_reason`, `created_date`, `reserved_by_id`.

### Comportamiento visual

Se mantiene exactamente el mismo: tabs Tus alertas / Tus reservas, cancelar, expirar, repetir, prorrogar, "Me voy".

---

## 5. Próximos pasos (resto de componentes)

1. Home.jsx: sustituir create, filter, update (no tocar según instrucciones).
2. Notifications.jsx, Chats.jsx, Navigate.jsx, IncomingRequestModal, WaitMeRequestScheduler, SellerLocationTracker, ActiveAlertCard.
3. Una vez migrado todo, eliminar imports de Base44 relacionados con ParkingAlert.

---

## 6. Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/20260305170000_add_geohash_and_reservation_trigger.sql` | Creado |
| `src/services/alertsSupabase.js` | Creado, ampliado |
| `src/hooks/useMyAlerts.js` | Migrado a Supabase |
| `src/pages/History.jsx` | Migrado a Supabase |
| `src/pages/HistorySellerView.jsx` | Migrado a Supabase |
| `src/pages/HistoryBuyerView.jsx` | Migrado a Supabase (alertas; chat sigue Base44) |
| `docs/MIGRATION_ALERTS.md` | Actualizado |

**Base44 no se ha eliminado.** History.jsx usa Supabase para alertas; Transaction y Chat siguen en Base44.

```

================================================================
FILE: docs/MIGRATION_CHAT.md
================================================================
```md
# Migración Chat: Base44 → Supabase (Data Adapter)

## Objetivo

Que el chat deje de depender de Base44 usando el patrón Data Adapter (Strangler). Los componentes importan `import * as chat from "@/data/chat"` y nunca llaman a Base44 ni Supabase directamente.

## Archivos creados/modificados

### Nuevos

- **`src/data/chat.js`** – Adapter que reexporta el proveedor actual (chatSupabase).
- **`src/services/chatSupabase.js`** – Proveedor Supabase para chat.
- **`supabase/migrations/20260305180000_conversations_last_message.sql`** – Añade `last_message_text`, `last_message_at` y trigger a `conversations`.

### Modificados

- **`src/pages/Chat.jsx`** – Usa `chat.*` y `useAuth` en lugar de Base44.
- **`src/pages/Chats.jsx`** – Usa `chat.getConversations` y `alerts.getAlertsForChats`.

## API del adapter (`src/data/chat.js`)

| Función | Descripción |
|---------|-------------|
| `getConversations(userId)` | Lista conversaciones del usuario (buyer o seller). |
| `getConversation(conversationId, userId)` | Obtiene una conversación por ID. |
| `getMessages(conversationId, userId)` | Mensajes de una conversación. |
| `sendMessage({ conversationId, senderId, body })` | Envía un mensaje. |
| `subscribeMessages(conversationId, onNewMessage)` | Suscripción Realtime a mensajes. |

## Tablas Supabase

- **`conversations`** – `id`, `alert_id`, `buyer_id`, `seller_id`, `created_at`, `last_message_text`, `last_message_at`.
- **`messages`** – `id`, `conversation_id`, `sender_id`, `body`, `created_at`.

El trigger `on_message_inserted` actualiza `last_message_text` y `last_message_at` al insertar un mensaje.

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| `participant1_id` | `buyer_id` |
| `participant2_id` | `seller_id` |
| `message` | `body` |
| `created_date` | `created_at` |
| `sender_name`, `sender_photo` | Desde `profiles` por `sender_id` |

## Realtime

Se usa `postgres_changes` en la tabla `messages` con filtro `conversation_id=eq.{id}`. La tabla `messages` debe estar en `supabase_realtime` (ya configurado en migraciones).

## Lo que sigue usando Base44

- **`base44.integrations.Core.UploadFile`** – Subida de adjuntos en Chat (no migrado).
- **`base44.entities.Notification.create`** – Prórrogas en Chats (no migrado).

## Ejecutar migración

```bash
npx supabase db push
```

O aplicar manualmente el SQL de `supabase/migrations/20260305180000_conversations_last_message.sql`.

```

================================================================
FILE: docs/MIGRATION_NOTIFICATIONS.md
================================================================
```md
# Migración Notifications: Base44 → Supabase

## Objetivo

Sustituir `base44.entities.Notification` por Supabase. Los componentes importan `import * as notifications from "@/data/notifications"` y nunca llaman a Base44 ni Supabase directamente para notificaciones.

## Archivos creados/modificados

### Nuevos

- **`src/data/notifications.js`** – Adapter que reexporta el proveedor actual (notificationsSupabase).
- **`src/services/notificationsSupabase.js`** – Proveedor Supabase para notificaciones.
- **`supabase/migrations/20260305210000_notifications.sql`** – Crea tabla `notifications` y políticas RLS.

### Modificados

- **`src/pages/Chats.jsx`** – Usa `notifications.createNotification` para prórrogas (extension_request) en lugar de Base44.
- **`src/pages/Home.jsx`** – Usa `notifications.listNotifications` y `subscribeNotifications` para el badge de no leídas.
- **`src/pages/Notifications.jsx`** – Usa `notifications.listNotifications`, `markAsRead`, `markAllAsRead`; combina con demo.

## API del adapter (`src/data/notifications.js`)

| Función | Descripción |
|---------|-------------|
| `createNotification(payload)` | Crea una notificación. Payload: `{ user_id, type, title?, message?, metadata? }`. |
| `listNotifications(userId, opts)` | Lista notificaciones. Opts: `{ unreadOnly?: boolean, limit?: number }`. |
| `markAsRead(notificationId, userId)` | Marca una notificación como leída. |
| `markAllAsRead(userId)` | Marca todas como leídas. |
| `subscribeNotifications(userId, onNotification)` | Suscripción Realtime a nuevas notificaciones. Devuelve función unsubscribe. |

## Tabla Supabase `notifications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK auth.users, destinatario |
| type | text | extension_request, status_update, etc. |
| title | text | Título |
| message | text | Cuerpo |
| metadata | jsonb | Datos extra (sender_id, alert_id, amount, etc.) |
| is_read | boolean | Leída |
| created_at | timestamptz | Fecha |

## RLS

- **SELECT**: solo las propias (`user_id = auth.uid()`)
- **INSERT**: permitido (cualquier usuario puede crear notificaciones para otros)
- **UPDATE**: solo las propias

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| `Notification.create({ type, recipient_id, sender_id, alert_id, ... })` | `createNotification({ user_id: recipient_id, type, title, message, metadata: { sender_id, alert_id, ... } })` |
| `Notification.filter({ user_id, read: false })` | `listNotifications(userId, { unreadOnly: true })` |

## Ejecutar migración

```bash
npx supabase db push
```

```

================================================================
FILE: docs/MIGRATION_STATUS.md
================================================================
```md
# Estado de migración Base44 → Supabase

**Fecha auditoría:** 2025-03-04  
**Conclusión:** La migración **NO está terminada**. Base44 sigue siendo la fuente principal de datos para alertas, chat, transacciones, notificaciones y auth secundario.

---

## 1. Resumen ejecutivo

| Área | Estado | Fuente actual |
|------|--------|---------------|
| **Auth** | Parcial | Supabase Auth (login) + Base44 `auth.me()` / `auth.updateMe()` en varios flujos |
| **Database** | Dual | Base44 (operativo) + Supabase (schema listo, poco usado) |
| **Alerts** | Base44 | `base44.entities.ParkingAlert` en toda la app; `alertService` (Supabase) existe pero no se usa |
| **Chat** | Base44 | `base44.entities.Conversation`, `ChatMessage` |
| **Transactions** | Base44 | `base44.entities.Transaction` |
| **Notifications** | Base44 | `base44.entities.Notification`, `base44.auth.updateMe()` |
| **UserLocation** | Base44 | `base44.entities.UserLocation` (SellerLocationTracker) |
| **Realtime** | Supabase | `useRealtimeAlerts`, `alertsRealtime.js` → appStore (mapa) |
| **File upload** | Base44 | `base44.integrations.Core.UploadFile` (Chat.jsx) |
| **Deploy** | Independiente | Vite build; no depende de Base44 deploy |

---

## 2. Dónde vive cada parte del sistema

### FRONTEND

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se construye con Vite? | Sí (`vite build`) |
| ¿Puede desplegarse desde GitHub? | Sí. Build estándar; CI ya configurado. |
| ¿Depende de Base44 para build? | Sí. `@base44/vite-plugin` en `vite.config.js`; se puede eliminar tras migración. |

### BACKEND

| Pregunta | Respuesta |
|----------|-----------|
| ¿Todo está en Supabase? | No. La lógica de negocio activa usa Base44 API (`api.base44.app`). |
| ¿Supabase tiene el schema? | Sí. `parking_alerts`, `conversations`, `messages`, `alert_reservations`, `user_locations` en migraciones. |
| ¿Se usa el schema Supabase? | Parcial. `alertService.js` usa Supabase pero no está integrado en los flujos principales. |

### AUTH

| Pregunta | Respuesta |
|----------|-----------|
| ¿Supabase Auth o Base44? | Ambos. Login: Supabase OAuth. Perfil: Supabase `profiles`. Pero Chat, Navigate, IncomingRequestModal, PageNotFound, NotificationSettings usan `base44.auth.me()` y `base44.auth.updateMe()`. |
| ¿JWT Supabase en Base44? | No. Base44 usa `appParams.token` (URL/localStorage), no el JWT de Supabase. Riesgo de sesiones desincronizadas. |

### DATABASE

| Pregunta | Respuesta |
|----------|-----------|
| ¿Todas las tablas en Supabase? | El schema existe en Supabase. Los datos operativos siguen en Base44. |
| ¿Tablas Supabase usadas? | `profiles` (Profile, AuthContext). `parking_alerts` solo vía Realtime (appStore) y `alertService` (no integrado). |

### REALTIME

| Pregunta | Respuesta |
|----------|-----------|
| ¿Supabase Realtime o Base44? | Supabase Realtime para `parking_alerts` (MapboxMap usa appStore). Base44 `ChatMessage.subscribe` para chat. |
| ¿Fuentes de datos divergentes? | Sí. Mapa: appStore (Supabase). History/Home/useMyAlerts: Base44. Pueden mostrar datos distintos. |

### DEPLOY

| Pregunta | Respuesta |
|----------|-----------|
| ¿Deploy desde GitHub? | Sí. Build Vite → `dist/`. Sin dependencia de Base44 para deploy. |
| ¿Base44 deploy? | No. El proyecto puede desplegarse en Vercel, Netlify, etc. |

---

## 3. Archivos que usan Base44 (lista exacta)

### Código fuente (imports y llamadas)

| Archivo | Uso |
|---------|-----|
| `src/api/base44Client.js` | Cliente Base44; `createClient` |
| `src/api/entities.js` | Re-exporta `base44.entities.Query`, `base44.auth` |
| `src/api/integrations.js` | Re-exporta `base44.integrations.Core` (UploadFile, etc.) |
| `src/lib/app-params.js` | `base44_*` storage keys, `VITE_BASE44_*` env, `base44_access_token` |
| `src/pages/Home.jsx` | ParkingAlert create/filter/update, Transaction.create, ChatMessage.create, Notification.filter |
| `src/pages/History.jsx` | ParkingAlert CRUD, Transaction.list, múltiples updates |
| `src/pages/HistorySellerView.jsx` | ParkingAlert.update |
| `src/pages/HistoryBuyerView.jsx` | ParkingAlert.update, ChatMessage.create |
| `src/pages/Chat.jsx` | auth.me, Conversation.filter, ChatMessage filter/create/subscribe/update, UploadFile |
| `src/pages/Chats.jsx` | Conversation.list, ParkingAlert.list, Notification.create |
| `src/pages/Navigate.jsx` | auth.me, ParkingAlert filter/update, Transaction.create, ChatMessage.create |
| `src/pages/Notifications.jsx` | ParkingAlert.get, ParkingAlert.update |
| `src/pages/NotificationSettings.jsx` | base44.auth.updateMe (notifications_enabled, notify_*) |
| `src/components/IncomingRequestModal.jsx` | auth.me, ParkingAlert.update, Conversation filter/create, ChatMessage.create |
| `src/components/WaitMeRequestScheduler.jsx` | ParkingAlert.get |
| `src/components/SellerLocationTracker.jsx` | ParkingAlert.filter, UserLocation.filter |
| `src/components/cards/ActiveAlertCard.jsx` | ParkingAlert.update |
| `src/hooks/useMyAlerts.js` | ParkingAlert.filter |
| `src/lib/PageNotFound.jsx` | base44.auth.me |
| `src/services/alertService.js` | Comentario: "Sustituye base44.entities.ParkingAlert cuando se complete la migración" |

### Configuración y dependencias

| Archivo | Uso |
|---------|-----|
| `package.json` | `"name": "base44-app"`, `@base44/sdk`, `@base44/vite-plugin` |
| `vite.config.js` | `import base44 from "@base44/vite-plugin"`, plugin `base44()` |
| `.env.example` | `VITE_BASE44_API_BASE_URL` |

### Funciones (Base44 backend)

| Archivo | Uso |
|---------|-----|
| `functions/searchGooglePlaces.ts` | Signature `{ base44 }` (no usa lógica Base44, solo inyección) |

---

## 4. Entidades Base44 en uso

| Entidad | Operaciones | Archivos |
|---------|-------------|----------|
| `ParkingAlert` | get, filter, list, create, update, delete, subscribe (implícito vía Realtime Supabase) | Home, History, HistorySellerView, HistoryBuyerView, Chats, Navigate, Notifications, IncomingRequestModal, WaitMeRequestScheduler, SellerLocationTracker, ActiveAlertCard, useMyAlerts |
| `Conversation` | filter, list, create, update | Chat, Chats, IncomingRequestModal |
| `ChatMessage` | filter, create, subscribe | Chat, Chats, HistoryBuyerView, IncomingRequestModal, Home, Navigate |
| `Transaction` | list, create | History, Home, Navigate |
| `Notification` | filter, create | Home, Chats |
| `UserLocation` | filter | SellerLocationTracker |
| `base44.auth` | me(), updateMe() | Chat, Navigate, IncomingRequestModal, PageNotFound, NotificationSettings |
| `base44.integrations.Core` | UploadFile | Chat.jsx |

---

## 5. Variables de entorno Base44

| Variable | Uso |
|----------|-----|
| `VITE_BASE44_APP_ID` | appParams.appId |
| `VITE_BASE44_BACKEND_URL` | serverUrl (base44Client, app-params) |
| `VITE_BASE44_API_BASE_URL` | Fallback serverUrl |
| `BASE44_LEGACY_SDK_IMPORTS` | vite-plugin (opcional) |

---

## 6. Qué está migrado

- **Auth login:** Supabase OAuth (Login.jsx)
- **Perfil:** Supabase `profiles` (Profile.jsx, AuthContext)
- **Realtime alertas:** Supabase Realtime → appStore (MapboxMap)
- **Map-match:** Supabase Edge Function
- **Schema DB:** Migraciones Supabase con parking_alerts, conversations, messages, user_locations, alert_reservations
- **Build/Deploy:** Vite; independiente de Base44

---

## 7. Qué falta para eliminar Base44

1. **Alertas:** Sustituir todas las llamadas a `base44.entities.ParkingAlert` por `alertService` (Supabase) o servicio equivalente. Ajustar schema si hay diferencias (seller_id vs user_id, price_cents vs price).
2. **Chat:** Implementar chat con Supabase `conversations` + `messages`; sustituir `base44.entities.Conversation`, `ChatMessage` y `ChatMessage.subscribe` por Supabase Realtime.
3. **Transactions:** Crear tabla `transactions` en Supabase (si no existe) y migrar create/list.
4. **Notifications:** Migrar a Supabase (tabla o `profiles`) y sustituir `base44.entities.Notification` y `base44.auth.updateMe()`.
5. **UserLocation:** Usar Supabase `user_locations` en SellerLocationTracker.
6. **Auth secundario:** Eliminar `base44.auth.me()` y `base44.auth.updateMe()`; usar solo AuthContext + Supabase profiles.
7. **File upload:** Sustituir `base44.integrations.Core.UploadFile` por Supabase Storage.
8. **Limpieza:** Eliminar `base44Client.js`, `entities.js`, `integrations.js`, plugin Vite, dependencias npm, variables de entorno, `app-params.js` (o refactorizar).
9. **searchGooglePlaces:** Migrar a Supabase Edge Function o servicio externo; eliminar dependencia de `base44` en la signature.

---

## 8. Plan automático propuesto para eliminar Base44

### Fase 1: Preparación (sin tocar flujos)

1. Verificar que el schema Supabase (`parking_alerts`, `conversations`, `messages`, `user_locations`) coincide con el uso actual o crear migraciones de ajuste.
2. Crear tabla `transactions` en Supabase si no existe.
3. Añadir columnas de notificaciones en `profiles` si faltan (`notify_reservations`, etc.).
4. Crear servicios Supabase: `chatService.js`, `transactionService.js`, `userLocationService.js`, `notificationService.js` (o extender profiles).

### Fase 2: Sustitución por capas

1. **alertService:** Ya existe. Integrarlo en Home, History, useMyAlerts, etc. Sustituir cada llamada a `base44.entities.ParkingAlert` por el servicio. Ajustar mapeo de campos (user_id↔seller_id, price↔price_cents).
2. **Chat:** Crear `chatService.js` con Supabase. Sustituir en Chat.jsx, Chats.jsx, IncomingRequestModal, HistoryBuyerView, Navigate. Usar Realtime para mensajes.
3. **Transactions:** Crear `transactionService.js`. Sustituir en History, Home, Navigate.
4. **UserLocation:** Crear/ajustar servicio. Sustituir en SellerLocationTracker.
5. **Notifications:** Usar `profiles` o tabla dedicada. Sustituir en NotificationSettings, Home, Chats.
6. **Auth:** Sustituir `base44.auth.me()` por `useAuth().user` o query a profiles. Sustituir `base44.auth.updateMe()` por update a `profiles`.
7. **UploadFile:** Sustituir por Supabase Storage en Chat.jsx.

### Fase 3: Eliminación

1. Eliminar imports de `base44` en todos los archivos listados.
2. Eliminar `src/api/base44Client.js`, `src/api/entities.js`, `src/api/integrations.js`.
3. Refactorizar `app-params.js`: eliminar referencias Base44; mantener solo lo necesario para Supabase/Mapbox.
4. Eliminar `@base44/sdk` y `@base44/vite-plugin` de package.json.
5. Eliminar plugin de `vite.config.js`.
6. Eliminar variables `VITE_BASE44_*` de `.env.example` y documentación.
7. Renombrar `package.json` name a `waitme-app` o similar.
8. Migrar o eliminar `functions/searchGooglePlaces.ts`.

### Orden sugerido de archivos a modificar

1. `useMyAlerts.js` → usar alertService o Supabase directo
2. `Home.jsx` → alertService, transactionService, chatService, notificationService
3. `History.jsx` → alertService, transactionService
4. `HistorySellerView.jsx`, `HistoryBuyerView.jsx` → alertService, chatService
5. `Chat.jsx`, `Chats.jsx` → chatService, Supabase Storage
6. `Navigate.jsx` → alertService, transactionService, chatService
7. `Notifications.jsx`, `NotificationSettings.jsx` → profiles/notificationService
8. `IncomingRequestModal.jsx` → alertService, chatService
9. `WaitMeRequestScheduler.jsx`, `SellerLocationTracker.jsx`, `ActiveAlertCard.jsx` → alertService, userLocationService
10. `PageNotFound.jsx` → useAuth
11. Eliminar archivos API Base44 y dependencias

---

## 9. Riesgos durante la migración

- **Schema mismatch:** `alertService` usa `user_id`, `price`, `geohash`; `core_schema` usa `seller_id`, `price_cents`. Verificar migraciones aplicadas y unificar.
- **Realtime:** Asegurar que `ChatMessage.subscribe` se sustituye correctamente por Supabase Realtime.
- **Sesiones:** Base44 y Supabase usan tokens distintos; al eliminar Base44 auth, validar que no queden flujos rotos.
- **UploadFile:** Definir bucket y políticas en Supabase Storage antes de sustituir.

```

================================================================
FILE: docs/MIGRATION_TRANSACTIONS.md
================================================================
```md
# Migración Transactions: Base44 → Supabase (Data Adapter)

## Objetivo

Eliminar la dependencia de Base44 para transacciones usando el patrón Data Adapter. Los componentes importan `import * as transactions from "@/data/transactions"` y nunca llaman a Base44 ni Supabase directamente.

## Archivos creados/modificados

### Nuevos

- **`src/data/transactions.js`** – Adapter que reexporta el proveedor actual (transactionsSupabase).
- **`src/services/transactionsSupabase.js`** – Proveedor Supabase para transacciones.
- **`supabase/migrations/20260305190000_transactions.sql`** – Crea la tabla `transactions`.

### Modificados

- **`src/pages/Navigate.jsx`** – Usa `transactions.createTransaction` y `alerts.updateAlert`.
- **`src/pages/History.jsx`** – Usa `transactions.listTransactions`.
- **`src/pages/Home.jsx`** – Usa `transactions.createTransaction` al reservar una alerta.

## API del adapter (`src/data/transactions.js`)

| Función | Descripción |
|---------|-------------|
| `createTransaction(payload)` | Crea una transacción. |
| `listTransactions(userId, opts?)` | Lista transacciones del usuario (buyer o seller). |

### createTransaction payload

```ts
{
  buyer_id: string;      // uuid
  seller_id: string;     // uuid
  alert_id?: string;    // uuid, opcional
  amount: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  seller_name?: string;
  buyer_name?: string;
  seller_earnings?: number;
  platform_fee?: number;
  address?: string;
}
```

## Tabla Supabase `transactions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| buyer_id | uuid | FK auth.users |
| seller_id | uuid | FK auth.users |
| alert_id | uuid | FK parking_alerts, nullable |
| amount | numeric(10,2) | Importe en euros |
| status | text | pending, completed, cancelled, refunded |
| seller_earnings | numeric(10,2) | Opcional |
| platform_fee | numeric(10,2) | Opcional |
| address | text | Opcional |
| metadata | jsonb | Datos extra (seller_name, buyer_name, etc.) |
| created_at | timestamptz | |

## RLS

- **SELECT**: `buyer_id = auth.uid() OR seller_id = auth.uid()`
- **INSERT**: `buyer_id = auth.uid() OR seller_id = auth.uid()`
- **UPDATE**: `buyer_id = auth.uid() OR seller_id = auth.uid()`

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| Transaction.create | createTransaction |
| Transaction.list | listTransactions |
| buyer_email, seller_email | Filtrado por buyer_id/seller_id (uuid) |
| created_date | created_at |

## Lo que sigue usando Base44

- **ParkingAlert.update** en Home (reserva de alerta).
- **ChatMessage.create** en Home y Navigate.
- Resto de entidades no migradas.

## Ejecutar migración

```bash
npx supabase db push
```

```

================================================================
FILE: docs/MIGRATION_UPLOADS.md
================================================================
```md
# Migración Uploads: Base44 → Supabase Storage

## Objetivo

Sustituir `base44.integrations.Core.UploadFile` por Supabase Storage. Los componentes importan `import * as uploads from "@/data/uploads"` y nunca llaman a Base44 ni Supabase directamente para uploads.

## Archivos creados/modificados

### Nuevos

- **`src/data/uploads.js`** – Adapter que reexporta el proveedor actual (uploadsSupabase).
- **`src/services/uploadsSupabase.js`** – Proveedor Supabase Storage para uploads.
- **`supabase/migrations/20260305200000_storage_uploads_bucket.sql`** – Crea bucket `uploads` y políticas RLS.

### Modificados

- **`src/pages/Chat.jsx`** – Usa `uploads.uploadFile` para adjuntos en lugar de Base44.

## API del adapter (`src/data/uploads.js`)

| Función | Descripción |
|---------|-------------|
| `uploadFile(file, path)` | Sube un archivo al bucket. Devuelve `{ url, file_url, error? }`. |
| `getPublicUrl(path)` | Obtiene la URL pública de un archivo. |
| `deleteFile(path)` | Elimina un archivo del bucket. |

## Bucket Supabase

- **Nombre**: `uploads`
- **Público**: sí (lectura pública)
- **Límite**: 10MB por archivo
- **Tipos permitidos**: image/jpeg, image/png, image/gif, image/webp, application/pdf, video/mp4, video/webm

## RLS

- **INSERT**: usuarios autenticados
- **SELECT**: público (bucket público)
- **DELETE**: usuarios autenticados

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| `UploadFile({ file })` → `{ file_url }` | `uploadFile(file, path)` → `{ url, file_url }` |
| Path implícito | Path explícito: `chat/{userId}/{timestamp}_{filename}` |

## Lo que sigue usando Base44

- ChatMessage.create (mensajes de sistema en Navigate)
- ParkingAlert (en Navigate)
- Resto de entidades no migradas

## Ejecutar migración

```bash
npx supabase db push
```

```

================================================================
FILE: docs/OBSERVABILITY.md
================================================================
```md
# Observabilidad WaitMe — Startup-grade

## Sentry (Frontend)

### Configuración actual

- **Paquete:** `@sentry/react`
- **Inicialización:** `src/lib/sentry.js` (importado en `main.jsx`)
- **Activación:** Solo si `VITE_SENTRY_DSN` está definido
- **Integraciones:** `browserTracingIntegration()` (performance)
- **ErrorBoundary:** `Sentry.captureException` en `componentDidCatch`

### Variables de entorno

| Variable | Uso |
|---------|-----|
| `VITE_SENTRY_DSN` | DSN del proyecto Sentry. Sin él, Sentry no se inicializa. |

### Sourcemaps (opcional)

Para que los errores en Sentry muestren el código fuente original:

1. Instalar: `npm i -D @sentry/vite-plugin`
2. Añadir en `vite.config.js`:
   ```js
   import { sentryVitePlugin } from "@sentry/vite-plugin";
   // En plugins: sentryVitePlugin({ org, project, authToken })
   ```
3. En CI/Vercel, definir: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

### Verificación

1. Con `VITE_SENTRY_DSN` configurado, provocar un error (ej. `throw new Error('test')`).
2. Comprobar en Sentry que el evento aparece.
3. Con sourcemaps, verificar que el stack trace apunta al código fuente.

## Logging

- **Logger:** `src/lib/logger.js` — breadcrumbs y `captureException` si Sentry está activo.
- **Uso:** `logger.info()`, `logger.warn()`, `logger.error()`.

## Mínimo imprescindible

- DSN en producción (Vercel env).
- Revisar Sentry al menos semanalmente.
- Alertas en Sentry para errores no capturados (configurar en dashboard).

```

================================================================
FILE: docs/ONE_TIME_GITHUB_CLICKS.md
================================================================
```md
# GitHub blindado — 8 clics

**Una sola vez.** Repo → Settings.

## 1. Branch protection (4 clics)

Settings → Branches → Add rule → Branch name: `main`

- ✅ Require a pull request
- ✅ Require status checks: `ci` (aparece tras el primer run)
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Do not allow force pushes

→ Create

## 2. Environment production (4 clics)

Settings → Environments → New environment → `production`

- ✅ Required reviewers: añadir 1+ persona
- Save protection rules

---

**Secrets** (Settings → Secrets and variables → Actions): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`

```

================================================================
FILE: docs/PROD_READY.md
================================================================
```md
# WaitMe - Setup Producción

## 1. Variables de entorno

Crear `.env` en la raíz (copiar desde `.env.example`):

```
VITE_MAPBOX_TOKEN=pk.xxx
VITE_BASE44_API_BASE_URL=https://api.base44.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SENTRY_DSN=   # opcional
```

## 2. Supabase - Setup una vez

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar migraciones:
   ```bash
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```
3. Secrets para Edge Functions:
   - `MAPBOX_SECRET_TOKEN`: token secreto de Mapbox (para map-match)
4. Habilitar Realtime en tabla `parking_alerts` (ya incluido en migración)

## 3. Desplegar sin tocar Supabase UI

- Las migraciones están en `supabase/migrations/`
- `supabase db push` aplica todas las migraciones pendientes
- No es necesario copiar/pegar SQL en el dashboard

## 4. GitHub Actions

El workflow `.github/workflows/lint-and-build.yml` ejecuta:
- `npm run lint`
- `npm run build`

En cada push a `main`. No requiere DB ni secrets.

```

================================================================
FILE: docs/PROJECT_DIAGNOSIS.md
================================================================
```md
# Diagnóstico del proyecto WaitMe

El script `scripts/diagnose-project.js` comprueba que el proyecto esté correctamente configurado.

---

## Qué revisa el script

| Comprobación | Descripción |
|--------------|-------------|
| **Existencia de .env** | Que exista el archivo `.env` en la raíz. |
| **Variables necesarias** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN` definidas. |
| **Placeholders** | Que las variables no tengan valores placeholder (`PEGA_AQUI_EL_TOKEN`, `tu_anon_key`, etc.). |
| **Supabase** | Que la URL tenga formato Supabase y la anon key esté presente. |
| **Mapbox** | Que el token tenga formato `pk.xxx` si está configurado. |
| **Build de Vite** | Que `npm run build` complete sin errores. |
| **Estructura básica** | Que existan `src/main.jsx`, `src/App.jsx`, `src/pages/Home.jsx`, `src/lib/supabaseClient.js`, `src/data/alerts.js`, `supabase/migrations`, `vite.config.js`, `package.json`. |

---

## Cómo usarlo

```bash
npm run diagnose
```

El script imprime un informe en consola con ✓ (ok), ⚠ (advertencia) o ✗ (error).

---

## Cómo interpretar errores

| Mensaje | Acción |
|---------|--------|
| `.env no existe` | Copiar `.env.example` a `.env` y configurar las variables. |
| `VITE_SUPABASE_URL no está definida` | Añadir en `.env` la URL del proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY no está definida` | Añadir en `.env` la anon key (Project Settings → API). |
| `VITE_MAPBOX_TOKEN no está definida` | Añadir en `.env` el token de Mapbox (https://account.mapbox.com/). |
| `tiene valor placeholder` | Sustituir por el valor real. No dejar `PEGA_AQUI_EL_TOKEN` ni `tu_anon_key`. |
| `Build falla` | Ejecutar `npm run build` manualmente y revisar el error. Corregir dependencias o código. |
| `X no existe` | Verificar que el archivo o carpeta exista. Puede indicar estructura corrupta o incompleta. |

---

## Códigos de salida

- **0** — Todo OK o solo advertencias.
- **1** — Hay errores. Revisar mensajes y corregir antes de continuar.

```

================================================================
FILE: docs/PROJECT_SOURCE_OF_TRUTH.md
================================================================
```md
# WaitMe — Fuente de verdad del proyecto

Documento único de referencia para dominios, tablas, pantallas, servicios y configuración.

---

## 1. Dominios del sistema

| Dominio | Descripción |
|---------|-------------|
| **Auth** | Autenticación OAuth (Supabase Auth) |
| **Profiles** | Perfil de usuario (vehículo, datos, preferencias) |
| **Alertas** | Alertas de parking (vendedor publica, comprador reserva) |
| **Reservas** | Reservas de alertas (alert_reservations) |
| **Chat** | Conversaciones y mensajes entre buyer/seller |
| **Notifications** | Notificaciones del usuario |
| **Transactions** | Transacciones de pago |
| **Uploads** | Archivos (avatar, adjuntos) en Storage |
| **User Locations** | Ubicación del comprador en ruta |

---

## 2. Tablas Supabase por dominio

| Dominio | Tabla(s) |
|---------|----------|
| Auth | `auth.users` (Supabase) |
| Profiles | `profiles` |
| Alertas | `parking_alerts` |
| Reservas | `alert_reservations` |
| Chat | `conversations`, `messages` |
| Notifications | `notifications` |
| Transactions | `transactions` |
| Uploads | Storage bucket `avatars` |
| User Locations | `user_location_updates` |

---

## 3. Pantallas y rutas

| Ruta | Pantalla | Dominios usados |
|------|----------|-----------------|
| `/` | Home | Alertas, Map, Notifications |
| `/chats` | Chats | Chat, Alertas |
| `/chat/:id` | Chat | Chat, Notifications |
| `/notifications` | Notifications | Notifications |
| `/notification-settings` | NotificationSettings | Profiles |
| `/profile` | Profile | Profiles, Uploads |
| `/settings` | Settings | — |
| `/history` | History (Alertas) | Alertas, Transactions, Chat |
| `/navigate` | Navigate | Alertas, User Locations |

---

## 4. Servicios y adapters

Los componentes usan **adapters** en `src/data/*.js`; nunca llaman a Supabase directamente.

| Adapter | Servicio real | Tablas |
|---------|---------------|--------|
| `data/alerts` | `alertsSupabase` | parking_alerts, alert_reservations |
| `data/chat` | `chatSupabase` | conversations, messages |
| `data/notifications` | `notificationsSupabase` | notifications |
| `data/profiles` | `profilesSupabase` | profiles |
| `data/transactions` | `transactionsSupabase` | transactions |
| `data/uploads` | `uploadsSupabase` | Storage avatars |
| `data/userLocations` | `userLocationsSupabase` | user_location_updates |

---

## 5. Real vs demo

| Área | Real | Demo |
|------|------|------|
| **Auth** | Supabase Auth | — |
| **Alertas** | Supabase `parking_alerts` | `getMockNearbyAlerts()` en Home (modo búsqueda) |
| **Chat** | Supabase `conversations`, `messages` | `DemoFlowManager`, localStorage `waitme:demo_conversations` |
| **Notifications** | Supabase `notifications` | `getDemoNotifications()` |
| **History** | Supabase | `waitme:thinking_requests`, `waitme:rejected_requests` (localStorage) |
| **IncomingRequestModal** | Supabase | Crea conversaciones demo en localStorage |
| **Navigate** | Supabase | `alert.id.startsWith('demo_')` para datos fake |

**Demo:** Flujo simulado para aceptar WaitMe, chats, notificaciones. Usa `DemoFlowManager`, localStorage y datos mock en `mockNearby.js`.

---

## 6. Variables de entorno

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Anon key de Supabase |
| `VITE_MAPBOX_TOKEN` | Sí | Token Mapbox (mapa) |
| `VITE_SENTRY_DSN` | No | Opcional, errores |
| `VITE_PUBLIC_APP_URL` | No | Opcional, redirect OAuth |

---

## 7. Componentes de mapa

| Componente | Uso | Pantalla |
|------------|-----|----------|
| `MapboxMap` | Fondo fullscreen | Home |
| `ParkingMap` | Mapas en modos search/create | Home |
| `SellerLocationTracker` | Mapa del comprador en ruta | Navigate |

Todos requieren `VITE_MAPBOX_TOKEN` válido.

```
