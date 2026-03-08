# Auditoría — Unificación del Mapa

**Fecha:** 2025-03-06  
**Objetivo:** Unificar el shell del mapa para que web, iOS Simulator e iPhone real muestren la misma geometría.

---

## A. Componentes actuales implicados

| Componente | Función |
|------------|---------|
| `MapViewportShell.jsx` | Shell unificado (nuevo). Fuente única de verdad para viewport, mapa y overlays. |
| `MapScreenShell.jsx` | Re-export de MapViewportShell (compatibilidad). |
| `MapScreenPanel.jsx` | Posicionamiento de tarjetas flotantes. paddingBottom = var(--bottom-nav-h) + 10px. |
| `MapLayer.jsx` | Capa del mapa (absolute inset-0). |
| `OverlayLayer.jsx` | Capa de overlays (absolute inset-0). |
| `CreateMapOverlay.jsx` | Overlay "Estoy aparcado aquí". Usa MapScreenPanel + CreateAlertCard. |
| `SearchMapOverlay.jsx` | Overlay "Dónde quieres aparcar". Usa MapScreenPanel + UserAlertCard. |
| `MapboxMap.jsx` | Mapa Mapbox. minHeight: 100dvh. |
| `Home.jsx` | Página principal. Usa MapViewportShell. |

---

## B. Duplicidades detectadas (y eliminadas)

1. **SearchMapOverlay usaba `fixed` + `height: calc(100dvh - 60px)` + `paddingBottom: 88px`**  
   CreateMapOverlay usaba `absolute` + MapScreenPanel con `paddingBottom: 150px`.  
   → Unificado: ambos usan MapScreenPanel con `paddingBottom: calc(env(safe-area-inset-bottom) + 150px)`.

2. **MapScreenShell vs MapViewportShell**  
   MapScreenShell era redundante.  
   → MapViewportShell es la fuente única; MapScreenShell re-exporta.

3. **Valores hardcodeados (60px, 88px, 150px)**  
   → Sustituidos por `--header-h`, `--bottom-nav-h` y `CARD_NAV_GAP_PX`.

---

## C. Archivos confusos o redundantes

- `MapScreenShell.jsx`: antes duplicaba lógica; ahora es thin wrapper de MapViewportShell.
- `SearchMapOverlay.jsx`: usaba `fixed` (viewport) en lugar de `absolute` (shell), causando diferencias iOS vs web.

---

## D. Archivos como fuente única de verdad

| Concepto | Archivo |
|----------|---------|
| Shell del mapa | `MapViewportShell.jsx` |
| Posición tarjeta / gap nav | `MapScreenPanel.jsx` |
| Variables CSS (header, nav) | `globals.css` (:root) |

---

## E. Cálculos de viewport/safe-area eliminados

- `100vh` en MapboxMap (fallback) → solo `100dvh`.
- `paddingBottom: calc(env(safe-area-inset-bottom) + 88px)` en SearchMapOverlay → eliminado (usa MapScreenPanel).
- `paddingBottom: calc(env(safe-area-inset-bottom) + 88px)` en SearchMapOverlay → eliminado (usa MapScreenPanel).
- `height: calc(100dvh - 60px)` en SearchMapOverlay → `top: var(--header-h)` + `bottom: 0` (absolute).
- `fixed inset-0 top-[60px]` en SearchMapOverlay → `absolute` dentro del shell.

---

## F. Riesgos evitados

1. **Viewport iOS:** `100vh` en Safari/iOS incluye la barra de direcciones; `100dvh` usa el viewport dinámico.
2. **Safe area:** Uso de `env(safe-area-inset-*)` y `--bottom-nav-h` evita solapamientos con notch/home indicator.
3. **Fixed vs absolute:** `fixed` depende del viewport del navegador; `absolute` dentro del shell da consistencia.

---

## G. Cómo validar igualdad visual

1. **Web:** `npm run dev` → Home → "Estoy aparcado aquí" y "Dónde quieres aparcar" → comprobar gap tarjeta-nav.
2. **iOS Simulator:** `npm run dev:ios` o `npm run ios:run` → mismo flujo.
3. **iPhone real:** Build con Xcode, instalar en dispositivo.
4. **Tests:** `npm run test:e2e tests/visual/measure-card-nav-gap.spec.js` (gap 8–14px).
5. **Screenshot:** `tests/visual/create-card-position.spec.js` para regresión visual.
