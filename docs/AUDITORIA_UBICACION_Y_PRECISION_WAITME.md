# Auditoría Ubicación y Precisión — WaitMe

**Fecha:** 2025-03-07  
**Contexto:** WaitMe libera pagos cuando buyer y seller están ≤5m. La precisión de ubicación es crítica.

---

## 1. FLUJO ACTUAL

### Geolocation — Dónde se usa

| Archivo | Uso |
|---------|-----|
| **Home.jsx** | getCurrentPosition (inicial), watchPosition (continuo), accuracy > 30 descarta |
| **MapboxMap.jsx** | getCurrentPosition (inicial), watchPosition (continuo), GPS_TIMEOUT_MS 2500 |
| **CreateAlertCard.jsx** | getCurrentPosition (botón Ubícate) |
| **Chats.jsx** | getCurrentPosition (permisos/demo) |

### Estado de ubicación

- **userLocation** (Home): [lat, lng] — alimenta mapa, nearby, mockNavigateCars
- **selectedPosition** (Home): { lat, lng } — en create viene del mapa/mirilla; en search del GPS
- **location** (MapboxMap): { lat, lng, accuracy, timestamp } — interno del mapa
- **modeRef** (Home): evita que GPS sobrescriba selectedPosition en modo create

### Reverse geocode

- **Nominatim** (OpenStreetMap): `reverse?format=json&lat=&lon=`
- **debouncedReverseGeocode** en Home: 150ms debounce, evita llamadas duplicadas
- **lastGeocodeRef**: cache para no repetir misma lat/lng

### Map recenter

- **flyToUser** (MapboxMap): easeTo/flyTo con padding de mapLayoutPadding
- **onRecenterRef**: CreateAlertCard llama al recentrar
- **centerPaddingBottom**: 280 (create), 120 (search), 0 (home)

### Permisos

- **navigator.geolocation** check antes de usar
- **enableHighAccuracy**: true en watchPosition; false en getCurrentPosition inicial (arranque rápido)
- **maximumAge**: 0 en watch, 30s en getCurrentPosition inicial
- **timeout**: 8000–10000ms

### Race conditions

- **GPS_TIMEOUT_MS 2500** en MapboxMap: si no hay posición en 2.5s, usa Oviedo
- **resolved** flag: evita doble setLocation
- **modeRef.current**: evita que watchPosition sobrescriba selectedPosition en create

---

## 2. PUNTOS DÉBILES

1. **Dos watchers de GPS:** Home y MapboxMap ambos tienen watchPosition — duplicación, posible conflicto
2. **Sin smoothing:** Las actualizaciones de ubicación van directas al estado; no hay filtro Kalman ni media móvil
3. **Sin map matching:** Las coordenadas GPS se usan tal cual; no se ajustan a la red viaria
4. **Accuracy > 30 descarta:** En Home se descartan posiciones con accuracy > 30m; puede dejar al usuario sin actualización si el GPS es impreciso
5. **Transaction proximity:** No hay motor dedicado para "≤5m"; la lógica de liberación de pago está en el backend/transactions
6. **ETA/distance:** useArrivingAnimation calcula distancia; no hay engine reutilizable tipo Uber

---

## 3. ARQUITECTURA PROPUESTA (FASES)

### Fase A — Motor de ubicación único
- **UbicaciónService** o hook `useLocationEngine`: una sola fuente de verdad
- Home y MapboxMap consumen del mismo stream
- Configurable: smoothing on/off, accuracy threshold

### Fase B — Smoothing
- Media móvil o filtro Kalman para suavizar saltos GPS
- Solo cuando accuracy < 20m (evitar suavizar ruido)

### Fase C — Map matching (preparado)
- Punto de integración: antes de setUserLocation/setSelectedPosition
- Opción: `applyMapMatch(coords) => coords` — por ahora identity
- Futuro: integrar Mapbox Map Matching API o similar

### Fase D — ETA / Distance engine
- `haversineKm` ya existe en carUtils
- Extraer a `distanceEngine.js`: haversine, ETA estimado (velocidad media)
- useArrivingAnimation ya calcula; unificar

### Fase E — Transaction proximity engine
- Función `areWithinProximityMeters(a, b, meters)` usando haversine
- Usar en backend o en cliente para pre-validar antes de llamar API
- Umbral configurable: 5m para liberación de pago

---

## 4. PUNTOS DE INTEGRACIÓN

| Componente | Dónde integrar |
|------------|----------------|
| MapboxMap | Consumir de useLocationEngine en vez de su propio watchPosition |
| Home | Consumir de useLocationEngine; selectedPosition puede venir de mapa o engine |
| CreateAlertCard | getCurrentPosition puntual para Ubícate; puede usar engine.getCurrent() |
| Transactions | Backend: validar proximidad con haversine ≤5m antes de liberar |
| useArrivingAnimation | Usar distanceEngine para ETA |

---

## 5. PLAN POR FASES

1. **Inmediato:** Documentar y no romper lo actual
2. **Corto:** Crear useLocationEngine que unifique Home + MapboxMap
3. **Medio:** Añadir smoothing opcional
4. **Largo:** Map matching, ETA engine reutilizable, proximity engine en backend
