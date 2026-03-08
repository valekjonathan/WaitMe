# Auditoría causa raíz — Sistema de posicionamiento mapa/pin/tarjeta/nav

**Fecha:** 2025-03-06  
**Objetivo:** Identificar causa raíz de desplazamientos y establecer una única fuente de verdad.

---

## 1. Relación entre archivos

```
Layout.jsx
├── Header (data-waitme-header) — fixed top, ~69px
├── main (pt-[69px] pb-24)
│   └── Home
│       └── MapViewportShell
│           ├── MapLayer → MapboxMap (mapa)
│           └── OverlayLayer → CreateMapOverlay
│               ├── MapScreenPanel (data-map-screen-panel)
│               │   └── CreateAlertCard
│               ├── CenterPin (posicionado por CreateMapOverlay)
│               └── MapZoomControls
└── BottomNav (data-waitme-nav) — fixed bottom
```

| Archivo | Responsabilidad |
|---------|-----------------|
| **MapboxMap.jsx** | Mapa Mapbox, `setPadding`, `flyTo`/`easeTo` con padding, marcadores |
| **MapScreenPanel.jsx** | Layout del panel flotante, `paddingBottom` (gap tarjeta/nav) |
| **CreateAlertCard.jsx** | Tarjeta de configuración, botón Ubícate, `getMapPadding` duplicado |
| **CreateMapOverlay.jsx** | Orquesta panel + pin + zoom, posiciona CenterPin con ResizeObserver |
| **CenterPin.jsx** | Pin visual (bolita + palito), recibe `top` en px |
| **Header** | `data-waitme-header`, altura ~69px |
| **BottomNav** | `data-waitme-nav`, `--bottom-nav-h` = 64px + safe-area |

---

## 2. Cambios recientes que rompieron la geometría

### 2.1 MapScreenPanel.jsx (commit 5216e87)

| Antes | Después |
|-------|---------|
| `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + 150px)` | `paddingBottom: calc(20px + var(--bottom-nav-h, 64px))` |

**Problema:** Se eliminó `env(safe-area-inset-bottom)` del cálculo. `--bottom-nav-h` ya incluye safe-area (`64px + env(safe-area-inset-bottom)`), por lo que la fórmula nueva es correcta. Pero el valor 150px original era un margen amplio que podía compensar otras imprecisiones.

**Riesgo:** En dispositivos con safe-area grande, `var(--bottom-nav-h)` puede no estar definido en el contexto del panel (herencia CSS). Fallback 64px ignora safe-area.

### 2.2 MapboxMap.jsx (commit 5216e87)

| Cambio | Impacto |
|--------|---------|
| `getMapPadding()` dinámico (mide DOM) | Padding depende de medición en runtime. Si panel/header/nav no están montados o tienen tamaño 0, fallback a valores fijos. |
| `setPadding` con padding dinámico | Se aplica padding global al mapa. Si `getMapPadding()` devuelve valores incorrectos (p. ej. panelRect antes de layout), el centro visual se desplaza. |
| `easeTo` en lugar de `flyTo` | Cambio menor; ambos aceptan padding. |

**Problema raíz:** `getMapPadding()` mide `panelRect` = `[data-map-screen-panel]`. Ese elemento es el contenedor del panel, no la tarjeta. La altura del panel incluye el `paddingBottom` interno. Además, la medición puede ejecutarse antes de que el layout esté estabilizado (ResizeObserver del pin, etc.).

### 2.3 CreateAlertCard.jsx (commit 5216e87)

| Cambio | Impacto |
|--------|---------|
| `getMapPadding()` duplicado | Misma lógica que MapboxMap. Duplicación = riesgo de desincronización. |
| `handleLocate` usa `easeTo` con padding | Al pulsar Ubícate, se recalcula padding. Si la medición falla, el centro se desplaza. |

### 2.4 CreateMapOverlay.jsx (sin cambios recientes)

| Constante | Valor | Problema |
|-----------|-------|-----------|
| `HEADER_BOTTOM` | 60 | **Incorrecto.** `--header-h` = 69px. El centro se calcula 4.5px más alto de lo debido. |
| `MAP_TOP_VIEWPORT` | 69 | Correcto (main tiene pt-[69px]) |
| `PIN_HEIGHT` | 54 | CenterPin real: 18px (bolita) + 36px (palito) = 54. Correcto. |

---

## 3. Causa raíz

### 3.1 Centro visual del pin incorrecto

**Causa:** `CreateMapOverlay` usa `HEADER_BOTTOM = 60` en lugar de 69. El punto medio se calcula como `(60 + cardTop) / 2` en vez de `(69 + cardTop) / 2`, desplazando el pin ~4.5px hacia arriba.

**Solución:** Usar `--header-h` (69px) o medir `[data-waitme-header]` en runtime.

### 3.2 Padding del mapa y medición DOM

**Causa:** `getMapPadding()` mide `[data-map-screen-panel]`. Ese elemento tiene estructura:
- Contenedor con `paddingBottom`
- Hijo con la tarjeta

`panelRect.height` es la altura del contenedor completo. Para el padding del mapa necesitamos:
- `top` = headerBottom (borde inferior del header)
- `bottom` = altura del área visible entre header y tarjeta + margen

El padding de Mapbox define el "centro visual": el punto geográfico central se dibuja en el centro del área excluyendo el padding. Para que el pin (que está en overlay) coincida con el centro del mapa, el padding del mapa debe reflejar exactamente las mismas coordenadas que usa CreateMapOverlay para el pin.

**Confusión:** El pin se posiciona con ResizeObserver en CreateMapOverlay. El mapa usa `setPadding` con valores de `getMapPadding()`. Si ambos no usan la misma definición de "centro", habrá desalineación.

### 3.3 Gap tarjeta/nav

**Fórmula correcta:** `paddingBottom = 20px + var(--bottom-nav-h)`.

**Riesgo:** Si `--bottom-nav-h` no está en scope (p. ej. en un iframe o contexto aislado), el fallback 64px no incluye safe-area. Restaurar `env(safe-area-inset-bottom)` como respaldo:

```css
paddingBottom: calc(20px + var(--bottom-nav-h, calc(64px + env(safe-area-inset-bottom, 0px))))
```

### 3.4 Duplicación getMapPadding

**Causa:** CreateAlertCard y MapboxMap tienen implementaciones duplicadas. Cualquier corrección debe hacerse en ambos sitios.

**Solución:** Extraer a un único helper (ej. `getMapLayoutPadding()`) y usarlo en ambos.

---

## 4. Qué revertir

| Archivo | Revertir | Motivo |
|---------|----------|--------|
| MapScreenPanel | Parcial | Mantener fórmula `20px + var(--bottom-nav-h)` pero asegurar que safe-area esté cubierta si --bottom-nav-h falla |
| MapboxMap | No revertir | La lógica de padding dinámico es correcta; corregir la fuente de los valores |
| CreateAlertCard | No revertir | Ubícate con easeTo es correcto; eliminar duplicación de getMapPadding |
| CreateMapOverlay | Corregir HEADER_BOTTOM | 60 → 69 (o usar --header-h) |

---

## 5. Fuente única de verdad propuesta

| Concepto | Fuente | Fórmula |
|---------|--------|---------|
| **headerBottom** | `--header-h` (globals.css) o `[data-waitme-header].getBoundingClientRect().bottom` | 69px (constante) o medida |
| **cardTop** | `[data-map-screen-panel]` o hijo directo | `getBoundingClientRect().top` |
| **centerGapExpected** | Cálculo | `(headerBottom + cardTop) / 2` |
| **pinBottomY** | CenterPin | `pinTop + 54` (en viewport) |
| **gap tarjeta/nav** | MapScreenPanel | `20px + var(--bottom-nav-h)` |
| **padding mapa** | Helper único | `{ top: headerBottom, bottom: cardHeight + 20 + navHeight }` |

---

## 6. Orden de corrección

1. Crear `src/lib/mapLayoutPadding.js` con `getMapLayoutPadding()`.
2. CreateMapOverlay: `HEADER_BOTTOM` = 69 (o `var(--header-h)`).
3. MapboxMap: usar `getMapLayoutPadding()` en lugar de `getMapPadding` interno.
4. CreateAlertCard: usar `getMapLayoutPadding()` en lugar de `getMapPadding` interno.
5. MapScreenPanel: verificar fórmula con fallback safe-area.
6. Añadir test de layout que valide gap y centro.

---

## 7. Corrección aplicada (2025-03-06)

| Archivo | Cambio |
|---------|--------|
| **mapLayoutPadding.js** | Creado: `getMapLayoutPadding()`, `measureMapLayout()` |
| **CreateMapOverlay.jsx** | HEADER_BOTTOM=69, medir header en runtime, usar `[data-map-screen-panel-inner]` para cardTop |
| **MapboxMap.jsx** | Usar `getMapLayoutPadding()` en lugar de getMapPadding interno |
| **CreateAlertCard.jsx** | Usar `getMapLayoutPadding()`, añadir data-create-alert-card |
| **MapScreenPanel.jsx** | Fallback safe-area en paddingBottom, data-map-screen-panel-inner |
| **MapViewportShell.jsx** | En modo create: `height: calc(100dvh - 69px - 7px)` para lograr gap 20px |
| **CenterPin.jsx** | data-center-pin para medición |
| **tests/layout-map-create.spec.js** | Test que valida gapCardNav=20±1px y pin centrado ±2px |
