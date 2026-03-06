
================================================================
FILE: docs/RENDER_AUDIT_REPORT.md
================================================================
```md
# Auditoría de render — pantalla negro/blanco

## Objetivo

Identificar la causa raíz del crash silencioso que produce:
- **Safari simulador** → pantalla negra
- **App instalada (Capacitor)** → pantalla blanca

---

## Capas auditadas

| Capa | Archivo | Líneas clave | Estado |
|------|---------|--------------|--------|
| 1. Auth / router | `src/lib/AuthContext.jsx`, `src/App.jsx` | AuthProvider, AuthRouter | Logs añadidos |
| 2. Home / Layout | `src/pages/Home.jsx`, `src/Layout.jsx` | Home, LayoutShell | Logs añadidos |
| 3. Mapa (MapboxMap) | `src/components/MapboxMap.jsx` | ENTER, error, RETURNS | Logs añadidos |
| 4. Capacitor dev server | `ios/App/App/capacitor.config.json` | server.url | Config existente |
| 5. Safari simulador | — | WKWebView | Por validar |
| 6. App instalada | — | Capacitor runtime | Por validar |
| 7. HMR / Vite | `vite.config.js` | hmr.host | Config existente |

---

## Trazado de render (logs temporales)

Todos los logs usan prefijo `[RENDER:...]` y solo se emiten en `import.meta.env.DEV`.

| Componente | Logs |
|------------|------|
| main.jsx | root found, config ok/not ok |
| AuthContext | AuthProvider ENTER, useState init, RENDER |
| App (AuthRouter) | ENTER, RETURNS loading/Login/Layout, CATCH |
| Layout | Layout ENTER, LayoutShell ENTER, path |
| Home | ENTER, RETURNS map disabled/enabled |
| MapboxMap | ENTER, RETURNS error/map container |

---

## Kill switches DEV

| Flag | Archivo | Comportamiento |
|------|---------|----------------|
| `VITE_DISABLE_MAP=true` | `src/pages/Home.jsx` | Home renderiza bloque simple en vez del mapa |
| `VITE_DEV_BYPASS_AUTH=true` | `src/lib/AuthContext.jsx` | Usa Supabase real en vez de mock |
| `VITE_HARD_BYPASS_APP=true` | `src/main.jsx` | NO monta App: solo bloque "WAITME HARD BYPASS OK" |
| `VITE_HARD_BYPASS_APP_SIMPLE=true` | `src/main.jsx` | Con HARD_BYPASS: muestra "APP SIMPLE OK" |

**Uso:** Añadir a `.env` o ejecutar:
```bash
VITE_DISABLE_MAP=true npm run dev
VITE_DEV_BYPASS_AUTH=true npm run dev
```

---

## Ruta /dev-diagnostics

- **URL:** `#/dev-diagnostics` (HashRouter)
- **Solo en DEV:** La ruta no existe en build de producción
- **Muestra:** import.meta.env.DEV, Capacitor, auth state, router path, Home/MapboxMap montados, mapRef, flags

---

## Procedimiento para identificar causa raíz

1. **VITE_HARD_BYPASS_APP=true** (aisla capa base):
   - Si ves "WAITME HARD BYPASS OK" → main/React/CSS/root OK; fallo en App/Layout/router
   - Si NO ves nada → fallo en main.jsx, globals.css, montaje root, Capacitor/WebView

2. **Si HARD BYPASS funciona**, probar `VITE_HARD_BYPASS_APP_SIMPLE=true` (mismo bloque, texto distinto)

3. **Abrir consola** y observar logs `[RENDER:...]`

4. **VITE_DISABLE_MAP=true** — si desaparece negro/blanco → Mapa culpable

5. **VITE_DEV_BYPASS_AUTH=true** — para aislar auth

---

## Plan para evitar que reaparezca

1. **Mantener ErrorBoundary global** (ya en main.jsx) — captura errores de React
2. **Logs de trazado** — quitar cuando se confirme causa raíz (buscar `RENDER_LOG`)
3. **CI:** smoke tests (`npm run test:e2e tests/smoke/`) deben pasar
4. **Checklist pre-release:** Probar en Safari simulador + app instalada antes de merge
5. **Documentar** en `docs/MAP_DEBUG_CHECKLIST.md` si el mapa es culpable

---

## Validación ejecutada

- `npm run build` ✓
- `npm run test:e2e tests/smoke/` — 6/7 passed (1 fallo en create.spec por locator strict mode, no por render)

```

================================================================
FILE: docs/REPO_AUDIT_EXHAUSTIVO.md
================================================================
```md
# Auditoría exhaustiva del repositorio WaitMe

**Fecha:** 2025-03  
**Herramienta:** Knip + análisis manual

---

## 1. Archivos muertos (no importados)

| Archivo | Acción recomendada |
|---------|---------------------|
| `src/App.css` | Vacío. Eliminar. |
| `src/store/` | Carpeta vacía. Eliminar. |
| `src/components/ErrorBoundary.jsx` | Duplicado de main.jsx. Mover a quarantine. |
| `src/components/cards/ActiveAlertCard.jsx` | No importado. Mover a quarantine. |
| `src/components/UserNotRegisteredError.jsx` | No importado. Mover a quarantine. |
| `src/hooks/useAlertsQuery.js` | No importado. Mover a quarantine. |
| `src/hooks/useMapMatch.js` | No importado. Mover a quarantine. |
| `src/hooks/useDebouncedSave.js` | No importado. Mover a quarantine. |
| `src/hooks/use-mobile.jsx` | No importado. Mover a quarantine. |
| `src/lib/logger.js` | No importado. Mover a quarantine. |
| `src/lib/PageNotFound.jsx` | No importado. Mover a quarantine. |
| `src/lib/query-client.js` | No importado. Mover a quarantine. |
| `src/lib/maps/carUtils.js` | No importado. Mover a quarantine. |
| `src/lib/maps/mapConstants.js` | No importado. Mover a quarantine. |
| `src/lib/maps/mapMarkers.js` | No importado. Mover a quarantine. |
| `src/pages.config.js` | No importado. Mover a quarantine. |
| `src/services/alertService.js` | Solo usado por useAlertsQuery (muerto). Mover a quarantine. |

**UI components (shadcn):** Knip marca muchos como "unused" pero forman parte del design system. NO eliminar. Mantener por si se usan en el futuro o en Storybook.

---

## 2. Dependencias potencialmente muertas

**No eliminar sin verificar:** Muchas son peer de Radix/UI. Verificar uso real antes de borrar.

| Dependencia | Estado |
|-------------|--------|
| `@capacitor/ios` | Usado por Capacitor. Mantener. |
| `@hello-pangea/dnd` | Verificar si hay drag-and-drop. |
| Radix (accordion, alert-dialog, etc.) | Usados por shadcn. Mantener. |
| `cmdk`, `embla-carousel`, `input-otp` | Verificar. |
| `next-themes` | Verificar. |
| `react-day-picker`, `react-hook-form` | Verificar. |
| `recharts`, `sonner`, `vaul`, `zod` | Verificar. |

**DevDependencies:** `@vitest/coverage-v8`, `baseline-browser-mapping`, `eslint-plugin-react-refresh`, `supabase` — evaluar si se usan.

---

## 3. Exports muertos

Ver informe Knip. Los más relevantes: DemoFlowManager (muchos exports demo), badgeVariants, buttonVariants, varios de dialog/select/use-toast. Mantener por compatibilidad con UI.

---

## 4. Backups / restos a eliminar

| Elemento | Acción |
|----------|--------|
| `ios__backup*` | Ya en .gitignore. No existe en repo. |
| `DerivedData` | Ya en .gitignore. |
| `ios_run_last.log` | 1MB. Añadir a .gitignore. Eliminar del repo si está trackeado. |
| `storybook-static/` | Build output. Ya en .gitignore. |
| `playwright-report/`, `test-results/` | Ya en .gitignore. |
| `force-sync.txt` | Verificar propósito. |

---

## 5. Código temporal de debugging

| Ubicación | Código | Acción |
|-----------|--------|--------|
| `src/main.jsx` | RENDER_LOG | Mantener en DEV. Opcional: envolver en flag. |
| `src/Layout.jsx` | RENDER_LOG | Idem. |
| `src/pages/Home.jsx` | RENDER_LOG, __DEV_DIAG | Idem. |
| `src/components/MapboxMap.jsx` | RENDER_LOG, __DEV_DIAG | Idem. |
| `src/lib/AuthContext.jsx` | RENDER_LOG | Idem. |

**Recomendación:** Mantener RENDER_LOG solo si `import.meta.env.DEV`. Ya está así. Documentar que son para diagnóstico.

---

## 6. Flags DEV actuales

| Flag | Archivo | Propósito |
|------|---------|-----------|
| `VITE_DISABLE_MAP` | Home.jsx | Kill switch mapa |
| `VITE_DEV_BYPASS_AUTH` | AuthContext.jsx | Bypass auth mock |
| `VITE_HARD_BYPASS_APP` | main.jsx | Bypass App completo |
| `VITE_HARD_BYPASS_APP_SIMPLE` | main.jsx | Variante del bypass |

**A consolidar con:** VITE_SAFE_MODE, VITE_DISABLE_REALTIME (nuevos).

---

## 7. Recomendaciones por prioridad

### Alta
1. Crear `quarantine/` y mover archivos muertos.
2. Eliminar `src/App.css` (vacío) y `src/store/` (vacío).
3. Implementar SAFE MODE y ruta /dev-diagnostics.
4. Añadir ErrorBoundary + window.onerror + unhandledrejection.
5. Añadir `ios_run_last.log` a .gitignore.

### Media
6. Consolidar flags DEV.
7. Scripts audit:repo, check:fast, dev:safe.
8. Tests smoke para safe mode y diagnostics.

### Baja
9. Revisar dependencias con depcheck o similar.
10. Limpiar exports no usados (con cuidado).

---

## 8. Root cause del fallo blanco/negro (histórico)

**Error detectado en iOS Simulator:** `null is not an object (evaluating 'dispatcher.useCallback')`

**Stack:** useCallback → useStore → useRealtimeAlerts → Layout.jsx

**Causa:** Zustand `useAppStore()` invocado cuando el React dispatcher no estaba listo en WebKit.

**Fix aplicado:** Uso correcto del hook con selectores en top-level. `VITE_DISABLE_REALTIME` para desactivar la capa si persiste.

---

## 9. Plan para no volver a romper a ciegas

1. **SAFE MODE:** `VITE_SAFE_MODE=true` o `npm run dev:safe` — shell mínima siempre carga.
2. **Diagnóstico:** `/dev-diagnostics` muestra estado de capas y últimos errores.
3. **Error capture:** `window.__WAITME_DIAG__` guarda onerror + unhandledrejection + ErrorBoundary.
4. **Scripts:** `audit:repo`, `check:fast`, `dev:safe`.
5. **Tests:** smoke/load, smoke/safe-mode, smoke/diagnostics.
6. **Antes de merge:** `npm run check:fast` debe pasar.

```

================================================================
FILE: docs/SAFE_CHANGE_PROTOCOL.md
================================================================
```md
# Protocolo de cambio seguro — WaitMe

Protocolo obligatorio antes de aplicar cambios. Reducir errores y facilitar rollback.

---

## 1. Antes de tocar código

Responder por escrito (en el chat o en un doc):

### Qué se va a tocar
- Lista exacta de archivos
- Tipo de cambio (nuevo / modificar / eliminar)

### Qué no se va a tocar
- Archivos protegidos (Home.jsx salvo orden explícita)
- Visuales no solicitados
- Flujos críticos sin necesidad

### Impacto esperado
- Qué comportamiento cambia
- Qué pantallas o flujos se ven afectados
- Riesgos conocidos

### Forma de validación
- Comando(s) para probar (ej. `npm run build`, `npm run dev`)
- Flujo manual a verificar
- Criterio de éxito

### Rollback simple si falla
- Cómo revertir (ej. `git revert`, restaurar archivo X)
- Si hay migraciones, cómo deshacerlas

---

## 2. Durante el cambio

- Hacer cambios **atómicos**: un commit por idea
- No mezclar refactors con features
- Seguir `docs/CURSOR_RULES_WAITME.md`

---

## 3. Después del cambio

- Ejecutar validación acordada
- Documentar en commit o en docs: archivos tocados, riesgos, prueba recomendada
- Si algo falla, aplicar rollback antes de seguir

---

## 4. Plantilla rápida

```
CAMBIO: [descripción breve]

TOCAR: [archivo1, archivo2, ...]
NO TOCAR: [Home.jsx, visuales, ...]

IMPACTO: [qué cambia]
VALIDACIÓN: [npm run build, probar flujo X]
ROLLBACK: [git revert / restaurar Y]
```

---

## 5. Excepciones

- Cambios triviales (typos, comentarios) no requieren protocolo completo
- Urgencias: documentar después, pero aplicar el protocolo en la medida de lo posible

```

================================================================
FILE: docs/SETUP_SUPABASE_GITHUB_SECRETS.md
================================================================
```md
# Configuración de GitHub Secrets para Supabase

Esta guía configura los secrets necesarios para que GitHub Actions ejecute migraciones de Supabase.

---

## 1. Obtener el Project Reference ID

El **Project Reference ID** es un string alfanumérico (10–20 caracteres) que identifica tu proyecto en Supabase.

### Opción A: Desde el Dashboard

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (WaitMe)
3. Ve a **Project Settings** (icono engranaje) → **General**
4. Copia el **Reference ID**

### Opción B: Desde la URL del proyecto

Si tienes `VITE_SUPABASE_URL` en tu `.env`, el formato es:

```
https://<PROJECT_REF>.supabase.co
```

Ejemplo: `https://abcdefghij.supabase.co` → el Project Ref es `abcdefghij`

---

## 2. Obtener el Access Token

1. Ve a [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Crea un token nuevo (o usa uno existente)
3. Copia el token (solo se muestra una vez)

---

## 3. Obtener la contraseña de la base de datos

1. En el Dashboard: **Project Settings** → **Database**
2. Si no la recuerdas: **Reset database password** (genera una nueva)
3. Guarda la contraseña de forma segura

---

## 4. Secrets requeridos en GitHub

| Secret | Descripción | Dónde obtenerlo |
|--------|-------------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | Token de la cuenta Supabase | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | ID del proyecto | Project Settings → General → Reference ID |
| `SUPABASE_DB_PASSWORD` | Contraseña de Postgres | Project Settings → Database |

---

## 5. Configuración manual (GitHub UI)

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** para cada uno:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_DB_PASSWORD`

---

## 6. Configuración automática (GitHub CLI)

Si tienes [GitHub CLI](https://cli.github.com/) instalado y autenticado:

```bash
./scripts/configure-supabase-secrets.sh
```

O manualmente:

```bash
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_REF
gh secret set SUPABASE_DB_PASSWORD
```

(Te pedirá el valor de cada uno de forma segura)

---

## 7. Verificar

Tras configurar los secrets:

1. Haz un cambio en `supabase/migrations/` y push a `main`
2. O ejecuta el workflow manualmente: **Actions** → **Supabase Migrations** → **Run workflow**
3. Revisa que el job `migrate` termine correctamente

---

## Nota

Todos los workflows usan **`SUPABASE_PROJECT_REF`** como nombre del secret del project ID.

```

================================================================
FILE: docs/TECH_AUDIT.md
================================================================
```md
# WaitMe — Technical Audit

Análisis técnico del repositorio. **No modifica código**; solo documenta hallazgos.

---

## 1. PERFORMANCE

### Unnecessary re-renders

| Location | Issue |
|----------|------|
| **Layout.jsx** | `useRealtimeAlerts()` corre en Layout; cada cambio en appStore.alerts re-renderiza Layout y todos los hijos (Routes, Header, BottomNav). |
| **MapboxMap.jsx** | `useAppStore((s) => s.alerts.items)` — cualquier upsert/remove re-renderiza MapboxMap y recalcula GeoJSON. |
| **Home.jsx** | Muchos `useState` (mode, selectedAlert, userLocation, filters, etc.); cambios frecuentes propagan re-renders a ParkingMap, MapFilters, CreateAlertCard. |
| **History.jsx** | `nowTs` actualizado cada 1s vía `setInterval` → re-render completo de History + HistorySellerView/HistoryBuyerView cada segundo. |
| **Chats.jsx** | Igual: `setNowTs(Date.now())` cada 1s. |
| **IncomingRequestModal.jsx** | Polling 1s para countdown. |

### Heavy components

| Component | Notes |
|-----------|-------|
| **History.jsx** | ~1500+ líneas, múltiples subvistas, lógica de alertas, localStorage, eventos custom. |
| **Home.jsx** | ~980+ líneas, múltiples modos (search/create), mapas, mutaciones, queries. |
| **Chats.jsx** | Lógica demo + real, conversaciones, notificaciones. |
| **ParkingMap.jsx** | Inicializa Mapbox, markers, rutas OSRM, múltiples `useEffect`. |
| **MapboxMap.jsx** | Mapbox + geolocation watch + clusters. |

### Expensive hooks

| Hook | Cost |
|------|------|
| **useRealtimeAlerts** | Fetch inicial + suscripción Supabase; corre en Layout (siempre montado). |
| **useMapMatch** | `setInterval` 5s, acumula puntos GPS, llama Edge Function. |
| **useMyAlerts** | Base44 `ParkingAlert.filter`; usado en Home, History, BottomNav. |
| **useProfileGuard** | Depende de profile; puede bloquear render. |

### Polling intervals

| Location | Interval | Purpose |
|----------|----------|---------|
| **History.jsx** | 1000 ms | `nowTs` para countdowns |
| **Chats.jsx** | 1000 ms | `nowTs` para countdowns |
| **IncomingRequestModal.jsx** | 1000 ms | Countdown de petición |
| **useMapMatch.js** | 5000 ms | Map matching GPS |
| **DemoFlowManager.jsx** | 1000 ms | `notify()` a listeners (cuando `startDemoFlow` está activo) |
| **Navigate.jsx** | 400 ms | Animación `moveTowardsDestination` |
| **Home.jsx** (unreadCount) | 15000 ms | Refetch notificaciones no leídas |

---

## 2. STATE MANAGEMENT

### Duplicated states

| State | Locations | Conflict |
|-------|-----------|----------|
| **User / profile** | AuthContext (user, profile) vs appStore (auth.user, profile) | appStore.profile no se usa como fuente principal; AuthContext es la real. |
| **Alerts** | appStore.alerts (Supabase Realtime) vs React Query `['myAlerts']` (Base44) vs `alertsKey(mode, locationKey)` (mock) | Tres fuentes distintas. |
| **Location** | appStore.location vs `userLocation` local en Home/History/Navigate | MapboxMap usa appStore; ParkingMap recibe props. |

### Conflicting sources of truth

| Domain | Primary | Secondary | Problem |
|--------|---------|-----------|---------|
| **Alerts** | Base44 (CRUD) | Supabase (Realtime → appStore) | MapboxMap muestra appStore; History/Home usan Base44. Datos pueden divergir. |
| **My alerts** | React Query `['myAlerts']` (Base44) | — | Badge y lista usan esto; Realtime no actualiza myAlerts. |
| **Nearby alerts (search)** | `getMockNearbyAlerts` (mock local) | — | Home en modo search usa mock, no Supabase ni Base44. |

### Contexts vs Zustand misuse

| Store | Use case | Issue |
|-------|----------|-------|
| **AuthContext** | user, profile, auth state | Correcto; fuente única de auth. |
| **LayoutContext** | Header config | Correcto. |
| **appStore** | alerts, location, ui.error | alerts se llenan por Realtime pero History/Home no los usan para CRUD; location se usa en MapboxMap pero Home tiene su propio userLocation. |
| **finalizedAtStore** | localStorage para orden finalizadas | Fuera de React; OK. |

---

## 3. REALTIME

### Supabase realtime subscriptions

| Subscription | Location | Table | Events | Cleanup |
|--------------|----------|-------|--------|---------|
| **parking_alerts** | alertsRealtime.js | public.parking_alerts | INSERT, UPDATE, DELETE | `supabase.removeChannel(channel)` en return de subscribeActiveAlerts |

**Channel name:** `parking_alerts_realtime` (único).

### Possible memory leaks

| Risk | Location | Notes |
|------|----------|-------|
| **useRealtimeAlerts** | useRealtimeAlerts.js | `unsub()` en cleanup del useEffect; depende de que Layout no desmonte. Si Layout se desmonta (ej. logout), cleanup correcto. |
| **ChatMessage.subscribe** | Chat.jsx | `unsubscribe?.()` en cleanup; correcto si conversationId/isDemo cambian. |
| **onAuthStateChange** | AuthContext.jsx | `subscription.unsubscribe()` en cleanup. |
| **DemoFlowManager listeners** | DemoFlowManager.jsx | `listeners` Set global; si componentes se suscriben y no hacen unsubscribe, persisten. `subscribeDemoFlow` retorna unsubscribe. |
| **Window events** | Múltiples | `waitme:badgeRefresh`, `waitme:goLogo`, `waitme:alertPublished`, etc. Handlers deben removerse en cleanup. |

### Duplicate listeners

| Event / subscription | Subscribers | Risk |
|----------------------|-------------|------|
| **parking_alerts_realtime** | 1 (useRealtimeAlerts) | No duplicado. |
| **ChatMessage.subscribe** | 1 por Chat montado | OK si solo un Chat a la vez. |
| **subscribeDemoFlow** | Chats, Chat (comentado), otros | Código comentado en Chat; si se activa, múltiples listeners. |
| **waitme:badgeRefresh** | BottomNav, History (vía mutations) | Múltiples dispatch; un handler por listener. OK. |

---

## 4. ALERT SYSTEM

### Files that manipulate alerts

| File | Operation | Backend |
|------|-----------|---------|
| **Home.jsx** | create (ParkingAlert.create), buy (update + Transaction + ChatMessage) | Base44 |
| **History.jsx** | create (repeat), update (extend, cancel, expire, status) | Base44 |
| **HistorySellerView.jsx** | update (accept, reject, extend, cancel) | Base44 |
| **HistoryBuyerView.jsx** | update (cancel reservation) | Base44 |
| **IncomingRequestModal.jsx** | update (accept, reject, me lo pienso) | Base44 |
| **ActiveAlertCard.jsx** | — | Solo UI |
| **Navigate.jsx** | update (complete), Transaction.create | Base44 |
| **WaitMeRequestScheduler.jsx** | get (verificar alert activa) | Base44 |
| **useRealtimeAlerts.js** | select, subscribe | Supabase |
| **alertsRealtime.js** | subscribe (onUpsert, onDelete) | Supabase |
| **alertService.js** | create, getActive, getActiveNear, reserve, close | Supabase |

### Base44 vs Supabase usage

| Flow | Base44 | Supabase |
|------|--------|----------|
| **Create alert** | Home.jsx, History.jsx (repeat) | alertService.createAlert — NO USADO |
| **Reserve alert** | Home.jsx (buyAlertMutation), IncomingRequestModal | alertService.reserveAlert — NO USADO |
| **Update status** | History*, IncomingRequestModal, Navigate | alertService.closeAlert — NO USADO |
| **Fetch my alerts** | useMyAlerts (Base44) | — |
| **Fetch nearby (search)** | — | — |
| **Search mode** | — | getMockNearbyAlerts (mock local) |
| **Realtime map** | — | useRealtimeAlerts → appStore |

### Dead code

| Item | Location | Notes |
|------|----------|-------|
| **alertService.js** | src/services/ | No importado por ningún flujo de negocio. |
| **useAlertsQuery.js** | src/hooks/ | useActiveAlertsQuery, useActiveAlertsNearQuery, useCreateAlertMutation, etc. — NO importados en ningún archivo. |
| **alertsKeys** (useAlertsQuery) | useAlertsQuery.js | Diferente de alertsKey/alertsPrefix en lib/alertsQueryKey. |

---

## 5. CHAT SYSTEM

### Base44 chat implementation

| Entity | Usage |
|--------|-------|
| **Conversation** | filter, create; Chats lista conversaciones; Chat carga una; IncomingRequestModal crea si no existe. |
| **ChatMessage** | filter, create, subscribe (realtime); Chat.jsx se suscribe a cambios por conversation_id. |

**Flujo:**
- Chats: `base44.entities.Conversation.filter` + ParkingAlert para contexto.
- Chat: `base44.entities.Conversation.filter`, `ChatMessage.filter`, `ChatMessage.subscribe`.
- IncomingRequestModal: crea Conversation + ChatMessage al aceptar.

### Dependency on alerts

| Dependency | Details |
|------------|---------|
| **Conversation.alert_id** | Conversaciones ligadas a alertas; sin alerta, conv puede ser genérica. |
| **Chat desde History** | Navegación a Chat con conversationId, alertId, otherName, etc. en URL. |
| **IncomingRequestModal** | Crea conv para alert_id al aceptar; buyer viene del request. |
| **DemoFlowManager** | ensureConversationForAlert, addIncomingWaitMeConversation; todo demo depende de alertas demo. |

---

## 6. MAP SYSTEM

### MapboxMap vs ParkingMap

| Aspect | MapboxMap | ParkingMap |
|--------|-----------|------------|
| **Data source** | useAppStore (alerts.items, location) | Props (alerts, userLocation, selectedAlert, sellerLocation) |
| **Import Mapbox** | Dynamic `import('mapbox-gl')` | Static `import mapboxgl` |
| **Use case** | Mapa de fondo en Home (clusters, marcador usuario) | Mapa de búsqueda/creación, rutas, marcadores detallados |
| **Alerts** | Supabase Realtime (appStore) | Mock (search) o props (create/navigate) |
| **Geolocation** | watchPosition → appStore.setLocation | Recibe userLocation por props |
| **Route** | No | OSRM fetch, polyline |

### Duplicate logic

| Logic | MapboxMap | ParkingMap |
|-------|-----------|------------|
| **Map init** | mapboxgl.Map, dark style, NavigationControl | Igual |
| **Car colors** | No (solo círculos) | carColors object, createCarMarkerHtml |
| **User marker** | Div purple circle | createUserLocationHtml |
| **Center** | OVIEDO_CENTER / props | defaultCenter desde userLocation |

**carColors / getCarFill** duplicado en: History.jsx, HistorySellerView, HistoryBuyerView, IncomingRequestModal, MarcoCard, UserAlertCard, ParkingMap, Notifications, carUtils.js, Profile.jsx.

---

## 7. DEMO SYSTEM

### DemoFlowManager

| Export | Purpose |
|--------|---------|
| **demoFlow** | Estado global: users, alerts, conversations, messages, notifications |
| **startDemoFlow** | Seed + setInterval(notify, 1000) |
| **subscribeDemoFlow** | Listeners para re-render cuando cambia demo |
| **getDemoConversations, getDemoAlerts, getDemoMessages** | Getters |
| **addDemoAlert, addIncomingWaitMeConversation** | Añadir alertas/conversaciones demo |
| **reserveDemoAlert, applyDemoAction** | Acciones demo |
| **sendDemoMessage, markDemoRead** | Chat/notificaciones |

### Simulated alerts

- **seedAlerts()**: `demoFlow.alerts = []` (vacío por defecto).
- **addDemoAlert**: Añade alerta al estado demo (ej. desde WaitMeRequestScheduler).
- **getMockNearbyAlerts**: 10 alertas mock fijas para modo search en Home (no usa demoFlow).

### Timers

| Timer | Location | Interval |
|-------|----------|----------|
| **tickTimer** | DemoFlowManager | 1000 ms (notify a listeners) |
| **startDemoFlow** | DemoFlowManager | Llamado desde componente; `startDemoFlow()` en useEffect está comentado en DemoFlowManager. |

---

## 8. NETWORK CALLS

### Supabase queries

| Location | Query |
|----------|-------|
| AuthContext | profiles insert/select, auth.getUser, onAuthStateChange |
| Login | auth.signInWithOAuth, setSession |
| Profile | profiles select/update, storage upload |
| useRealtimeAlerts | parking_alerts select (status=active) |
| alertsRealtime | postgres_changes (no query directo) |
| useMapMatch | functions.invoke('map-match') |
| alertService | parking_alerts insert/select/update — NO USADO |

### Base44 queries

| Location | Entity | Operation |
|----------|--------|-----------|
| Home | ParkingAlert, Transaction, ChatMessage, Notification | create, update, filter |
| History | ParkingAlert | create, update, filter |
| HistorySellerView | ParkingAlert | update |
| HistoryBuyerView | ParkingAlert, ChatMessage | update, create |
| Chats | Conversation, ParkingAlert, Notification | filter |
| Chat | Conversation, ChatMessage, auth.me | filter, create, subscribe |
| IncomingRequestModal | ParkingAlert, Conversation, ChatMessage | update, filter, create |
| Navigate | ParkingAlert, Transaction, ChatMessage | update, create |
| Notifications | Notification | filter |
| NotificationSettings | auth | updateMe |
| useMyAlerts | ParkingAlert | filter |
| WaitMeRequestScheduler | ParkingAlert | get |

### Unnecessary requests

| Issue | Location |
|-------|----------|
| **unreadCount** | Home.jsx refetch cada 15s aunque no haya cambios. |
| **myAlerts** | refetchOnWindowFocus: true; puede ser excesivo si usuario cambia pestaña a menudo. |
| **WaitMeRequestScheduler** | base44.entities.ParkingAlert.get dos veces (verificación + datos) a los 30s. |
| **Chat** | base44.auth.me() en query separado; AuthContext ya tiene user. |

---

## 9. RISK AREAS

### Bugs

| Area | Risk |
|------|------|
| **alertService schema** | Usa `user_id`, `price`, `vehicle_type`, `geohash`; migración core usa `seller_id`, `price_cents`. Incompatible. |
| **normalizeRow / normalizeAlert** | Mapean seller_id/user_id, price_cents/price; si Base44 y Supabase divergen en schema, puede fallar. |
| **formatAddress** | Definido localmente en History, IncomingRequestModal; lógica duplicada puede divergir. |
| **getCarFill / carColors** | 6+ implementaciones distintas; valores pueden no coincidir. |

### Race conditions

| Scenario | Location | Risk |
|----------|----------|------|
| **createAlert + invalidateQueries** | Home.jsx | Optimistic update en onMutate; si onError, restore. Si onSuccess e invalidate ocurren antes de que Realtime entregue, appStore puede tener datos viejos. |
| **buyAlertMutation** | Home.jsx | cancelQueries + setQueryData optimista; onError restaura. Posible race si múltiples clicks. |
| **Realtime vs Base44** | General | Usuario crea en Base44; Realtime puede no haber llegado; MapboxMap muestra appStore (Supabase). Si Supabase no tiene la tabla, appStore queda vacío. |
| **waitme:badgeRefresh** | BottomNav, History | invalidateQueries con refetchType: 'none' en BottomNav; puede no refetch. |

### Inconsistent state

| Scenario | Cause |
|----------|-------|
| **Map shows X alerts, History shows Y** | MapboxMap: appStore (Supabase). History: useMyAlerts (Base44). Fuentes distintas. |
| **Badge count ≠ list count** | Badge usa getVisibleActiveSellerAlerts(myAlerts); lista usa mismo selector. Si myAlerts está stale, ambos wrong. |
| **Demo vs real** | isDemo en Chat por URL; demoFlow es global. Si usuario navega real→demo sin reload, estado mezclado. |

---

## 10. CLEANUP PLAN

### Phase 1: Unify alert source

1. **Decidir fuente única**: Supabase (con migración core) o Base44.
2. Si **Supabase**:
   - Migrar Home.jsx create/buy a alertService (adaptar schema: seller_id, price_cents).
   - Migrar History*.jsx, IncomingRequestModal, Navigate a alertService.
   - Eliminar uso de base44.entities.ParkingAlert para alerts.
   - useMyAlerts: cambiar queryFn a Supabase o a appStore si Realtime es suficiente.
3. Si **Base44**:
   - Desactivar useRealtimeAlerts o usarlo solo para invalidar myAlerts.
   - MapboxMap: alimentar desde useMyAlerts en vez de appStore.

### Phase 2: Remove Base44 alerts

1. Sustituir todas las llamadas a `base44.entities.ParkingAlert` por alertService (Supabase) o equivalente.
2. Eliminar useMyAlerts Base44; crear useMyAlertsSupabase o unificar con appStore.
3. Eliminar alertService si se mantiene Base44 (y viceversa).

### Phase 3: Remove Base44 chat

1. Crear tablas `conversations`, `messages` en Supabase (ya en migración core).
2. Crear chatService (Supabase) para Conversation, ChatMessage.
3. Migrar Chats.jsx, Chat.jsx, IncomingRequestModal a Supabase.
4. Implementar Realtime para messages.
5. Eliminar base44.entities.Conversation, base44.entities.ChatMessage.

### Phase 4: Unify maps

1. **Opción A**: Un solo componente Map que reciba `mode` (background | search | create | navigate) y datos por props o store.
2. **Opción B**: Mantener MapboxMap y ParkingMap pero:
   - Unificar fuente de alerts (store o props desde misma fuente).
   - Extraer carColors/getCarFill a `utils/carUtils.js` y usar en ambos.
   - ParkingMap: recibir alerts de la misma fuente que MapboxMap (ej. store cuando en Home).

### Phase 5: Remove demo flows

1. Crear flag `VITE_DEMO_MODE` o ruta `/demo` en vez de `?demo=1`.
2. Si demo se elimina: borrar DemoFlowManager, getMockNearbyAlerts, WaitMeRequestScheduler (o simplificar a solo testing).
3. Si demo se mantiene: aislar en rutas/layout separado; no mezclar con flujo real en mismo árbol de componentes.

### Phase 6: Consolidate helpers

1. **formatAddress**: Un solo helper en `utils/` o `lib/`.
2. **carColors / getCarFill**: Ya existe `carUtils.getCarFill`; migrar todos los usos y eliminar duplicados.
3. **alertsQueryKey**: Unificar alertsKey (lib) y alertsKeys (useAlertsQuery); eliminar el no usado.

### Phase 7: Remove dead code

1. Eliminar `useAlertsQuery.js` si no se usa (o integrarlo como reemplazo de useMyAlerts).
2. Eliminar `alertService.js` si se mantiene Base44; si se migra a Supabase, eliminar código Base44 de alerts.
3. Eliminar `PageNotFound.jsx` o añadirlo a rutas como catch-all.

---

*Documento generado a partir del análisis del repositorio. No modifica código.*

```

================================================================
FILE: docs/WAITME_AGENT_CONTEXT.md
================================================================
```md
# WaitMe — Contexto del Agente Maestro

Documento de contexto permanente para que cualquier agente o IA entienda el proyecto completo.

---

## 1. Visión del proyecto

**Qué es WaitMe:** Marketplace de alertas de aparcamiento en tiempo real.

Los vendedores publican que van a dejar su plaza (precio, tiempo). Los compradores buscan plazas cercanas, reservan y coordinan la entrega. La app muestra mapas, chats y notificaciones en tiempo real.

---

## 2. Stack tecnológico

### Frontend
- **React** — UI
- **Vite** — Build y dev server
- **Tailwind** — Estilos
- **Zustand** — Estado global (appStore)
- **React Query** — Cache y fetching
- **React Router** — Navegación
- **Framer Motion** — Animaciones
- **Mapbox GL** — Mapas

### Backend
- **Supabase** — BaaS
- **Postgres** — Base de datos
- **Supabase Auth** — OAuth (Google, Apple)
- **Supabase Realtime** — Suscripciones en vivo
- **Supabase Storage** — Avatares y adjuntos

### Infraestructura
- **GitHub** — Repositorio
- **GitHub Actions** — CI (lint, typecheck, build)
- **Mapbox** — Tiles y geolocalización
- **Capacitor** — Empaquetado iOS

---

## 3. Arquitectura general

```
Usuario
   ↓
App React (src/)
   ↓
Adapters (src/data/*.js)
   ↓
Servicios Supabase (src/services/*Supabase.js)
   ↓
Supabase API (Postgres, Auth, Realtime, Storage)
   ↓
Realtime events
   ↓
Actualización UI (React Query, Zustand)
```

Los componentes **nunca** llaman a Supabase directamente. Usan adapters en `src/data/`.

---

## 4. Dominios del sistema

| Dominio | Qué hace |
|---------|----------|
| **Auth** | Login OAuth, sesión, signOut. Supabase Auth. |
| **Profiles** | Perfil de usuario: nombre, vehículo, preferencias, avatar. |
| **Parking Alerts** | Alertas de parking: vendedor publica (precio, ubicación, tiempo). |
| **Reservations** | Reservas de alertas: comprador reserva, estados (requested, accepted, active, completed). |
| **Chat** | Conversaciones y mensajes entre buyer y seller por alerta. |
| **Notifications** | Notificaciones del usuario (solicitudes, mensajes, etc.). |
| **Transactions** | Transacciones de pago entre buyer y seller. |
| **Maps** | Mapas Mapbox: ubicación, marcadores, rutas. Requiere token. |

---

## 5. Tablas Supabase

| Tabla | Para qué sirve |
|-------|----------------|
| `profiles` | Datos de usuario (nombre, vehículo, preferencias, avatar_url). |
| `parking_alerts` | Alertas de parking (seller_id, ubicación, precio, status, metadata). |
| `alert_reservations` | Reservas de alertas (buyer_id, alert_id, status, started_at, expires_at). |
| `conversations` | Conversaciones entre buyer y seller por alert_id. |
| `messages` | Mensajes de chat (conversation_id, sender_id, body). |
| `notifications` | Notificaciones del usuario (user_id, tipo, leído). |
| `transactions` | Transacciones (buyer_id, seller_id, alert_id, amount, status). |
| `user_location_updates` | Ubicación del comprador en ruta hacia la plaza. |
| Storage `avatars` | Avatares de perfil. |

---

## 6. Pantallas principales

| Pantalla | Función |
|----------|---------|
| **Home** | Landing: mapa fullscreen, botones "¿Dónde quieres aparcar?" y "¡Estoy aparcado aquí!". Modos search y create. |
| **History** | Lista de alertas del usuario (como vendedor o comprador). Estados: activa, reservada, en curso, finalizada. |
| **Chats** | Lista de conversaciones. Demo + real. |
| **Chat** | Chat individual con buyer/seller. Mensajes en tiempo real. |
| **Notifications** | Centro de notificaciones. |
| **Profile** | Perfil de usuario, edición de datos y vehículo. |
| **Settings** | Ajustes generales. |
| **Navigate** | Navegación hacia la plaza reservada. Mapa con ubicación del vendedor y comprador. |

---

## 7. Componentes críticos

| Componente | Función |
|-------------|---------|
| **MapboxMap** | Mapa fullscreen en Home. Marcadores de alertas y usuario. ResizeObserver, 100dvh. |
| **ParkingMap** | Mapas en modos search/create de Home y en Navigate. |
| **DemoFlowManager** | Gestiona flujo demo: alertas, conversaciones, notificaciones en memoria/localStorage. |
| **IncomingRequestModal** | Modal de solicitud WaitMe entrante. Aceptar/rechazar. |
| **WaitMeRequestScheduler** | Dispara petición demo 30s tras publicar alerta. |
| **appStore** (Zustand) | Estado global: alertas visibles, etc. |
| **finalizedAtStore** | Timestamps de alertas finalizadas (localStorage). |

---

## 8. Variables de entorno

| Variable | Qué hace |
|----------|----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (ej. `https://xxx.supabase.co`). Obligatoria para auth y datos. |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública de Supabase. Obligatoria. |
| `VITE_MAPBOX_TOKEN` | Token público Mapbox (pk.xxx). Obligatoria para mapas. |
| `VITE_SENTRY_DSN` | Opcional. Errores a Sentry. |
| `VITE_PUBLIC_APP_URL` | Opcional. URL para redirect OAuth. |

---

## 9. Reglas del proyecto

- **No tocar Home.jsx** sin orden explícita.
- **No modificar visuales** no pedidos.
- **Supabase** es la única fuente de verdad para datos persistentes.
- **No crear mocks** si existe flujo real en Supabase.
- **Mantener enfoque mobile-first.**
- Documentar archivos tocados, riesgos y prueba recomendada.
- Preferir cambios mínimos, limpios y reversibles.
- No crear duplicidades de servicios, hooks o stores.
- No romper History.jsx, chats, mapas ni flujo principal.

Ver `docs/CURSOR_RULES_WAITME.md` y `docs/SAFE_CHANGE_PROTOCOL.md`.

---

## 10. CI/CD

| Elemento | Descripción |
|----------|-------------|
| **GitHub Actions** | Workflow `ci.yml` en push/PR a `main`. |
| **build** | `npm run build` — Vite build de producción. |
| **lint** | `npm run lint` — ESLint. |
| **typecheck** | `npm run typecheck` — `tsc --noEmit`. |
| **Secrets** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN` en GitHub. |

Ver `docs/CI_SETUP.md`.

```

================================================================
FILE: docs/WAITME_DEV_WORKFLOW.md
================================================================
```md
# WaitMe! — Flujo de desarrollo

Tres carriles: **web rápido** → **validación automática** → **validación nativa final**.

---

## 1. Carril web rápido

```bash
npm run dev
```

- Servidor en `http://localhost:5173`
- Red local: `http://<TU_IP>:5173` (Vite imprime la IP al arrancar)

### Abrir en Safari (Mac)

1. Safari → `http://localhost:5173`
2. O desde red: `http://<TU_IP>:5173`

### Abrir en simulador iOS

1. `npm run dev` en una terminal
2. Otra terminal: `CAPACITOR_USE_DEV_SERVER=true npx cap run ios`
3. El simulador carga la app desde el dev server por IP

**Importante:** Revisa `capacitor.config.ts` — la URL debe coincidir con tu IP local (ej. `192.168.0.15:5173`).

### Abrir en iPhone real

1. iPhone y Mac en la misma red WiFi
2. `npm run dev`
3. En el iPhone: Safari → `http://<IP_DE_TU_MAC>:5173`
4. O con Capacitor: `CAPACITOR_USE_DEV_SERVER=true npx cap run ios` (iPhone conectado por cable)

---

## 2. Validación automática (Playwright)

```bash
npm run test:e2e
```

Ejecuta smoke tests en WebKit (iPhone 14) y Chromium. Arranca el servidor en puerto 5174 si no hay uno activo.

```bash
npm run test:e2e:ui
```

Abre la UI de Playwright para depurar tests.

### Solo smoke tests

```bash
npm run test:e2e tests/smoke/
```

### Geolocation personalizada

```bash
PLAYWRIGHT_GEOLOCATION='{"latitude":40.4168,"longitude":-3.7038}' npm run test:e2e
```

---

## 3. Validación nativa final

### Cuándo usar Capacitor

- Probar en simulador o dispositivo real
- Probar APIs nativas (geolocalización, status bar, etc.)
- Validar el build final antes de publicar

### Cuándo NO usar Capacitor

- Desarrollo rápido de UI
- Cambios de estilos o lógica
- Ejecutar Playwright (usa el navegador web)

### Comandos Capacitor

| Comando | Descripción |
|---------|-------------|
| `npm run ios:run:dev` | Simulador con dev server (hot reload) |
| `npm run ios:sync` | Build + sync a iOS (sin dev server) |
| `npm run ios:open` | Abre Xcode |

---

## Flujo recomendado día a día

1. **Desarrollo:** `npm run dev` → editar código → ver en Safari o simulador
2. **Tras cambios importantes:** `npm run test:e2e tests/smoke/`
3. **Antes de commit:** `npm run check` (lint + build)
4. **Validación nativa:** `npm run ios:run:dev` o `npm run ios:sync` + abrir en simulador

### Preview (build de producción)

```bash
npm run build
npm run preview
```

- Preview en `http://localhost:4173` (o IP de red)

```

================================================================
FILE: docs/WAITME_FAST_WORKFLOW.md
================================================================
```md
# WaitMe! — Flujo de trabajo rápido

Guía para trabajar sin romper la app.

---

## 1. Desarrollo rápido

```bash
npm run dev
```

- Servidor en `http://localhost:5173`
- Red local: `http://<TU_IP>:5173`
- Usar navegador o Safari para probar

---

## 2. Prueba automática

```bash
npm run test:e2e
```

Ejecuta Playwright (WebKit móvil + Chromium). Arranca el servidor en puerto 5174 si no hay uno activo.

```bash
npm run test:e2e tests/smoke/
```

Solo smoke tests.

```bash
npm run test:e2e:ui
```

Abre la UI de Playwright para depurar.

---

## 3. UI aislada (Storybook)

```bash
npm run storybook
```

- Abre en `http://localhost:6006`
- Componentes: CreateAlertCard, CreateMapOverlay, MapZoomControls
- Probar UI sin montar toda la app

---

## 4. Validación nativa final

```bash
npm run ios:run
```

Build + sync + ejecutar en simulador iOS.

```bash
npm run ios:run:dev
```

Simulador con dev server (hot reload).

---

## 5. Antes de commit

```bash
npm run check
```

Lint + build.

---

## 6. Resumen del flujo

| Paso | Comando | Cuándo |
|------|---------|--------|
| Desarrollo | `npm run dev` | Editar código |
| Tests E2E | `npm run test:e2e` | Tras cambios importantes |
| UI aislada | `npm run storybook` | Probar componentes |
| Nativo | `npm run ios:run` | Validación final |
| Pre-commit | `npm run check` | Antes de push |

```

================================================================
FILE: docs/WAITME_FULL_STABILITY_AUDIT.md
================================================================
```md
# Auditoría exhaustiva — Estabilidad del mapa WaitMe

**Fecha:** 2025-03-06  
**Objetivo:** Identificar último estado estable y restaurar baseline antes de reimplementar cambios.

---

## 1. Estado actual real del proyecto

### Problemas confirmados por el usuario

1. **Mapa invisible** — El mapa no se renderiza o no es visible.
2. **Botones de zoom mal colocados** — No están donde se pidió (10px debajo del menú, alineados con borde izquierdo de la tarjeta).
3. **Drag del mapa roto** — No se puede arrastrar con un dedo.
4. **Pinch zoom roto** — No se puede hacer zoom con dos dedos.
5. **Dirección en tiempo real rota** — El campo no se actualiza al mover el mapa.
6. **Regresiones encadenadas** — Demasiados parches sin resolver causa raíz.
7. **Necesidad de punto estable** — Recuperar baseline funcional.

### Estado técnico actual (HEAD = 2a439cb)

- **MapboxMap:** Contenedor vacío interno para Mapbox; `containerRef` en div hijo vacío; `touchAction` solo en ese div.
- **CreateMapOverlay:** Tarjeta `fixed`; sin wrapper fullscreen; pin y zoom como siblings.
- **SearchMapOverlay:** Sin wrapper fullscreen; elementos `fixed`/`absolute`.
- **MapZoomControls:** `zoomIn`/`zoomOut` con fallback `easeTo`.

---

## 2. Arquitectura real del mapa create/search

```
Home.jsx
├── MapboxMap (absolute inset-0 z-0)
│   ├── div (contenedor Mapbox — actualmente vacío, ref=containerRef)
│   ├── CenterPin (si useCenterPin && !centerPinFromOverlay)
│   └── children:
│       ├── CreateMapOverlay (mode === 'create')
│       │   ├── tarjeta (fixed)
│       │   ├── pin (absolute, pointer-events-none)
│       │   └── MapZoomControls (absolute)
│       └── SearchMapOverlay (mode === 'search')
│           ├── filtros (fixed)
│           ├── StreetSearch (fixed)
│           ├── UserAlertCard (fixed)
│           ├── pin (absolute)
│           └── MapZoomControls (absolute)
└── div contenido (z-10, pointer-events-none cuando mode)
```

### Fuente de verdad del mapa

- **Instancia:** `mapRef.current` asignado en `onMapLoad` de MapboxMap.
- **Centro:** `map.getCenter()` en eventos `move`/`moveend`.
- **Zoom/recenter:** `mapRef.current.zoomIn()`, `zoomOut()`, `flyTo()`.

### Fuente de verdad de la dirección

- **Estado:** `address` en Home; `selectedPosition` { lat, lng }.
- **Actualización:** `handleMapMove` / `handleMapMoveEnd` → `debouncedReverseGeocode` → `reverseGeocode` → `setAddress`.
- **Problema:** Si el mapa no recibe gestos, `move`/`moveend` no se disparan.

### Acoplamientos frágiles

- Offsets hardcodeados: `HEADER_BOTTOM=60`, `MAP_TOP_VIEWPORT=69`, `bottom: 90px + safe`.
- Posición del pin calculada con ResizeObserver sobre la tarjeta.
- `centerPaddingBottom` distinto para create (280) vs search (120).

### Duplicaciones

- Reverse geocode en `handleMapMoveEnd` (682afa4) vs `debouncedReverseGeocode` (actual).
- Lógica de pin en CreateMapOverlay y SearchMapOverlay con constantes duplicadas.

---

## 3. Historial reciente de cambios del mapa

| Commit | Resumen |
|--------|---------|
| 2a439cb | Contenedor vacío para Mapbox; dragPan/touchZoomRotate/touchPitch; **posible causa de mapa invisible** |
| 8a78540 | Quitar wrapper fullscreen CreateMapOverlay; debounce 150ms; zoom left calc(4%+1rem) |
| 7491092 | Quitar overlay oscurecido; reposicionar zoom |
| 5740de9 | Forensic repair; CreateMapOverlay con overlay; debouncedReverseGeocode |
| 5c58ab9 | CreateMapOverlay, SearchMapOverlay, MapZoomControls como children de MapboxMap |
| 9d2cbb8 | Crear CreateMapOverlay; centerPinFromOverlay; touchAction: none |
| 11b138e | Pin fijo estilo Uber |
| 8f7fad9 | Unificar mapa; useCenterPin, onMapMove, onMapMoveEnd |
| 682afa4 | Create card flotante; overlay como sibling; MapboxMap sin overlays como children |
| c70ba0f | Restore map stability; min-h-[100dvh]; docs |

---

## 4. Último commit estable identificado

**Recomendación:** `8a78540` (fix: final blocker repair for create map drag, live address and zoom placement)

**Razón:** Es el último commit antes de 2a439cb que introdujo el contenedor vacío. El usuario confirma que el mapa es ahora invisible; 8a78540 tenía el mapa visible (containerRef en el root div). Los problemas de drag/pinch/zoom/dirección existían ya en 8a78540, pero el mapa se veía.

**Alternativa más conservadora:** `5740de9` — tiene CreateMapOverlay con overlay fullscreen; el mapa se veía porque containerRef estaba en el root.

---

## 5. Regresiones introducidas después de 8a78540

| Commit | Archivo | Regresión |
|--------|---------|-----------|
| 2a439cb | MapboxMap.jsx | **Mapa invisible:** containerRef movido a div interno vacío; posible fallo de dimensionado o renderizado de Mapbox en ese contenedor |
| 2a439cb | SearchMapOverlay.jsx | Overlay fullscreen eliminado; elementos fixed; puede afectar layout en search |
| 2a439cb | CreateMapOverlay.jsx | Tarjeta a fixed (restauración de posición) — no regresión |
| 2a439cb | MapZoomControls.jsx | Fallback easeTo — mejora, no regresión |

---

## 6. Causa raíz

### Mapa invisible

**Causa:** En 2a439cb se movió `containerRef` del div raíz al div interno vacío. Mapbox recibe ese div. Posibles causas:
- El div interno con `absolute inset-0` no obtiene dimensiones correctas en ciertos layouts.
- El orden de render (map primero, overlays después) cambió y algo tapa el mapa.
- Mapbox GL tiene requisitos específicos sobre el contenedor que no se cumplen.

**Evidencia:** En 8a78540 el mapa se veía con containerRef en el root. La única diferencia estructural en 2a439cb es el contenedor vacío.

### Drag roto

**Causa:** Overlay fullscreen `fixed inset-0 top-[60px]` (en 5740de9 y anteriores) con `pointer-events-none` puede interferir con hit-testing en iOS. Eliminar el overlay (8a78540) debería mejorar, pero el mapa invisible impide validar.

### Pinch zoom roto

**Causa:** Misma que drag; además `touch-action` en el contenedor afecta la propagación de gestos.

### Zoom mal colocado

**Causa:** `left: calc(4% + 1rem)` puede no coincidir con el borde izquierdo real de la tarjeta (que usa `left-1/2 -translate-x-1/2 w-[92%]`).

### Dirección no actualizada

**Causa:** Si drag no funciona, `move`/`moveend` no se disparan; `handleMapMove`/`handleMapMoveEnd` no se llaman; `debouncedReverseGeocode` no se ejecuta.

### Tarjeta desplazada

**Causa:** Cambio de `absolute` (relativo al contenedor MapboxMap) a `fixed` (relativo al viewport) en 2a439cb para restaurar posición; el contenedor MapboxMap está dentro de main con padding, por lo que las coordenadas difieren.

---

## 7. Recomendación exacta de restauración

**Estrategia:** Restauración controlada de archivos afectados al estado de `8a78540`, sin tocar Supabase ni pantallas no relacionadas.

**Archivos a restaurar desde 8a78540:**

1. **MapboxMap.jsx** — Revertir cambio de 2a439cb: `containerRef` de vuelta al root div; quitar div interno vacío; mantener `touchAction: 'none'` en el root; quitar dragPan/touchZoomRotate/touchPitch explícitos (eran default).
2. **SearchMapOverlay.jsx** — Restaurar al estado 8a78540 (con overlay fullscreen) para mantener consistencia con create.
3. **CreateMapOverlay.jsx** — Mantener estado 8a78540 (sin wrapper fullscreen, tarjeta absolute).
4. **MapZoomControls.jsx** — Restaurar al estado 8a78540 (zoomIn/zoomOut directos, left: 4%).

**No tocar:** Home.jsx (salvo que sea necesario para compatibilidad), Supabase, History, Chat, CreateAlertCard, otras pantallas.

---

## 8. Plan correcto para rehacer esta pantalla sin romperla

1. **Baseline estable:** Dejar el mapa visible, tarjeta en sitio, sin parches adicionales.
2. **Un cambio a la vez:** Cada fix (drag, pinch, zoom, dirección) en un commit separado.
3. **Validar en iOS Simulator** tras cada cambio.
4. **No violar requisito Mapbox:** Si se añaden overlays como children, considerar moverlos fuera del contenedor que se pasa a Mapbox, o usar un wrapper con contenedor vacío solo para el mapa.
5. **Documentar** cada cambio en docs antes de implementar.

```

================================================================
FILE: docs/WAITME_FULL_TECH_AUDIT.md
================================================================
```md
# WaitMe — Auditoría Técnica Total

**Fecha:** 6 de marzo de 2025  
**Objetivo:** Preparar el sistema antes de implementar nuevas funcionalidades.

---

## 1. Estado general del proyecto

| Aspecto | Estado |
|---------|--------|
| Migración Supabase | Completa en todos los dominios |
| base44 | Eliminado (solo comentarios informativos en servicios) |
| Arquitectura | Sólida: adapters → servicios Supabase |
| Mapas | Estables con ResizeObserver y 100dvh |
| CI/CD | Activo (ci.yml en push/PR a main) |
| Demo vs real | Coexistencia intencional (DemoFlowManager + localStorage) |

**Veredicto:** 7.5/10 — Proyecto funcional, migrado y documentado. Listo para evolucionar con precaución en flujos demo/real.

---

## 2. Problemas encontrados

### Críticos
- Ninguno en estado actual.

### Medios
| Problema | Ubicación | Impacto |
|----------|-----------|---------|
| **Duplicidad alertService vs alertsSupabase** | `alertService.js` usa schema distinto (user_id, lat, lng). `data/alerts` usa `alertsSupabase`. `useAlertsQuery` importa `alertService` pero **no se usa en la app**. | Bajo: useAlertsQuery es código muerto. |
| **transactionEngine en memoria** | Balance, ban, comisión en `Map` en memoria. No persiste en Supabase. | Medio: al recargar se pierde. |
| **waitmeRequests en localStorage** | Solicitudes WaitMe en `waitme_requests_v1`. No en Supabase. | Medio: demo/local only. |
| **Lógica carColors duplicada** | History, Navigate, Profile, MarcoCard, UserAlertCard, Notifications definen `carColors` localmente. `lib/maps/carUtils` y `utils/carUtils` existen pero no unifican. | Bajo: mantenimiento. |
| **lib/maps/mapMarkers.js sin uso** | `createCarMarkerHtml`, `createUserLocationHtml` no importados. ParkingMap define los suyos inline. | Bajo: archivo muerto. |

### Bajos
- Chunk principal > 500KB (mapbox-gl, radix).
- Muchos componentes UI Radix importados; no todos se usan.
- Docs dispersos (30+ archivos en docs/).

---

## 3. Arquitectura actual

### Flujo de datos
```
Usuario → React → data/*.js (adapters) → services/*Supabase.js → Supabase API
                                    ↓
                            Realtime → appStore / React Query → UI
```

### Carpetas principales
| Carpeta | Contenido |
|---------|------------|
| `src/pages/` | Pantallas (Home, History, Chats, Chat, etc.) |
| `src/components/` | Componentes reutilizables y cards |
| `src/components/ui/` | Componentes Radix/shadcn |
| `src/data/` | Adapters (alerts, chat, notifications, profiles, transactions, uploads, userLocations) |
| `src/services/` | Servicios Supabase y alertService |
| `src/hooks/` | useMyAlerts, useRealtimeAlerts, useAlertsQuery, etc. |
| `src/lib/` | AuthContext, supabaseClient, utils, stores |
| `src/state/` | appStore (Zustand) |
| `src/utils/` | carUtils, index (createPageUrl) |
| `supabase/migrations/` | 15 migraciones SQL |
| `scripts/` | diagnose, ios-run, supabase-migrate, etc. |
| `docs/` | 35+ documentos |

### Inventario por tipo

**Pantallas (críticas):** Home, History, HistoryBuyerView, HistorySellerView, Chats, Chat, Notifications, NotificationSettings, Profile, Settings, Login, Navigate.

**Componentes críticos:** MapboxMap, ParkingMap, DemoFlowManager, IncomingRequestModal, WaitMeRequestScheduler, SellerLocationTracker, Header, BottomNav, CreateAlertCard, UserAlertCard, ActiveAlertCard.

**Hooks críticos:** useMyAlerts, useRealtimeAlerts, useProfileGuard, useAlertsQuery (no usado).

**Stores:** appStore (Zustand), finalizedAtStore (localStorage), waitmeRequests (localStorage).

**Servicios:** alertsSupabase, alertService (paralelo, schema distinto), chatSupabase, notificationsSupabase, profilesSupabase, transactionsSupabase, uploadsSupabase, userLocationsSupabase, alertsRealtime.

**Utils:** utils/carUtils (haversineKm, getCarFill, formatPlate), utils/index (createPageUrl), lib/vehicleIcons (getCarWithPriceHtml, getCarIconHtml).

**Secundarios:** lib/maps/mapMarkers (no usado), lib/maps/carUtils (getCarColor, carColors — no usado), lib/geohash, lib/transactionEngine, lib/logger, lib/sentry.

**Potencialmente muertos:** useAlertsQuery.js (nadie importa), lib/maps/mapMarkers.js (nadie importa), lib/maps/carUtils.js (nadie importa).

---

## 4. Partes aún demo

| Área | Demo | Real |
|------|------|------|
| **Alertas en Home (búsqueda)** | `getMockNearbyAlerts()` — 12–21 alertas mock alrededor del usuario | — |
| **Chats** | DemoFlowManager + localStorage `waitme:demo_conversations` | Supabase conversations, messages |
| **Notifications** | getDemoNotifications() + localStorage | Supabase notifications |
| **History** | thinking_requests, rejected_requests en localStorage | Supabase parking_alerts, transactions |
| **IncomingRequestModal** | Crea conversaciones demo en localStorage | También puede crear reales |
| **Navigate** | `alert.id.startsWith('demo_')` para datos fake | Supabase para reales |
| **transactionEngine** | Balance, ban en memoria (Map) | — |
| **waitmeRequests** | localStorage `waitme_requests_v1` | — |

---

## 5. Partes listas para producción

| Dominio | Estado | Tablas |
|---------|--------|--------|
| Auth | OK | auth.users |
| Profiles | OK | profiles |
| Parking Alerts | OK | parking_alerts |
| Reservations | OK | alert_reservations |
| Chat | OK | conversations, messages |
| Notifications | OK | notifications |
| Transactions | OK | transactions |
| Uploads | OK | Storage avatars |
| User Locations | OK | user_location_updates |

RLS activo en tablas. Adapters y servicios implementados. Realtime en parking_alerts, notifications, messages.

---

## 6. Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Token Mapbox inválido/caducado | Media | Mapa no renderiza | docs/MAP_DEBUG_CHECKLIST.md, npm run diagnose |
| transactionEngine en memoria se pierde al recargar | Alta | Balance/ban incorrectos | Migrar a Supabase o persistir en profiles |
| Demo y real mezclados en Chats/History | Media | Confusión, bugs al extender | Documentar flujos, separar claramente |
| alertService vs alertsSupabase schema distinto | Baja | useAlertsQuery no usado | Eliminar useAlertsQuery o unificar |
| Chunk > 500KB | Baja | Carga inicial lenta | Code-split con React.lazy |

---

## 7. Mejoras recomendadas

### Corto plazo
1. Eliminar o integrar `useAlertsQuery` y `alertService` — unificar con data/alerts.
2. Eliminar `lib/maps/mapMarkers.js` y `lib/maps/carUtils.js` si no se usan.
3. Consolidar `carColors` en un único módulo (utils/carUtils o lib/vehicleIcons).
4. Documentar explícitamente qué es demo y qué es real en cada pantalla.

### Medio plazo
5. Migrar transactionEngine a Supabase (tabla balances, bans) o persistir en profiles.
6. Sustituir getMockNearbyAlerts en Home por query real a parking_alerts (geohash).
7. Code-split: lazy load History, Profile, Chat.
8. Consolidar docs obsoletos en MIGRATION_COMPLETE.md.

### Largo plazo
9. Tests E2E para flujos críticos (login, crear alerta, reservar, chat).
10. Monitoreo (Sentry ya configurado, activar si VITE_SENTRY_DSN).

---

## 8. Revisión por fases

### FASE 1 — Inventario
- Carpetas, pantallas, componentes, hooks, stores, servicios, utils, scripts, docs documentados.
- Clasificación: críticos, secundarios, muertos.

### FASE 2 — Arquitectura

**Estado por dominio:**

| Dominio | Estado | Notas |
|---------|--------|-------|
| Auth | OK | Supabase Auth, AuthContext |
| Profiles | OK | profilesSupabase → data/profiles |
| Parking Alerts | OK | alertsSupabase → data/alerts |
| Reservations | OK | alert_reservations, status en parking_alerts |
| Chat | OK | chatSupabase → data/chat |
| Notifications | OK | notificationsSupabase → data/notifications |
| Transactions | OK | transactionsSupabase → data/transactions |
| Maps | OK | Mapbox + vehicleIcons, token requerido |

- Supabase: única fuente de verdad. OK.
- base44: solo comentarios. OK.
- Mocks/demo: intencionales (mockNearby, DemoFlowManager, localStorage). Parcial.
- Duplicidades: alertService vs alertsSupabase. Parcial.
- Lógica duplicada: carColors en varios sitios. Parcial.

### FASE 3 — Mapas
- MapboxMap: ResizeObserver, 100dvh, resizes escalonados. Estable.
- mockNearby: usado solo en Home para búsqueda. No afecta al mapa.
- vehicleIcons: usado por MapboxMap y ParkingMap. Estable.
- Overlays: gradiente en Home con pointer-events-none. No tapa.
- Contenedor: min-h-[100dvh] en Home. Estable.
- Dependencia frágil: VITE_MAPBOX_TOKEN. Sin token = "Mapa no disponible".

### FASE 4 — Base de datos
- Queries: vía servicios Supabase. RLS activo.
- Adapters: data/*.js delegan correctamente.
- Tablas: profiles, parking_alerts, alert_reservations, conversations, messages, notifications, transactions, user_location_updates.
- Inconsistencias: alertService usa user_id, lat, lng; alertsSupabase usa seller_id, price_cents, metadata. Solo alertService afectado; no usado por data layer.
- Manejo de errores: servicios retornan { data, error }. Algunos componentes podrían mejorar feedback.

### FASE 5 — Rendimiento
- Renders: React Query y Zustand reducen refetches. Algunos componentes podrían memoizarse más.
- Imports pesados: mapbox-gl, radix. Chunk principal grande.
- Componentes grandes: History.jsx, Chats.jsx, Home.jsx.
- Code-split: Layout ya usa lazy para Chats, Chat, etc. History y Profile no.

### FASE 6 — Seguridad
- Variables de entorno: VITE_* en .env. No commitear .env.
- Claves: anon key es pública por diseño. RLS protege datos.
- Acceso a tablas: RLS en todas.
- Validaciones: AuthContext y useProfileGuard. Algunos formularios podrían validar más.

### FASE 7 — Limpieza (solo listar, no borrar)
- **Archivos muertos:** useAlertsQuery.js (nadie importa), lib/maps/mapMarkers.js, lib/maps/carUtils.js.
- **Funciones no usadas:** las de useAlertsQuery, mapMarkers, maps/carUtils.
- **Dependencias:** Revisar si todos los paquetes de package.json se usan (recharts, ngeohash, etc.).
- **Código comentado:** Revisar manualmente en archivos grandes.

### FASE 8 — Preparación para nuevas funciones

| Función | Listo | Falta |
|---------|-------|-------|
| **Flujo real de alertas** | Sí (alertsSupabase, parking_alerts) | Sustituir getMockNearbyAlerts en Home por query geohash real |
| **Reservas** | Sí (alert_reservations, status reserved) | Integrar alert_reservations en flujo UI si no está |
| **Temporizadores** | Parcial | wait_until, expires_at existen. Timer visual en UI podría mejorarse |
| **Transacciones** | Sí (transactions table) | transactionEngine en memoria; migrar balance/ban a Supabase |
| **Notificaciones realtime** | Sí (Supabase Realtime en notifications) | Verificar suscripción activa en Notifications.jsx |

---

## 9. Roadmap técnico para terminar WaitMe

1. **Estabilización (1–2 sprints)**
   - Eliminar código muerto (useAlertsQuery, mapMarkers, maps/carUtils).
   - Unificar carColors.
   - Sustituir mockNearby en Home por query real (opcional si se quiere demo).

2. **Flujo real completo (2–3 sprints)**
   - Alertas de búsqueda desde Supabase (geohash).
   - Migrar transactionEngine a Supabase o profiles.
   - Reducir dependencia de DemoFlowManager en flujos críticos.

3. **Calidad y rendimiento (1 sprint)**
   - Code-split History, Profile.
   - Tests E2E flujos críticos.
   - Activar Sentry si aplica.

4. **Documentación**
   - Consolidar docs en MIGRATION_COMPLETE.md.
   - Mantener WAITME_AGENT_CONTEXT.md y PROJECT_SOURCE_OF_TRUTH.md actualizados.

```

================================================================
FILE: docs/WORKFLOWS_WAITME.md
================================================================
```md
# Workflows WaitMe — Prompts reutilizables

Prompts listos para pegar en Cursor. Copiar el bloque completo y adaptar si hace falta.

---

## 1. Auditoría exhaustiva

```
Haz una auditoría exhaustiva del proyecto WaitMe siguiendo docs/AUDITORIA_EXHAUSTIVA_FINAL.md y docs/CURSOR_RULES_WAITME.md. Incluye:
- Estado de migración Supabase por dominio
- Restos de base44 o código muerto
- Archivos sin uso
- Riesgos de arquitectura
- Validación de CI/CD
Entregar informe en docs/ y resumen en chat. No tocar Home.jsx ni cambiar visuales.
```

---

## 2. Arreglar mapa

```
El mapa no se renderiza correctamente en [simulador / build local / preview]. Sigue docs/MAP_DEBUG_CHECKLIST.md:
1. Verificar token Mapbox en .env
2. Revisar contenedor del mapa (altura, z-index)
3. Comprobar MapboxMap.jsx y ParkingMap.jsx
4. Aplicar solo fixes seguros. No cambiar diseño visual.
Documentar cambios y prueba recomendada.
```

---

## 3. Revisar migración Supabase

```
Revisa que todos los dominios (auth, profiles, alertas, chat, notificaciones, transacciones, uploads, user_locations) usen solo Supabase. Verifica:
- src/data/*.js delegan a servicios Supabase
- No hay imports de base44 ni mocks sustituyendo flujos reales
- Tablas en supabase/migrations coinciden con uso
Entregar veredicto por dominio: migrado / parcial / no migrado.
```

---

## 4. Limpieza de archivos muertos

```
Detecta archivos muertos, componentes duplicados y código sin uso en WaitMe. Clasifica como:
- borrar ya
- mantener temporalmente
- refactorizar después
No borrar sin confirmar que ningún import los referencia. No tocar Home.jsx, History.jsx ni flujos críticos.
```

---

## 5. Cambio visual seguro

```
Quiero cambiar [descripción exacta del cambio visual]. Aplica siguiendo docs/SAFE_CHANGE_PROTOCOL.md:
- Qué archivos se van a tocar
- Impacto esperado
- Forma de validación
Solo modificar lo estrictamente necesario. Mantener mobile-first.
```

---

## 6. Revisión antes de push

```
Antes de hacer push, revisa:
- Lint y build pasan
- No se han tocado Home.jsx, History.jsx ni mapas sin necesidad
- Cambios documentados
- No hay duplicidad de servicios/hooks
Lista archivos modificados y su propósito.
```

---

## 7. Validación de CI/CD

```
Revisa la configuración de CI/CD de WaitMe:
- .github/workflows/ activos
- Secrets documentados en docs/CI_SETUP.md
- Scripts de package.json (lint, build, test)
- Si algo falla, proponer fix sin romper el pipeline
```

```

================================================================
FILE: eslint.config.js
================================================================
```js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";

export default [
  { ignores: ["dist", "node_modules", "ios", "ios__*", "**/DerivedData/**", "build", "coverage"] },
  configPrettier,
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
      "src/App.jsx",
      "tests/**/*.js",
      "playwright.config.js",
    ],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
      prettier: pluginPrettier,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      "prettier/prettier": "off",
    },
  },
];

```

================================================================
FILE: force-sync.txt
================================================================
```txt
sync

```

================================================================
FILE: functions/searchGooglePlaces.ts
================================================================
```ts
export default async function searchGooglePlaces({ query }) {
  try {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return { suggestions: [], error: 'API key not configured' };
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:es&key=${GOOGLE_MAPS_API_KEY}&language=es`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.predictions) {
      return { suggestions: [] };
    }

    const suggestionsWithCoords = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          const lat = detailsData.result?.geometry?.location?.lat || null;
          const lng = detailsData.result?.geometry?.location?.lng || null;

          return {
            display_name: prediction.main_text + (prediction.secondary_text ? ', ' + prediction.secondary_text : ''),
            place_id: prediction.place_id,
            lat,
            lng
          };
        } catch {
          return {
            display_name: prediction.main_text + (prediction.secondary_text ? ', ' + prediction.secondary_text : ''),
            place_id: prediction.place_id,
            lat: null,
            lng: null
          };
        }
      })
    );

    return { suggestions: suggestionsWithCoords };
  } catch (error) {
    return { suggestions: [], error: error.message };
  }
}
```

================================================================
FILE: index.html
================================================================
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="WaitMe!" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" type="image/png" href="./apple-touch-icon.png" />
    <link rel="apple-touch-icon" href="./apple-touch-icon.png" />
    <link rel="manifest" href="./manifest.json" />
    <title>WaitMe!</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

================================================================
FILE: ios/App/App/AppDelegate.swift
================================================================
```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

```

================================================================
FILE: ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json
================================================================
```json
{
  "images" : [
    {
      "filename" : "AppIcon-512@2x.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}

```

================================================================
FILE: ios/App/App/Assets.xcassets/Contents.json
================================================================
```json
{
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
```

================================================================
FILE: ios/App/App/Assets.xcassets/Splash.imageset/Contents.json
================================================================
```json
{
  "images" : [
    {
      "idiom" : "universal",
      "filename" : "splash-2732x2732-2.png",
      "scale" : "1x"
    },
    {
      "idiom" : "universal",
      "filename" : "splash-2732x2732-1.png",
      "scale" : "2x"
    },
    {
      "idiom" : "universal",
      "filename" : "splash-2732x2732.png",
      "scale" : "3x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
```

================================================================
FILE: ios/App/App/capacitor.config.json
================================================================
```json
{
	"appId": "com.waitme.app",
	"appName": "WaitMe",
	"webDir": "dist",
	"bundledWebRuntime": false,
	"server": {
		"url": "http://192.168.0.15:5173",
		"cleartext": true
	},
	"packageClassList": [
		"AppPlugin",
		"CAPBrowserPlugin",
		"PreferencesPlugin",
		"StatusBarPlugin"
	]
}

```

================================================================
FILE: ios/App/App/config.xml
================================================================
```xml
<?xml version='1.0' encoding='utf-8'?>
<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <access origin="*" />
  
  
</widget>
```

================================================================
FILE: ios/App/App/public/cordova.js
================================================================
```js

```

================================================================
FILE: ios/App/App/public/cordova_plugins.js
================================================================
```js

```

================================================================
FILE: ios/App/App/public/index.html
================================================================
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="WaitMe!" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" type="image/png" href="./apple-touch-icon.png" />
    <link rel="apple-touch-icon" href="./apple-touch-icon.png" />
    <link rel="manifest" href="./assets/manifest-BIdaHA7b.json" />
    <title>WaitMe!</title>
    <script type="module" crossorigin src="./assets/index-yOnL7ojE.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index-ChPnJ2JQ.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>

```

================================================================
FILE: ios/App/CapApp-SPM/Package.swift
================================================================
```swift
// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.2.0"),
        .package(name: "CapacitorApp", path: "../../../node_modules/@capacitor/app"),
        .package(name: "CapacitorBrowser", path: "../../../node_modules/@capacitor/browser"),
        .package(name: "CapacitorPreferences", path: "../../../node_modules/@capacitor/preferences"),
        .package(name: "CapacitorStatusBar", path: "../../../node_modules/@capacitor/status-bar")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorBrowser", package: "CapacitorBrowser"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar")
            ]
        )
    ]
)

```

================================================================
FILE: ios/App/CapApp-SPM/README.md
================================================================
```md
# CapApp-SPM

This SPM is used to host SPM dependencies for you Capacitor project

Do not modify the contents of it or there may be unintended consequences.

```

================================================================
FILE: ios/App/CapApp-SPM/Sources/CapApp-SPM/CapApp-SPM.swift
================================================================
```swift
public let isCapacitorApp = true

```

================================================================
FILE: jsconfig.json
================================================================
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["esnext", "dom"],
    "target": "esnext",
    "checkJs": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": []
  },
  "include": ["src/components/**/*.js", "src/pages/**/*.jsx", "src/Layout.jsx"],
  "exclude": ["node_modules", "dist", "src/vite-plugins", "src/components/ui", "src/api", "src/lib"]
} 
```

================================================================
FILE: knip.json
================================================================
```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/main.jsx", "src/**/*.stories.{js,jsx}", "tests/**/*.spec.js"],
  "project": ["src/**/*.{js,jsx,ts,tsx}", "tests/**/*.{js,ts}"],
  "ignore": ["**/node_modules/**", "**/dist/**", "**/storybook-static/**", "**/ios/**"],
  "ignoreDependencies": ["@chromatic-com/storybook", "prop-types"]
}

```

================================================================
FILE: manifest.json
================================================================
```json
{
  "name": "WaitMe!",
  "short_name": "WaitMe!",
  "description": "Aparca donde te avisen",
  "start_url": "./#/",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/apple-touch-icon.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}

```
