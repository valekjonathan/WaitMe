# Auditoría Exhaustiva — Motor de Ubicación WaitMe

**Fecha:** 2025-03-07  
**Objetivo:** Mapear TODO el flujo actual de ubicación, mapa y distancia para implementar motor profesional.

---

## 1. DÓNDE SE PIDE UBICACIÓN

| Archivo | Método | Cuándo |
|---------|--------|--------|
| **Home.jsx** | getCurrentPosition | Al montar (fix rápido, enableHighAccuracy: false, timeout 4s, maximumAge 30s) |
| **Home.jsx** | watchPosition | Al montar, continuo (enableHighAccuracy: true, accuracy > 30 descarta) |
| **Home.jsx** | getCurrentPosition | getCurrentLocation (mirilla), onReady callback |
| **MapboxMap.jsx** | getCurrentPosition | Al montar (enableHighAccuracy: true, timeout 8s, maximumAge 30s) |
| **MapboxMap.jsx** | watchPosition | Al montar, continuo (enableHighAccuracy: true, maximumAge 0) |
| **CreateAlertCard.jsx** | getCurrentPosition | handleLocate (botón Ubícate), maximumAge 5s, timeout 8s |
| **Chats.jsx** | getCurrentPosition | Al montar (permisos/demo) |

---

## 2. DÓNDE SE GUARDA

| Variable/Estado | Archivo | Formato |
|-----------------|---------|---------|
| **userLocation** | Home.jsx | [lat, lng] |
| **selectedPosition** | Home.jsx | { lat, lng } |
| **location** | MapboxMap.jsx | { lat, lng, accuracy, timestamp } |
| **userLocation** | Navigate.jsx | [lat, lng] |
| **userLocation** | History.jsx | null |
| **userLocation** | Chats.jsx | { lat, lon } |

---

## 3. DÓNDE SE ACTUALIZA

| Variable | Origen | Condición |
|----------|--------|-----------|
| userLocation (Home) | watchPosition | accuracy ≤ 30 |
| userLocation (Home) | getCurrentPosition | inicial, fallback Oviedo |
| selectedPosition (Home) | watchPosition | solo si modeRef !== 'create' |
| selectedPosition (Home) | handleMapMoveEnd | mapa arrastrado |
| selectedPosition (Home) | getCurrentLocation | mirilla |
| location (MapboxMap) | watchPosition | siempre |
| location (MapboxMap) | getCurrentPosition | inicial, fallback Oviedo |
| userLocation (Navigate) | moveTowardsDestination | simulación demo |

---

## 4. DÓNDE SE USA PARA MOVER MAPA

| Componente | Uso |
|------------|-----|
| **MapboxMap** | effectiveCenter = location; flyToUser(coords) con padding |
| **CreateAlertCard** | handleLocate → map.easeTo/flyTo con getMapLayoutPadding() |
| **Home** | onRecenterRef → flyToUser; handleMapMoveEnd → setSelectedPosition |
| **MapboxMap** | onRecenterRef.current = flyToUser |
| **MapboxMap** | waitme:goLogo → flyToUser() |

---

## 5. DÓNDE SE USA PARA PINTAR OVERLAYS

| Componente | Dato |
|------------|------|
| **CenterPin** | top calculado (header + card) / 2 |
| **CreateMapOverlay** | pinTop desde ResizeObserver |
| **SearchMapOverlay** | userLocation para UserAlertCard |
| **UserAlertCard** | userLocation para distancia |
| **MapboxMap** | location para centrar mapa |
| **ParkingMap** | userLocation, selectedPosition |
| **SellerLocationTracker** | userLocation |

---

## 6. FLUJOS DUPLICADOS

| Duplicación | Archivos |
|-------------|----------|
| **watchPosition** | Home.jsx + MapboxMap.jsx — dos watchers activos simultáneos |
| **getCurrentPosition inicial** | Home + MapboxMap — ambos al montar |
| **Haversine** | carUtils, Navigate (inline), Chats (inline), SellerLocationTracker (inline) |
| **Distancia buyer-seller** | Navigate.calculateDistanceBetweenUsers, useArrivingAnimation, SellerLocationTracker |

---

## 7. RACE CONDITIONS

| Situación | Riesgo |
|-----------|--------|
| GPS_TIMEOUT_MS 2500 (MapboxMap) | Si getCurrentPosition tarda, fallback Oviedo |
| modeRef.current !== 'create' | selectedPosition puede sobrescribirse si mode cambia durante callback |
| resolved flag (MapboxMap) | Evita doble setLocation |
| lastGeocodeRef (Home) | cache para no repetir reverse geocode |

---

## 8. LÓGICA FRÁGIL

| Punto | Problema |
|-------|----------|
| accuracy > 30 descarta | Usuario con GPS impreciso puede dejar de recibir actualizaciones |
| maximumAge: 0 en watch | Bueno para precisión, pero más batería |
| CreateAlertCard handleLocate | getCurrentPosition independiente; no usa engine |
| Navigate userLocation | hardcode [43.367, -5.844]; no usa GPS real |
| History userLocation | null; SellerLocationTracker recibe null |

---

## 9. CÁLCULOS DE DISTANCIA MAL COLOCADOS

| Archivo | Ubicación | Nota |
|---------|-----------|------|
| carUtils.js | haversineKm, haversineMeters | Centralizado ✓ |
| Navigate.jsx | calculateDistanceBetweenUsers | Haversine inline duplicado |
| Chats.jsx | calculateDistanceText | Haversine inline |
| SellerLocationTracker | calculateDistance | Haversine inline |
| useArrivingAnimation | haversineMeters | Usa carUtils ✓ |
| UserAlertCard | distanceLabel | Recibe meters, formatea |

---

## 10. DEPENDENCIA DE getCurrentPosition vs ENGINE PERSISTENTE

| Caso | Actual | Debería |
|------|--------|---------|
| Crear alerta | getCurrentPosition (inicial) + watchPosition | Engine persistente |
| Ubícate (CreateAlertCard) | getCurrentPosition puntual | engine.getCurrent() o getCurrentPosition si engine no tiene |
| Centrar mapa | MapboxMap watchPosition | Engine persistente |
| Navigate | userLocation hardcode | Engine persistente |
| Proximidad ≤5m | calculateDistanceBetweenUsers | proximityEngine |

---

## 11. REVERSE GEOCODE

| Archivo | Uso |
|---------|-----|
| Home.jsx | Nominatim reverse?format=json; debouncedReverseGeocode 150ms |
| lastGeocodeRef | Evita repetir misma lat/lng |

---

## 12. MAP REF, PADDING, RECENTER

| Elemento | Ubicación |
|----------|-----------|
| mapRef | Home → MapboxMap, CreateAlertCard, CreateMapOverlay |
| getMapLayoutPadding | mapLayoutPadding.js; MapboxMap, CreateAlertCard |
| centerPaddingBottom | 280 (create), 120 (search), 0 (home) |
| onRecenterRef | MapboxMap expone flyToUser; CreateAlertCard llama |

---

## 13. RESUMEN EJECUTIVO

- **2 watchers GPS** activos (Home + MapboxMap)
- **4+ sitios** con getCurrentPosition
- **Haversine** duplicado en 4 archivos
- **Sin engine** persistente; cada componente gestiona su propia ubicación
- **Proximidad ≤5m** en Navigate; lógica inline, no reutilizable
- **ETA** en useArrivingAnimation y Navigate; fórmulas distintas
