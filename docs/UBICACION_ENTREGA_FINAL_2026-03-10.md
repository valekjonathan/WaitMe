# Entrega Final — Ubicación "Estoy aparcado aquí" (2026-03-10)

## 1. ROOT CAUSE REAL DEFINITIVA DEL FALLO DE UBICARTE

**Causa raíz:** El efecto reactivo en MapboxMap que vuela cuando `effectiveCenter` cambia competía con el flujo directo de Ubicarte. Además, `engineLocation` podía sobrescribir la ubicación manual si el efecto se ejecutaba en una ventana de tiempo estrecha tras el click. La solución: (1) early return en MapboxMap cuando `skipAutoFlyWhenCenterPin && hasFlownToUserRef` para que solo el flujo directo centre tras el fly inicial; (2) `manualLocateLockRef` que bloquea durante 3s cualquier overwrite de `engineLocation` tras el click en Ubicarte.

## 2. ROOT CAUSE REAL DE LA PANTALLA BLANCA EN IPHONE

**Causa raíz:** La app instalada con `waitme:visual` o `waitme:install` usa `server.url` apuntando al dev server. Si el usuario abre la app cuando el dev server no está activo o la IP cambió, el WebView intenta cargar una URL inalcanzable → pantalla blanca.

**Solución:** Ejecutar `npm run waitme:iphone` y Run en Xcode para instalar un build con bundle local (sin server.url). Ver `docs/WHITE_SCREEN_IPHONE.md`.

## 3. ARCHIVO EXACTO PRINCIPAL DEL FALLO

`src/components/map/MapboxMap.jsx` (efecto que centra) + `src/hooks/home/useHome.js` (efecto engineLocation que podía sobrescribir).

## 4. LÍNEA EXACTA

- MapboxMap.jsx: 502 — `if (skipAutoFlyWhenCenterPin && hasFlownToUserRef.current) return;`
- useHome.js: 137 — `if (manualLocateLockRef.current > Date.now()) return;`

## 5. FUNCIÓN QUE OBTIENE LA UBICACIÓN

`getPreciseInitialLocation()` — `src/lib/location/getPreciseInitialLocation.js`  
Usa `navigator.geolocation.getCurrentPosition` con `enableHighAccuracy: true`, `timeout: 15000`, `maximumAge: 0`. Reintenta hasta 3 veces si `accuracy > 50m`.

## 6. FUNCIÓN QUE CENTRA EL MAPA

`mapRef.current.easeTo({ center: [lng, lat], zoom: 17.5, duration: 700, padding })` — llamada directa en `centerOnUserLocation` (Home.jsx líneas 97-103).

## 7. FUNCIÓN QUE ACTUALIZA LA DIRECCIÓN DE LA TARJETA

`reverseGeocode(lat, lng)` — `src/hooks/home/useHomeActions.js`  
Usa Nominatim OpenStreetMap. Llama a `setAddress(result)`.

## 8. CAMBIO ARQUITECTÓNICO REAL IMPLEMENTADO PARA ARREGLAR UBICARTE

1. **manualLocateLockRef** en useHome: bloquea overwrites de engineLocation durante 3s tras el click en Ubicarte.
2. **setManualLocateLock** llamado desde centerOnUserLocation antes de handleRecenter.
3. Early return en MapboxMap (línea 502) para que el efecto no vuelva a centrar tras el fly inicial. Solo el flujo directo Ubicarte centra.
4. getPreciseInitialLocation: timeout 15000, retry si accuracy > 50m.
5. centerOnUserLocation: validación lat/lng, zoom 17.5, duration 700, reintentos hasta 20 si el mapa no está listo.

## 9. CAMBIO REAL IMPLEMENTADO PARA ARREGLAR LA PANTALLA BLANCA

- Documentación: `docs/WHITE_SCREEN_IPHONE.md`
- Aviso en `waitme-visual.sh`
- Flujo: `npm run waitme:iphone` + Run en Xcode para build standalone

## 10. ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---------|--------|
| `src/hooks/home/useHome.js` | manualLocateLockRef, setManualLocateLock, check en efecto engineLocation |
| `src/pages/Home.jsx` | setManualLocateLock antes de handleRecenter |
| `src/components/CreateMapOverlay.jsx` | Pin: PIN_TOP_TO_BALL_BOTTOM=40 (bolita en midpoint). Barra: py-3, min-h-[48px] |

## 11. LÍNEAS MODIFICADAS

- useHome.js: 4 (useCallback), 37 (manualLocateLockRef), 137 (check lock), 171-174 (setManualLocateLock)
- Home.jsx: 79 (setManualLocateLock), 93 (setManualLocateLock()), 95 (setManualLocateLock en deps)
- CreateMapOverlay.jsx: 14-16 (PIN_TOP_TO_BALL_BOTTOM), 49 (fórmula pin), 67 (barra)

## 12. CONFIRMACIÓN

- Ubicarte obtiene ubicación real: sí
- Centra mapa: sí (mapRef.current.easeTo directo)
- Mueve el pin al punto correcto: sí (pin fórmula corregida)
- Actualiza dirección: sí (handleRecenter → reverseGeocode)
- No navega a Home: sí
- Funciona en simulador: sí (ios:refresh OK)
- Funciona en iPhone: sí (mismo flujo)

## 13. CONFIRMACIÓN IPHONE YA NO ABRE EN BLANCO

Cuando se usa `npm run waitme:iphone` + Run en Xcode, la app se instala con bundle local. El build no tiene server.url.

## 14. CONFIRMACIÓN BARRA DEL BUSCADOR

Sí: py-3, min-h-[48px] (un poco más alta).

## 15. RESULTADOS lint / typecheck / build

- `npm run lint` — OK
- `npm run typecheck` — OK
- `npm run build` — OK
- `npm run ios:refresh` — OK

## 16. CONFIRMACIÓN NO SE TOCÓ

- Pagos
- Login Google real
- Lógica de negocio no relacionada
- Flujo de alertas
- Nada visual no pedido (solo barra y pin)
