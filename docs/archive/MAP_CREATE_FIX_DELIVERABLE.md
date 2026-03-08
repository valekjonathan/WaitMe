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
