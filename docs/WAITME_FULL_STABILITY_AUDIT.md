# Auditoría exhaustiva — Estabilidad del mapa WaitMe

**Fecha:** 2025-03-06  
**Objetivo:** Identificar último estado estable y restaurar baseline antes de reimplementar cambios.

---

## 1. Estado actual real del proyecto

### Problemas confirmados por el usuario

1. **Mapa invisible** — El mapa no se renderiza o no es visible.
2. **Botones de zoom mal colocados** — No están donde se pidió (10px debajo del menú, alineados con borde izquierdo de la tarjeta).
3. **Drag del mapa roto** — No se puede arrastrar con un dedo.
4. **Pinch zoom roto** — No se puede hacer zoom con dos dedos.
5. **Dirección en tiempo real rota** — El campo no se actualiza al mover el mapa.
6. **Regresiones encadenadas** — Demasiados parches sin resolver causa raíz.
7. **Necesidad de punto estable** — Recuperar baseline funcional.

### Estado técnico actual (HEAD = 2a439cb)

- **MapboxMap:** Contenedor vacío interno para Mapbox; `containerRef` en div hijo vacío; `touchAction` solo en ese div.
- **CreateMapOverlay:** Tarjeta `fixed`; sin wrapper fullscreen; pin y zoom como siblings.
- **SearchMapOverlay:** Sin wrapper fullscreen; elementos `fixed`/`absolute`.
- **MapZoomControls:** `zoomIn`/`zoomOut` con fallback `easeTo`.

---

## 2. Arquitectura real del mapa create/search

```
Home.jsx
├── MapboxMap (absolute inset-0 z-0)
│   ├── div (contenedor Mapbox — actualmente vacío, ref=containerRef)
│   ├── CenterPin (si useCenterPin && !centerPinFromOverlay)
│   └── children:
│       ├── CreateMapOverlay (mode === 'create')
│       │   ├── tarjeta (fixed)
│       │   ├── pin (absolute, pointer-events-none)
│       │   └── MapZoomControls (absolute)
│       └── SearchMapOverlay (mode === 'search')
│           ├── filtros (fixed)
│           ├── StreetSearch (fixed)
│           ├── UserAlertCard (fixed)
│           ├── pin (absolute)
│           └── MapZoomControls (absolute)
└── div contenido (z-10, pointer-events-none cuando mode)
```

### Fuente de verdad del mapa

- **Instancia:** `mapRef.current` asignado en `onMapLoad` de MapboxMap.
- **Centro:** `map.getCenter()` en eventos `move`/`moveend`.
- **Zoom/recenter:** `mapRef.current.zoomIn()`, `zoomOut()`, `flyTo()`.

### Fuente de verdad de la dirección

- **Estado:** `address` en Home; `selectedPosition` { lat, lng }.
- **Actualización:** `handleMapMove` / `handleMapMoveEnd` → `debouncedReverseGeocode` → `reverseGeocode` → `setAddress`.
- **Problema:** Si el mapa no recibe gestos, `move`/`moveend` no se disparan.

### Acoplamientos frágiles

- Offsets hardcodeados: `HEADER_BOTTOM=60`, `MAP_TOP_VIEWPORT=69`, `bottom: 90px + safe`.
- Posición del pin calculada con ResizeObserver sobre la tarjeta.
- `centerPaddingBottom` distinto para create (280) vs search (120).

### Duplicaciones

- Reverse geocode en `handleMapMoveEnd` (682afa4) vs `debouncedReverseGeocode` (actual).
- Lógica de pin en CreateMapOverlay y SearchMapOverlay con constantes duplicadas.

---

## 3. Historial reciente de cambios del mapa

| Commit | Resumen |
|--------|---------|
| 2a439cb | Contenedor vacío para Mapbox; dragPan/touchZoomRotate/touchPitch; **posible causa de mapa invisible** |
| 8a78540 | Quitar wrapper fullscreen CreateMapOverlay; debounce 150ms; zoom left calc(4%+1rem) |
| 7491092 | Quitar overlay oscurecido; reposicionar zoom |
| 5740de9 | Forensic repair; CreateMapOverlay con overlay; debouncedReverseGeocode |
| 5c58ab9 | CreateMapOverlay, SearchMapOverlay, MapZoomControls como children de MapboxMap |
| 9d2cbb8 | Crear CreateMapOverlay; centerPinFromOverlay; touchAction: none |
| 11b138e | Pin fijo estilo Uber |
| 8f7fad9 | Unificar mapa; useCenterPin, onMapMove, onMapMoveEnd |
| 682afa4 | Create card flotante; overlay como sibling; MapboxMap sin overlays como children |
| c70ba0f | Restore map stability; min-h-[100dvh]; docs |

---

## 4. Último commit estable identificado

**Recomendación:** `8a78540` (fix: final blocker repair for create map drag, live address and zoom placement)

**Razón:** Es el último commit antes de 2a439cb que introdujo el contenedor vacío. El usuario confirma que el mapa es ahora invisible; 8a78540 tenía el mapa visible (containerRef en el root div). Los problemas de drag/pinch/zoom/dirección existían ya en 8a78540, pero el mapa se veía.

**Alternativa más conservadora:** `5740de9` — tiene CreateMapOverlay con overlay fullscreen; el mapa se veía porque containerRef estaba en el root.

---

## 5. Regresiones introducidas después de 8a78540

| Commit | Archivo | Regresión |
|--------|---------|-----------|
| 2a439cb | MapboxMap.jsx | **Mapa invisible:** containerRef movido a div interno vacío; posible fallo de dimensionado o renderizado de Mapbox en ese contenedor |
| 2a439cb | SearchMapOverlay.jsx | Overlay fullscreen eliminado; elementos fixed; puede afectar layout en search |
| 2a439cb | CreateMapOverlay.jsx | Tarjeta a fixed (restauración de posición) — no regresión |
| 2a439cb | MapZoomControls.jsx | Fallback easeTo — mejora, no regresión |

---

## 6. Causa raíz

### Mapa invisible

**Causa:** En 2a439cb se movió `containerRef` del div raíz al div interno vacío. Mapbox recibe ese div. Posibles causas:
- El div interno con `absolute inset-0` no obtiene dimensiones correctas en ciertos layouts.
- El orden de render (map primero, overlays después) cambió y algo tapa el mapa.
- Mapbox GL tiene requisitos específicos sobre el contenedor que no se cumplen.

**Evidencia:** En 8a78540 el mapa se veía con containerRef en el root. La única diferencia estructural en 2a439cb es el contenedor vacío.

### Drag roto

**Causa:** Overlay fullscreen `fixed inset-0 top-[60px]` (en 5740de9 y anteriores) con `pointer-events-none` puede interferir con hit-testing en iOS. Eliminar el overlay (8a78540) debería mejorar, pero el mapa invisible impide validar.

### Pinch zoom roto

**Causa:** Misma que drag; además `touch-action` en el contenedor afecta la propagación de gestos.

### Zoom mal colocado

**Causa:** `left: calc(4% + 1rem)` puede no coincidir con el borde izquierdo real de la tarjeta (que usa `left-1/2 -translate-x-1/2 w-[92%]`).

### Dirección no actualizada

**Causa:** Si drag no funciona, `move`/`moveend` no se disparan; `handleMapMove`/`handleMapMoveEnd` no se llaman; `debouncedReverseGeocode` no se ejecuta.

### Tarjeta desplazada

**Causa:** Cambio de `absolute` (relativo al contenedor MapboxMap) a `fixed` (relativo al viewport) en 2a439cb para restaurar posición; el contenedor MapboxMap está dentro de main con padding, por lo que las coordenadas difieren.

---

## 7. Recomendación exacta de restauración

**Estrategia:** Restauración controlada de archivos afectados al estado de `8a78540`, sin tocar Supabase ni pantallas no relacionadas.

**Archivos a restaurar desde 8a78540:**

1. **MapboxMap.jsx** — Revertir cambio de 2a439cb: `containerRef` de vuelta al root div; quitar div interno vacío; mantener `touchAction: 'none'` en el root; quitar dragPan/touchZoomRotate/touchPitch explícitos (eran default).
2. **SearchMapOverlay.jsx** — Restaurar al estado 8a78540 (con overlay fullscreen) para mantener consistencia con create.
3. **CreateMapOverlay.jsx** — Mantener estado 8a78540 (sin wrapper fullscreen, tarjeta absolute).
4. **MapZoomControls.jsx** — Restaurar al estado 8a78540 (zoomIn/zoomOut directos, left: 4%).

**No tocar:** Home.jsx (salvo que sea necesario para compatibilidad), Supabase, History, Chat, CreateAlertCard, otras pantallas.

---

## 8. Plan correcto para rehacer esta pantalla sin romperla

1. **Baseline estable:** Dejar el mapa visible, tarjeta en sitio, sin parches adicionales.
2. **Un cambio a la vez:** Cada fix (drag, pinch, zoom, dirección) en un commit separado.
3. **Validar en iOS Simulator** tras cada cambio.
4. **No violar requisito Mapbox:** Si se añaden overlays como children, considerar moverlos fuera del contenedor que se pasa a Mapbox, o usar un wrapper con contenedor vacío solo para el mapa.
5. **Documentar** cada cambio en docs antes de implementar.
