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
