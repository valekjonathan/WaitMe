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
