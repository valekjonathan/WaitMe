# Flujo forense del token Mapbox — diagnóstico "Map loading..."

## FASE 1 — MAPA EXACTO DEL FLUJO DEL TOKEN

### 1. Dónde se lee VITE_MAPBOX_TOKEN

| Archivo | Línea | Código |
|---------|-------|--------|
| src/components/map/MapboxMap.jsx | 218 | `const token = import.meta.env.VITE_MAPBOX_TOKEN;` |
| src/components/map/ParkingMap.jsx | 102, 296 | `const token = import.meta.env.VITE_MAPBOX_TOKEN;` |
| src/components/StreetSearch.jsx | 39 | `const token = import.meta.env.VITE_MAPBOX_TOKEN;` |
| src/components/SellerLocationTracker.jsx | 77 | `const token = import.meta.env.VITE_MAPBOX_TOKEN;` |
| src/lib/runtimeConfig.js | 53 | `getEnv('VITE_MAPBOX_TOKEN')` |

### 2. Validación que convierte en "no_token"

**MapboxMap.jsx líneas 219-221:**
```javascript
const tokenStr = token ? String(token).trim() : '';
const isPlaceholder =
  !tokenStr || tokenStr === 'PEGA_AQUI_EL_TOKEN' || tokenStr === 'YOUR_MAPBOX_PUBLIC_TOKEN';
```

### 3. Condición exacta que dispara setError('no_token')

| Origen | Archivo:Línea | Condición |
|--------|---------------|-----------|
| Placeholder | MapboxMap.jsx:223-227 | `if (isPlaceholder)` |
| Map error | MapboxMap.jsx:364-369 | `map.on('error')` y msg incluye 'token'\|'401'\|'Unauthorized' |

### 4. Trimming y checks

- `tokenStr = token ? String(token).trim() : ''`
- isPlaceholder = true si: `!tokenStr` O `tokenStr === 'PEGA_AQUI_EL_TOKEN'` O `tokenStr === 'YOUR_MAPBOX_PUBLIC_TOKEN'`

### 5. Token a mapboxgl.accessToken

**MapInit.js línea 51:** `mapboxgl.accessToken = token;` (createMap recibe token como param)

### 6. createMap recibe el token

**MapboxMap.jsx línea 291:** `createMap(container, { token: tokenStr, interactive })`

### 7. Token en el bundle final

**Verificado:** `grep "pk.eyJ" dist/assets/index-*.js` → SÍ contiene el token cuando se construye con .env local.

---

## FASE 3 — VERIFICACIÓN DEL BUNDLE iOS

| Verificación | Resultado |
|--------------|-----------|
| dist/ contiene token | ✓ grep encuentra pk.eyJ en index-*.js |
| ios/App/App/public contiene token | ✓ cap sync copia dist → public |
| ios:fresh recompila | ✓ rm -rf dist, npm run build, cap sync |
| server.url limpio | ✓ remove_server_from_config elimina server |

---

## FASE 4 — FLUJO DE SCRIPTS

**ios-fresh.sh:**
1. cd proyecto
2. rm -rf dist ios/App/App/public
3. npm run build (Vite carga .env desde raíz)
4. npx cap sync ios
5. remove_server_from_config
6. npx cap run ios

**Conclusión:** .env se carga en npm run build. No hay subshell que pierda env.

---

## TRAZAS AÑADIDAS (FASE 2)

- [MAP TOKEN TRACE 1] raw token exists
- [MAP TOKEN TRACE 2] token length, preview (pk.eyJ...CRBkg)
- [MAP TOKEN TRACE 3] placeholder check
- [MAP TOKEN TRACE 4] setting error=no_token
- [MAP TOKEN TRACE 5] createMap start
- [MAP TOKEN TRACE 6] createMap success
- [MAP TOKEN TRACE 7] createMap failed
- [MAP TOKEN TRACE 8] map error event

**Para ver logs en Simulator:** `npm run ios:logs`
