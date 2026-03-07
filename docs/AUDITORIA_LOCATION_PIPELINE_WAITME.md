# Auditoría — Pipeline de Localización WaitMe

Arquitectura de localización profesional similar a apps de movilidad (Uber/Bolt/Cabify), adaptada a WaitMe.

---

## 1. Pipeline completo

```
GPS raw
  → fraud detector
  → movement validator
  → kalman filter
  → smoothing avanzado
  → map matching (preparado)
  → locationEngine final
```

**Ubicación:** `src/lib/locationPipeline/`

| Archivo | Función |
|---------|---------|
| `locationPipeline.js` | Orquestador: procesa posición raw por todo el pipeline |
| `locationFraudDetector.js` | Detecta fraude GPS |
| `locationMovementValidator.js` | Valida movimiento físico |
| `locationKalmanFilter.js` | Filtro Kalman para lat/lng |
| `locationSmoothingAdvanced.js` | EMA + velocity smoothing |
| `locationMapMatcher.js` | Map matching (identity, preparado para Mapbox) |
| `locationPrediction.js` | Predicción de posición a 1s |
| `locationDiagnosticsLogger.js` | Logs de diagnóstico |

---

## 2. Fraud detection

| Detección | Umbral | Acción |
|-----------|--------|--------|
| Teleport | >200 m en <2 s | `flagLocationFraud`, descartar posición |
| Velocidad imposible | >150 km/h | `flagLocationFraud`, descartar |
| GPS mock | `meta.mock === true` | `flagLocationFraud`, descartar |
| Accuracy extrema | >100 m | `flagLocationFraud`, descartar |

---

## 3. Kalman filter

- **Objetivo:** Eliminar jitter GPS, suavizar cambios, evitar saltos bruscos.
- **Entrada:** `{ lat, lng, accuracy }`
- **Ajuste dinámico:** R (measurement noise) se ajusta según `accuracy`.
- **Salida:** `{ lat, lng }` suavizado.

---

## 4. Smoothing avanzado

- **EMA + velocity smoothing**
- **Reglas:**
  - `accuracy > 25 m` → no suavizar
  - `speed > 50 km/h` → suavizado reducido (alpha mayor)
- **Salida:** Posición suavizada con `lat`, `lng`, `accuracy`, `speed`, `timestamp`.

---

## 5. Map matching (integrado)

- **Función:** `snapToRoad(position)` / `snapToRoadSync(position)`
- **Feature flag:** `VITE_USE_MAP_MATCHING=true` activa Mapbox Map Matching vía Supabase Edge Function `map-match`
- **Con flag:** Llama a `map-match` con buffer de posiciones; usa geometría en caché para proyectar
- **Sin flag / fallback:** Identity (devuelve posición tal cual)
- **Timeout:** 5 s; no bloquea la app si falla
- **Requisitos:** Edge Function desplegada, `MAPBOX_SECRET_TOKEN` en Supabase

---

## 6. Predicción de movimiento

- **Función:** `predictPosition1s(position, motion)`
- **Entrada:** `position` (lat, lng), `motion` (speed m/s, heading grados).
- **Uso:** Solo cuando el coche de WaitMe viene hacia el usuario (pantalla "Estoy aparcado aquí").

---

## 7. Regla de movimiento de coches

**Regla crítica:** Los coches NO se mueven nunca en el mapa, excepto cuando:

1. Existe un WaitMe aceptado
2. El usuario está en "Estoy aparcado aquí" (History con alertas reservadas)
3. Ve venir al coche que le va a dar el sitio

**Modos:** `carsMovementStore.js`

| Modo | Comportamiento |
|------|----------------|
| `STATIC` | Todos los coches congelados |
| `WAITME_ACTIVE` | Solo el coche del WaitMe (comprador) se mueve |

**Integración:** `History.jsx` establece `WAITME_ACTIVE` cuando hay alertas reservadas. `SellerLocationTracker` solo muestra `buyerLocations` cuando el modo es `WAITME_ACTIVE`.

---

## 8. Integración con locationEngine

- **Opción:** `startLocationEngine({ pipeline: true })`
- **Flujo:** Posición raw → `processLocation()` → si no fraude, emitir a suscriptores.
- **Fallback:** Sin `pipeline`, se usa el smoothing legacy existente.

---

## 9. Proximidad robusta (transactionEngine)

Condición de llegada:

- `distance ≤ 6 m`
- `accuracy ≤ 20 m`
- `speed ≤ 3 km/h`
- Durante `≥ 10 s`

Verificación doble:

- `distance(userA, userB)` ≤ 6 m
- `distance(userB, alertLocation)` ≤ 6 m
