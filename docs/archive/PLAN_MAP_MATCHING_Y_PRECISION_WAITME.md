# Plan Map Matching y Precisión — WaitMe

**Fecha:** 2025-03-07

---

## 1. DÓNDE SE ENCHUFARÍA MAP MATCHING

El punto de integración está en **locationEngine.js**:

```js
export function normalizePositionForMapMatching(raw) {
  return raw;  // Por ahora identity
}
```

Y en **normalizePosition** (interna), antes de notificar:

```js
function normalizePosition(pos) {
  const raw = { lat, lng, accuracy, timestamp };
  return normalizePositionForMapMatching(raw);
}
```

**Flujo actual:** `GeolocationPosition` → `normalizePosition` → `notify` → suscriptores  
**Flujo con map matching:** `GeolocationPosition` → `normalizePosition` → `normalizePositionForMapMatching` → `notify`

---

## 2. ENTRADAS Y SALIDAS

| Entrada | Salida |
|---------|--------|
| `{ lat, lng, accuracy?, timestamp }` | `{ lat, lng, accuracy?, timestamp }` |
| Coordenadas GPS raw | Coordenadas ajustadas a red viaria (o raw si no hay match) |

**API externa típica:** Mapbox Map Matching API, OSRM, GraphHopper.  
**Request:** secuencia de puntos (o punto único para snap).  
**Response:** coordenadas corregidas sobre la vía más próxima.

---

## 3. QUÉ PARTES DEL ENGINE YA ESTÁN LISTAS

- **locationEngine:** `normalizePositionForMapMatching` como punto de extensión
- **subscribeToLocation:** los suscriptores reciben la posición ya normalizada
- **getLastKnownLocation:** devuelve la última posición (normalizada si se usa map matching)
- **distanceEngine:** usa haversine; con map matching las coordenadas serían más precisas
- **proximityEngine:** listo para usar coordenadas mejoradas
- **etaEngine:** listo para distancias más realistas

---

## 4. QUÉ FALTARÍA PARA PRECISIÓN TIPO APP LÍDER

1. **Integrar API de map matching** (Mapbox, OSRM, etc.)
2. **Buffer de puntos:** acumular últimos N puntos para matching de trayectoria
3. **Filtro de calidad:** solo aplicar matching cuando accuracy < X metros
4. **Backend de proximidad:** validar ≤5m en servidor con coordenadas matched
5. **Navegación real:** rutas y ETA desde APIs de routing (Mapbox Directions, etc.)
