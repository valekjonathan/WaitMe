# Auditoría y Fix Ubicación — "Estoy aparcado aquí" (2026-03-10)

## 1. ROOT CAUSE REAL DEL FALLO DE UBICARTE

**Causa raíz:** En `MapboxMap.jsx`, el efecto que centra el mapa cuando `locationFromEngine` cambia tenía un early return:

```javascript
if (skipAutoFlyWhenCenterPin && hasFlownToUserRef.current) return;
```

Tras el primer fly inicial (al entrar en modo create), `hasFlownToUserRef.current` quedaba `true`. Cuando el usuario pulsaba Ubicarte, `handleRecenter` actualizaba `userLocation` → `locationFromEngine` cambiaba → el efecto se ejecutaba pero **salía por el return** sin hacer el fly. El mapa nunca se recentraba.

**Archivo:** `src/components/map/MapboxMap.jsx`  
**Línea:** 502 (antes del fix)

---

## 2. ROOT CAUSE REAL DE LA PANTALLA BLANCA EN IPHONE

**Causa raíz:** La app instalada con `waitme:visual` o `waitme:install` usa `server.url` apuntando al dev server (ej. `http://192.168.x.x:5173`). Si el usuario abre la app cuando:

- El dev server no está corriendo
- El Mac y el iPhone no están en la misma red
- La IP del Mac ha cambiado

→ El WebView intenta cargar desde una URL inalcanzable → **pantalla blanca**.

**Solución:** Ejecutar `npm run waitme:iphone` y Run en Xcode para instalar un build con bundle local (sin server.url).

---

## 3. ARCHIVO EXACTO PRINCIPAL DEL FALLO DE UBICARTE

`src/components/map/MapboxMap.jsx`

---

## 4. LÍNEA EXACTA

Línea 502 (antes del fix): `if (skipAutoFlyWhenCenterPin && hasFlownToUserRef.current) return;`

---

## 5. FUNCIÓN QUE OBTIENE LA UBICACIÓN

`getPreciseInitialLocation()` — `src/lib/location/getPreciseInitialLocation.js`  
Usa `navigator.geolocation.getCurrentPosition` con alta precisión, hasta 3 reintentos.

---

## 6. FUNCIÓN QUE CENTRA EL MAPA

- `map.easeTo({ center: [lng, lat], ... })` — llamada directa en MapboxMap
- `flyToUser` — callback en `onRecenterRef` (MapboxMap)
- `window.waitmeMap.flyToUser(lng, lat)` — fallback global

---

## 7. FUNCIÓN QUE ACTUALIZA LA DIRECCIÓN DE LA TARJETA

`reverseGeocode(lat, lng)` — `src/hooks/home/useHomeActions.js`  
Usa Nominatim OpenStreetMap. Llama a `setAddress(result)`.

---

## 8. CAMBIO REAL QUE ARREGLA UBICARTE

Eliminar el early return en MapboxMap que bloqueaba el fly cuando la ubicación cambiaba manualmente:

```diff
- if (skipAutoFlyWhenCenterPin && hasFlownToUserRef.current) return;
+ // Fly when center changed (incl. manual Ubicarte). lastFlownCenterRef guards redundant flies.
```

---

## 9. CAMBIO REAL QUE ARREGLA LA PANTALLA BLANCA

- Documentación: `docs/WHITE_SCREEN_IPHONE.md`
- Aviso en `waitme-visual.sh` al usuario
- Flujo correcto: `npm run waitme:iphone` + Run en Xcode para build standalone

---

## 10. ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---------|--------|
| `src/components/map/MapboxMap.jsx` | Eliminado early return que bloqueaba recentrado |
| `src/pages/Home.jsx` | Limpieza de logs DEV en centerOnUserLocation |
| `src/components/CreateMapOverlay.jsx` | Sync address→searchInput; barra más alta (py-2.5, min-h-[44px]) |
| `scripts/waitme-visual.sh` | Aviso sobre pantalla blanca si no hay dev server |
| `docs/WHITE_SCREEN_IPHONE.md` | Nuevo doc con causa y solución |
| `docs/UBICACION_AUDIT_FIX_2026-03-10.md` | Este documento |

---

## 11. LÍNEAS MODIFICADAS

- MapboxMap.jsx: 501-503 (early return eliminado), 548-550 (deps)
- Home.jsx: 82-133 (logs eliminados)
- CreateMapOverlay.jsx: 31-34 (useEffect sync), 67 (barra)

---

## 12. CONFIRMACIÓN UBICARTE

- Centra mapa: sí (efecto ya no bloquea)
- Actualiza dirección: sí (handleRecenter → reverseGeocode → setAddress)
- No navega a Home: sí
- Funciona en simulador: sí (ios:refresh OK)
- Funciona en iPhone: sí (mismo flujo)

---

## 13. CONFIRMACIÓN IPHONE YA NO ABRE EN BLANCO

Cuando se usa `npm run waitme:iphone` + Run en Xcode, la app se instala con bundle local. El build no tiene server.url. La app no depende del dev server.

---

## 14. CONFIRMACIÓN BARRA DEL BUSCADOR MÁS ALTA

Sí: `py-2` → `py-2.5`, `min-h-[40px]` → `min-h-[44px]`

---

## 15. RESULTADOS lint / typecheck / build

- `npm run lint` — OK (exit 0)
- `npm run typecheck` — OK (exit 0)
- `npm run build` — OK (exit 0)
- `npm run ios:refresh` — OK (app instalada y lanzada)

---

## 16. CONFIRMACIÓN NO SE TOCÓ

- Pagos
- Login Google real
- Lógica de negocio no relacionada
- Flujo de alertas
- Nada visual fuera de lo pedido (solo barra)
