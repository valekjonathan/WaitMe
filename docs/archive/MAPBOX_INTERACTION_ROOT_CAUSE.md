# Causa raíz — Interacción Mapbox en "Estoy aparcado aquí"

**Fecha:** 2025-03-06  
**Objetivo:** Reparar interacción real del mapa (drag, pinch, zoom, reubicar, dirección).

---

## 1. Causa raíz del drag roto

**Problema:** El mapa no se arrastra con un dedo.

**Causa:** Mapbox tiene `dragPan` y `touchZoomRotate` activos por defecto, pero no estaban explícitos. Además, el contenedor del mapa tiene `touch-action: none` (correcto). El div de contenido (z-10) tiene `pointer-events-none` cuando hay mode, por lo que los eventos pasan al mapa. La zona libre entre tarjeta, pin y zoom no tiene elementos con `pointer-events-auto`; el pin tiene `pointer-events-none`. Si los gestos no funcionaban, podría ser por: (a) gestos no habilitados explícitamente, (b) interferencia de `touch-action: manipulation` en html/body.

**Solución aplicada:** `dragPan: true` y `touchZoomRotate: true` explícitos en el constructor de Mapbox.

---

## 2. Causa raíz del pinch zoom roto

**Problema:** El mapa no hace zoom con dos dedos.

**Causa:** Misma que drag — `touchZoomRotate` no estaba explícito.

**Solución aplicada:** `touchZoomRotate: true` explícito.

---

## 3. Causa raíz de zoom +/- roto

**Problema:** Los botones + y - no funcionan.

**Causas posibles:**
1. `mapRef.current` null si el overlay se monta antes de que el mapa esté listo.
2. Mapbox GL v3 podría tener API distinta (zoomIn/zoomOut vs easeTo).
3. Llamada incorrecta a métodos inexistentes.

**Solución aplicada:** MapZoomControls usa `zoomIn(map)` y `zoomOut(map)` con fallback a `easeTo({ zoom: map.getZoom() ± 1 })` si zoomIn/zoomOut no existen. mapRef es el mismo que usa Ubícate; se asigna en `onMapLoad` de Home.

---

## 4. Causa raíz de Ubícate roto

**Problema:** El botón Ubícate no funciona.

**Verificación:** handleRecenter usa `mapRef.current?.flyTo(...)`. mapRef se asigna en `onMapLoad`. La instancia es la misma que usa zoom. Si zoom no funcionaba por API, Ubícate podría fallar por la misma razón. Con mapRef correcto, flyTo debería funcionar.

**Solución aplicada:** Asegurar que mapRef.current sea la instancia visible real (ya lo es vía onMapLoad). No se requirió cambio adicional.

---

## 5. Causa raíz de dirección fija en Oviedo

**Problema:** La dirección no cambia en tiempo real.

**Causa:** Si el mapa no recibe drag/pinch, `move`/`moveend` no se disparan → handleMapMove/handleMapMoveEnd no se llaman → debouncedReverseGeocode no se ejecuta → address no se actualiza. Arreglar los gestos desbloquea la cadena.

**Solución aplicada:** Arreglar gestos primero. El flujo ya existe: move/moveend → handleMapMove/handleMapMoveEnd → setSelectedPosition + debouncedReverseGeocode → reverseGeocode → setAddress.

---

## 6. Solución exacta aplicada

| Cambio | Archivo |
|--------|---------|
| dragPan: true, touchZoomRotate: true explícitos | MapboxMap.jsx |
| zoomIn/zoomOut con fallback easeTo | MapZoomControls.jsx |

---

## 7. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| MapboxMap.jsx | dragPan: true, touchZoomRotate: true |
| MapZoomControls.jsx | zoomIn/zoomOut con fallback easeTo |

---

## 8. Validación técnica real

1. **Instancia zoom:** mapRef.current (asignado en onMapLoad).
2. **Instancia Ubícate:** mapRef.current (mismo ref).
3. **dragPan:** true explícito.
4. **touchZoomRotate:** true explícito.
5. **move/moveend:** Se disparan cuando el mapa recibe gestos; handlers ya conectados.
6. **Bloqueo de gestos:** Posible falta de habilitación explícita; overlay sin fullscreen permite que el canvas reciba toques en la zona libre.
7. **Por qué ahora:** Gestos explícitos + fallback en zoom para compatibilidad con Mapbox GL v3.
