# Auditoría final — Bloqueadores pantalla "Estoy aparcado aquí"

**Fecha:** 2025-03-06  
**Objetivo:** Solución definitiva tipo Uber.

---

## 1. Causa raíz del drag roto

**Problema:** El mapa no se arrastra en iOS Simulator.

**Causa:** El overlay CreateMapOverlay usaba un `div` con `fixed inset-0 top-[60px]` que cubría toda el área entre header y bottom. Aunque tenía `pointer-events-none`, en iOS/Safari un elemento fullscreen encima del canvas puede interferir con el hit-testing o la propagación de eventos táctiles. El canvas de Mapbox quedaba "debajo" del overlay en el DOM; con pointer-events-none el evento debería pasar, pero en ciertas configuraciones iOS no llega correctamente al canvas.

**Solución aplicada:** Eliminar el wrapper fullscreen. Renderizar solo los elementos necesarios (tarjeta, pin, zoom) como siblings del canvas, sin ningún div que cubra la zona de drag. La zona libre queda sin elementos → el canvas recibe los gestos directamente.

---

## 2. Causa raíz de la dirección fija en "Oviedo"

**Problema:** El campo no cambiaba en tiempo real al mover el mapa.

**Causas:**
1. Si el mapa no recibe eventos de drag, `move`/`moveend` nunca se disparan → `handleMapMove`/`handleMapMoveEnd` no se llaman → `selectedPosition` y `debouncedReverseGeocode` no se ejecutan.
2. Debounce de 300ms puede sentirse lento para "tiempo real".

**Solución aplicada:** Arreglar el drag primero. Reducir debounce a 150ms para feedback más rápido. Mantener última dirección válida en fallo.

---

## 3. Causa raíz del zoom mal colocado

**Problema:** Los botones no estaban donde se pidió.

**Causa:** `left: 4%` podía no coincidir exactamente con el borde izquierdo de la tarjeta (que usa `left-1/2 -translate-x-1/2 w-[92%]`). En viewports estrechos el 4% podía quedar pegado al borde.

**Solución aplicada:** Usar `left: calc(4% + 1rem)` para alinear con el borde izquierdo de la tarjeta con un pequeño margen, sin pegar al borde de pantalla.

---

## 4. Solución exacta aplicada

1. **CreateMapOverlay:** Eliminado el div wrapper fullscreen. Renderiza solo card, pin y zoom como siblings del canvas, sin overlay que cubra.
2. **Drag:** Sin overlay que cubra, el canvas recibe directamente los touch en la zona libre.
3. **Dirección:** handleMapMove/handleMapMoveEnd ya existentes; debounce reducido a 150ms.
4. **Zoom:** top: 10px, left: calc(4% + 1rem).
5. **Pin:** Posición calculada en coordenadas del contenedor MapboxMap (MAP_TOP_VIEWPORT = 69).

---

## 5. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| CreateMapOverlay.jsx | Quitar wrapper fullscreen; renderizar card, pin, zoom sin overlay; pin en coords MapboxMap |
| Home.jsx | Debounce 150ms |
| MapZoomControls.jsx | left: calc(4% + 1rem) |

---

## 6. Validación real

1. Arrastrar en zona libre → canvas recibe → move/moveend se disparan.
2. handleMapMove actualiza selectedPosition y llama debouncedReverseGeocode.
3. reverseGeocode actualiza address con setAddress.
4. Zoom: mapRef.current.zoomIn/zoomOut.
5. Reubicar: handleRecenter con mapRef.current.flyTo.
6. Zoom controls: top: 10px, left: calc(4% + 1rem).
