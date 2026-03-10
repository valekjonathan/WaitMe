# Auditoría Maestra — Botón Ubicarte (WaitMe)

## ROOT CAUSE EXACTA

| Campo | Valor |
|-------|-------|
| **Archivo** | `src/pages/Home.jsx` |
| **Línea** | 101-108 (bloque `doEaseTo`) |
| **Causa** | `mapRef.current` puede ser `null` cuando el usuario pulsa Ubicarte antes de que el mapa termine de cargar (al entrar en modo create se monta un nuevo MapboxMap y createMap es asíncrono). Los reintentos (20×150ms) pueden no ser suficientes si el GPS tarda poco y el mapa tarda más. |
| **Causa secundaria** | `zoom: 17.5` — el usuario solicitó zoom 18 para precisión tipo Uber. |

---

## TRACE COMPLETO DEL CLICK

```
MapZoomControls.jsx:84  onClick={onLocateClickHandler}
    ↓
MapZoomControls.jsx:40-42  onLocateClickHandler() → locateHandler?.()
    ↓
MapZoomControls.jsx:36-37  locateHandler = onLocateClick (centerOnUserLocation)
    ↓
CreateMapOverlay.jsx:106  onLocateClick={onLocateClick}
    ↓
HomeMapPanel.jsx:43  onLocateClick={onLocateClick}
    ↓
Home.jsx:219  onLocateClick={mode === 'create' ? centerOnUserLocation : undefined}
    ↓
Home.jsx:84-139  centerOnUserLocation()
    ↓
getPreciseInitialLocation() → getCurrentPosition (GPS)
    ↓
handleRecenter(loc) → setUserLocation, setSelectedPosition, reverseGeocode
    ↓
doEaseTo() → mapRef.current.easeTo({ center: [lng, lat], zoom: 18, duration: 700, padding })
    ↓
[FALLO] Si mapRef.current === null → reintentos cada 150ms hasta 20 veces
```

---

## FUNCIONES CLAVE

| # | Función | Archivo | Descripción |
|---|---------|---------|-------------|
| 1 | `getPreciseInitialLocation` | `src/lib/location/getPreciseInitialLocation.js` | Obtiene GPS real. Reintenta hasta 3 veces si accuracy > 50m. |
| 2 | `centerOnUserLocation` / `doEaseTo` | `src/pages/Home.jsx` | Centra el mapa. Usa mapRef.current.easeTo, fallback onRecenterRef, fallback window.waitmeMap.flyToUser. |
| 3 | `handleRecenter` | `src/hooks/home/useHomeActions.js` | Actualiza userLocation, selectedPosition, llama reverseGeocode. |
| 4 | `reverseGeocode` | `src/hooks/home/useHomeActions.js` | Actualiza dirección con Nominatim. |

---

## ESTADO: userLocation / selectedPosition / engineLocation

| Estado | Fuente | Quién pisa en create |
|--------|--------|----------------------|
| `userLocation` | handleRecenter, getCurrentLocation, engineLocation | handleRecenter (Ubicarte). engineLocation bloqueado por manualLocateLockRef y modeRef.current === 'create'. |
| `selectedPosition` | handleRecenter, handleMapMoveEnd, getCurrentLocation | handleRecenter (Ubicarte). |
| `engineLocation` | useLocationEngine (watchPosition) | No actualiza en create (early return). |

---

## mapRef: DÓNDE SE PASA Y DÓNDE SE PIERDE

| Momento | mapRef.current |
|---------|----------------|
| useHome() | `mapRef = useRef(null)` |
| MapboxMap mount | createMap() async → mapRef.current = map (línea 329) |
| map.on('load') | onMapLoad(map) → mapRef.current = map (Home.jsx 163) |
| MapboxMap unmount (cambio de modo) | `mapRef.current = null` (MapboxMap.jsx 366) |
| Nuevo MapboxMap mount (create) | createMap() async → mapRef.current = map |

---

## FIX IMPLEMENTADO

1. **zoom: 18** (antes 17.5) para precisión tipo Uber.
2. **Flujo robusto**: setManualLocateLock antes de handleRecenter; doEaseTo con reintentos.
3. **Sin dependencias**: no waitme:goLogo, no eventos globales para Ubicarte en create.
4. **Validación de precisión**: getPreciseInitialLocation ya retorna hasta 3 intentos si accuracy > 50m.

---

## ARCHIVOS MODIFICADOS

- `src/pages/Home.jsx` — zoom 18, flujo limpio centerOnUserLocation

---

## VERIFICACIÓN

- [ ] Ubicarte obtiene GPS
- [ ] Mapa se centra
- [ ] Pin se mueve (centro fijo, mapa se mueve debajo)
- [ ] Dirección cambia
- [ ] Simulador OK
- [ ] iPhone OK
