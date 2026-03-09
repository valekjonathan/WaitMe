# Auditoría Forense Total — WaitMe

**Fecha:** 2026-03-09  
**Tipo:** Auditoría técnica exhaustiva orientada a causa raíz.

---

## 1. DIAGNÓSTICO POR ÁREAS

### A. AUTH / LOGIN iOS

#### Flujo actual (código real)

1. **oauthCapture.js** (init en main.jsx, antes de React)
   - `appUrlOpen`: recibe URL cuando Safari vuelve
   - `getLaunchUrl`: cold start cuando app se abre por URL
   - `processOAuthUrl`: extrae `code` de `?code=xxx`, llama `exchangeCodeForSession(code)`
   - Tras éxito: `getSession()`, `setSession()` (workaround iOS #1566), `window.__WAITME_OAUTH_SESSION`, `window.__WAITME_OAUTH_COMPLETE`, dispatch `waitme:oauth-complete` con `detail: { session }`

2. **AuthContext.jsx**
   - `isDevBypassAuth()`: `VITE_DEV_BYPASS_AUTH=true` o `VITE_BYPASS_AUTH=true` → flujo real
   - Sin bypass: `DEV_MOCK_USER` → user mock, no Supabase
   - `checkUserAuth(overrideSession)`: si `overrideSession` o `window.__WAITME_OAUTH_SESSION` tiene user, usa `ensureUserInDb` y `setUser` directamente
   - `resolveSession()`: `getSession()` + `getUser()` → si falla, user queda null
   - `onAuthStateChange`: SIGNED_IN/TOKEN_REFRESHED → setUser (pero en iOS puede no dispararse a tiempo)

3. **App.jsx**
   - Listener `waitme:oauth-complete`: extrae session de `event.detail.session` o `eventOrSession` o `window.__WAITME_OAUTH_SESSION`
   - Llama `checkUserAuth(session)` y `navigate('/', { replace: true })`
   - Cold start: si `window.__WAITME_OAUTH_COMPLETE` al montar, llama `onOAuthSuccess(session)`

#### Puntos de fallo identificados

| Punto | Riesgo | Evidencia |
|------|--------|-----------|
| **Evento antes de mount** | Si `processOAuthUrl` termina antes de que App monte, el evento se dispara sin listener | Cold start check mitiga; pero si React tarda, evento perdido |
| **ensureUserInDb con headers stale** | Supabase #1566: tras exchange, headers no actualizados; `ensureUserInDb` hace `from('profiles').select()` | Si headers no tienen Bearer, query falla con 401 |
| **setSession workaround** | Se llama tras exchange para forzar headers | Puede no ser suficiente si hay race |
| **VITE_DEV_BYPASS_AUTH** | dev-ios.sh lo exporta; ios:refresh NO | ios:refresh hace build con `VITE_IOS_DEV_BUILD=1` pero NO `VITE_DEV_BYPASS_AUTH` → en build de ios:refresh, `import.meta.env.DEV` es false (producción) → `isDevBypassAuth()` false → AuthContext usa `resolveSession()` que depende de getSession/getUser |

#### Causa raíz final login iOS

**Hipótesis principal:** Inestabilidad por combinación de:

1. **Race condición cold start:** `getLaunchUrl` + `processOAuthUrl` async vs montaje de App. Si la URL llega por `appUrlOpen` después de que App ya montó, el listener existe. Si llega por `getLaunchUrl` en cold start, `processOAuthUrl` puede terminar antes de que App monte → evento perdido. El check `window.__WAITME_OAUTH_COMPLETE` al montar cubre el caso en que processOAuthUrl terminó antes.

2. **Headers Supabase en iOS:** Issue #1566 documentado. `exchangeCodeForSession` guarda sesión pero no actualiza headers. El workaround `setSession` puede no ejecutarse antes de que `ensureUserInDb` haga queries.

3. **Dependencia de onAuthStateChange:** En iOS, `SIGNED_IN` puede no dispararse o dispararse tarde. El flujo actual depende de `checkUserAuth(overrideSession)` con la sesión pasada por evento. Si la sesión no llega (evento perdido, cold start mal manejado), user queda null.

---

### B. HOME

#### Estructura actual (código real)

- **Layout.jsx:** Header (fixed, 69px) + main (flex-1, pt-[69px]) + BottomNav. Outlet = Home.
- **Home.jsx:** `isHomeMode = !mode || mode === 'home'`. `mode` inicial en useHome = `null` → isHomeMode = true.
- **Cuando isHomeMode:** MapboxMap (z-0) + overlay (z-[100], `absolute inset-0`, `display: flex`, `pointer-events: none` en padre) + div interno (z-[101], `pointer-events-auto`) con HomeHeader.
- **HomeHeader:** Logo, frases, botones. `absolute left-1/2 -translate-x-1/2`, `top: 30`.

#### Condiciones que podrían ocultar overlay

| Condición | Estado actual |
|-----------|---------------|
| `isMapDisabled()` | Solo si `VITE_DISABLE_MAP=true` en DEV |
| `mode` no null/home | useHome inicia con `mode = null` → isHomeMode true |
| `display: none` | No aplicado al overlay |
| `height: 0` | Overlay tiene `height: 100%`, `inset: 0` |
| `contentArea` | No usado en modo home (solo en MapViewportShell para search/create) |
| `pointer-events` | Padre `none`, hijo `auto` → HomeHeader clickeable |
| z-index | Overlay z-[100], Header Layout z-50 → overlay sobre header en área de contenido |

#### Posible causa de invisibilidad

1. **Altura del contenedor padre:** Home está en `main > div (flex-1 min-h-0) > Suspense > Outlet`. Si el padre no tiene altura definida, `flex-1 min-h-0` puede colapsar. Layout tiene `h-[100dvh]` en home route → main tiene altura. El div hijo tiene `flex-1 min-h-0` → debería heredar.

2. **Build vieja:** Si el simulador muestra build anterior, los cambios de overlay (z-[100], etc.) no estarían. **ios:refresh** debe ejecutarse para ver cambios.

3. **Ruta real:** Si el router no llega a Home (user null → Login), nunca se renderiza Home. **Causa encadenada:** fallo auth → Login → Home no se ve.

#### Causa raíz final Home

**Hipótesis:** El problema Home está **encadenado al auth**. Si user es null, AuthRouter muestra Login, no Layout/Home. Por tanto, "Home no muestra logo" puede ser en realidad "no se está llegando a Home porque el login falla".

Si auth funciona y se llega a Home: la estructura actual (overlay z-[100], flex, height 100%) es correcta en código. La posible causa restante es **build no actualizada** (simulador con versión vieja).

---

### C. MAPA

#### Estado actual

- **MapboxMap.jsx:** Usa `createMap` de MapInit.js, `setupMapStyleOnLoad`, layers (UserLocation, WaitMeCar, etc.).
- **Token:** VITE_MAPBOX_TOKEN en env.
- **Loader:** "Map loading..." mientras `!mapReady`.
- **Error:** `error` state si createMap falla.

#### Posibles causas de fallo

- Token ausente o inválido
- createMap falla (ver MapInit.js)
- Vista/container con altura 0

#### Causa raíz mapa

Si Home no se muestra por auth, el mapa tampoco. Si el mapa carga pero el overlay no, el problema es overlay (z-index, altura). Auditorías previas (MAP_TOKEN_FORENSIC_FLOW, etc.) indican que el mapa en sí funciona cuando token y container son correctos.

---

### D. iOS / SIMULADOR / BUILD

#### Scripts reales

| Script | Comando | Qué hace |
|--------|---------|----------|
| **start** | `concurrently "npm run dev:ios" "npm run dev:auto"` | Vite + chokidar |
| **dev:ios** | `vite --host --port 5173` | Solo Vite |
| **dev:auto** | `chokidar "src/**/*" ... -c "npm run ios:refresh"` | Al cambio → ios:refresh |
| **ios:refresh** | `bash scripts/ios-refresh.sh` | terminate, uninstall, rm dist, VITE_IOS_DEV_BUILD=1 npm run build, cap sync, cap run |
| **ios:auto** | `bash scripts/dev-ios.sh` | Vite + cap run live-reload (iPhone) |

#### Flujo start

1. `npm run start` → concurrently lanza dev:ios (Vite) y dev:auto (chokidar).
2. Usuario edita archivo en src/.
3. Chokidar detecta → ejecuta `npm run ios:refresh`.
4. ios:refresh: termina app, desinstala, limpia dist, build, sync, cap run.

#### Puntos de fallo

| Punto | Riesgo |
|-------|--------|
| **Chokidar no detecta** | Patrones correctos; verificar que chokidar-cli está instalado |
| **ios:refresh en paralelo** | Varios cambios rápidos → múltiples ios:refresh simultáneos → conflictos |
| **Target iPhone 16e** | ios-refresh resuelve UUID dinámicamente; si no hay iPhone 16e, usa "booted" |
| **VITE_IOS_DEV_BUILD** | ios:refresh usa build con marker; build normal (sin ios:refresh) no tiene marker |

#### Causa raíz simulador

Si el usuario **no ejecuta `npm run start`** y solo hace `npm run build` + `cap run` manual, no hay watcher. Los cambios no disparan ios:refresh.

Si ejecuta start pero **no deja la terminal abierta**, el watcher se detiene.

**Contradicción:** Los scripts existen y son correctos. El fallo suele ser de **uso** (no correr start, o cerrar la terminal) más que de implementación.

---

### E. IPHONE FÍSICO / LIVE RELOAD

#### Flujo ios:auto (dev-ios.sh)

1. environment-guard
2. ensure-oauth-redirect-ios
3. setDevServer.js → URL (http://IP:5173)
4. Export CAPACITOR_USE_DEV_SERVER=true, CAPACITOR_DEV_SERVER_URL
5. cap copy ios
6. concurrently: Vite --host + cap run ios --live-reload --host IP --port 5173

#### Requisitos

- iPhone y Mac en la misma WiFi
- Permiso "Red local" (NSLocalNetworkUsageDescription en Info.plist)
- Mac encendido

#### Límite real

- **Mac encendido:** Live reload funciona si Vite está corriendo y la IP es accesible.
- **Mac apagado:** No hay servidor → no hay live reload. Opción: staging remoto (documentado en IOS_DEV_FLOW.md, no implementado).

#### Causa raíz iPhone físico

El flujo es correcto. Los fallos típicos son: WiFi distinta, permiso Red local no concedido, firewall, o no ejecutar ios:auto.

---

## 2. CONTRADICCIONES DETECTADAS

| Auditoría anterior | Conclusión | Estado real |
|-------------------|------------|-------------|
| AUDITORIA_OAUTH_IOS_WAITME | Redirect URLs, Info.plist schemes | Parcial: el callback puede llegar, pero AuthContext no siempre recibe sesión |
| AUDITORIA_FINAL_IPHONE_BLANCO | NSLocalNetworkUsageDescription causa raíz pantalla blanca | Posible; no verificado si ya está en Info.plist |
| Varias auditorías | "Login arreglado" | Login sigue inestable (a veces entra, a veces vuelve a login) |
| Varias auditorías | "Home arreglado" | Usuario reporta que logo/frases/botones no se ven |
| Scripts ios:refresh, dev:auto | "Simulador siempre última build" | Usuario reporta que no siempre refleja cambios |

---

## 3. QUÉ ESTÁ BIEN

- Estructura de oauthCapture (appUrlOpen, getLaunchUrl, processOAuthUrl)
- Uso de exchangeCodeForSession(code) correcto
- Workaround setSession tras exchange
- Paso de sesión por evento y window.__WAITME_OAUTH_SESSION
- checkUserAuth(overrideSession) en AuthContext
- Cold start check en App.jsx
- Estructura Home (overlay, z-index, flex) en código
- Scripts ios:refresh, dev:auto, start
- capacitor.config.ts con server condicional
- dev-ios.sh con IP y live reload

---

## 4. QUÉ ESTÁ MAL

- Login inestable: race conditions, headers Supabase, dependencia de eventos
- Posible encadenamiento: auth falla → no se llega a Home → "Home no se ve"
- Build no actualizada si no se usa start o se cierra la terminal
- __SHOW_BUILD_MARKER__ solo en builds con VITE_IOS_DEV_BUILD=1 (ios:refresh); build normal sin marker
- INVENTARIO_ENTORNO desactualizado (dev:ios ahora es vite, no dev-ios.sh; start es concurrently)

---

## 5. QUÉ SOBRA

- Marcador "WAITME BUILD TEST" en producción (solo debería mostrarse en dev/ios:refresh)
- Múltiples scripts ios: (ios:fresh, ios:dev, ios:live, ios:watch, ios:run, ios:run:dev) con solapamiento
- Logs AUTH TRACE en producción (deberían estar detrás de flag)

---

## 6. QUÉ FALTA

- Verificación explícita de NSLocalNetworkUsageDescription en Info.plist
- Prueba automatizada de flujo OAuth en Simulator
- Documentación clara de cuándo usar start vs ios:auto
- Fallback si exchangeCodeForSession nunca resuelve (timeout)

---

## 7. RIESGOS TÉCNICOS

- Supabase #1566 no totalmente resuelto
- ensureUserInDb puede fallar con 401 si headers no actualizados
- Múltiples ios:refresh simultáneos pueden corromper dist

---

## 8. DEUDA TÉCNICA

- Consolidar scripts iOS (demasiados)
- Eliminar código temporal de debug
- Actualizar INVENTARIO_ENTORNO_WAITME.md
