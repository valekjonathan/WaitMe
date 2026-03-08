# Auditoría Total del Código WaitMe

**Fecha:** 2026-03-07  
**ZIP:** `tmp/waitme-master-full-audit.zip`

---

## 1. Estructura real

- **src/** ~139 archivos (pages, components, lib, hooks, data, services, system)
- **lib/location/** — motor único: locationEngine, getPreciseInitialLocation, toLatLngArray
- **lib/locationPipeline/** — fraud, Kalman, smoothing, map matching
- **lib/mapLayers/** — geojsonUtils, base para migración GeoJSON
- **components/** — MapboxMap, ParkingMap, CreateMapOverlay, SearchMapOverlay
- **quarantine/** — código deprecado, no importado

---

## 2. Warnings lint (resueltos)

| Archivo | Warnings originales | Fix |
|---------|---------------------|-----|
| AddressAutocompleteInput | _e en catch | catch {} |
| ParkingMap | userLocationOffsetY, routeSourceRef, routeDistance, routeDuration | _prefix, omit |
| Chat | forceTick, userMessage, ext | remove, _prefix, remove |
| Chats | 9 vars | _prefix |
| History | setUserLocation, e, isLoading | _prefix, catch {} |
| HistorySellerView | 7 vars | _prefix, destructuring alias |
| locationEngine.test | out | remove |
| transactionEngine.test | alertLoc | _prefix |

**Resultado:** 0 errores, 0 warnings.

---

## 3. Duplicados detectados

| Módulo | Ubicaciones | Estado |
|--------|------------|--------|
| locationFraudDetector | lib/location/, lib/locationPipeline/ | Diferentes usos; transactionEngine usa lib/location |
| locationMovementValidator | lib/location/, lib/locationPipeline/ | Pipeline usa su propia versión |
| extractLatLng / toLatLngArray | alertsQueryKey, lib/location | Unificado: extractLatLng usa toLatLngArray |

---

## 4. Código muerto / legacy

- **quarantine/** — componentes, hooks, services deprecados
- **workflows_disabled/** — CI deshabilitado
- **forceTick** en Chat — removido (demo flow comentado)

---

## 5. Puntos frágiles

- **MapboxMap** — lógica compleja; suppressInternalWatcher crítico para un solo watcher
- **Home** — muchos estados; evitar cambios estructurales
- **History/Chats** — lógica de alertas, thinking_requests

---

## 6. Flujo de ubicación (validado)

1. LocationEngineStarter → startLocationEngine({ pipeline: true })
2. getPreciseInitialLocation() → notify({ skipPipeline: true })
3. firstPreciseReceived = true → watchPosition empieza a notificar
4. useLocationEngine → subscribeToLocation
5. Home → locationFromEngine={engineLocation ?? userLocation}, suppressInternalWatcher
6. MapboxMap → no llama watchPosition

---

## 7. Arquitectura mapa

- **Actual:** DOM markers (getCarWithPriceHtml)
- **Base GeoJSON:** lib/mapLayers/geojsonUtils (alertsToGeoJSON, userLocationToFeature)
- **Migración:** pendiente; base lista para StaticCarsLayer, UserLocationLayer, WaitMeCarLayer
