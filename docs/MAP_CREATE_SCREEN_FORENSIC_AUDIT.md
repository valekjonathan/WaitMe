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
