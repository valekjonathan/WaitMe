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
