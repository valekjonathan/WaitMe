# Auditoría Técnica Profesional — WaitMe

**Fecha:** 2025-03-06

---

## 1. ARQUITECTURA

### 1.1 Mapa de pantallas principales

| Ruta | Componente | Función |
|------|------------|---------|
| `/`, `/home` | Home | Mapa fullscreen, modos search/create |
| `/history`, `/alertas`, `/alerts` | History | Lista alertas (vendedor/comprador) |
| `/chats` | Chats | Lista conversaciones |
| `/chat/:id` | Chat | Chat individual |
| `/notifications` | Notifications | Centro notificaciones |
| `/profile` | Profile | Perfil usuario |
| `/settings` | Settings | Ajustes |
| `/navigate` | Navigate | Navegación a plaza |
| `/notification-settings` | NotificationSettings | Config notificaciones |
| `/dev-diagnostics` | DevDiagnostics | Diagnósticos (DEV) |
| `/` (no auth) | Login | Login OAuth |

### 1.2 Componentes compartidos

| Componente | Usado en |
|------------|----------|
| Header | Layout (global) |
| BottomNav | Layout (global) |
| MapboxMap | Home |
| ParkingMap | Navigate |
| CreateMapOverlay | Home (modo create) |
| SearchMapOverlay | Home (modo search) |
| MapViewportShell | Home |
| MapScreenPanel | CreateMapOverlay, SearchMapOverlay |
| UserAlertCard | SearchMapOverlay, History |
| CreateAlertCard | CreateMapOverlay |
| IncomingRequestModal | App (global) |
| DemoFlowManager | App (global) |
| WaitMeRequestScheduler | App (global) |

### 1.3 Wrappers y shells globales

| Shell | Función |
|-------|---------|
| App | AuthRouter, paddingTop safe-area |
| Layout | LayoutProvider, Header, main, BottomNavLayer |
| LayoutShell | pt-[69px], pb-24, Outlet |
| MapViewportShell | MapLayer + OverlayLayer, fuente única mapa |
| MapScreenShell | Deprecated, re-export MapViewportShell |
| MapScreenPanel | Posicionamiento tarjetas flotantes (paddingBottom 150px) |
| MapLayer | absolute inset-0, z-0 |
| OverlayLayer | absolute inset-0, z-20 |
| BottomNavLayer | absolute bottom-0, z-30 |

### 1.4 Flujo principal

```
Login → Home (mapa) → [search | create]
  search: SearchMapOverlay + UserAlertCard
  create: CreateMapOverlay + CreateAlertCard
Home → History (Alertas) → Chat / Navigate
Realtime: Supabase subscriptions → React Query invalidate
Auth: Supabase Auth → AuthContext → Layout
```

---

## 2. DUPLICIDADES

### 2.1 Componentes duplicados o casi duplicados

| Duplicidad | Archivos | Acción |
|------------|----------|--------|
| MapScreenShell vs MapViewportShell | MapScreenShell re-exporta MapViewportShell | Mantener por compatibilidad |
| getCarFill | carUtils.js, History.jsx, MarcoCard.jsx, UserAlertCard.jsx, IncomingRequestModal.jsx | Centralizar en carUtils |
| formatPlate | carUtils.js, History.jsx, MarcoCard.jsx, UserAlertCard.jsx, Notifications.jsx, Profile.jsx | Centralizar en carUtils |
| CAR_COLOR_MAP | carUtils.js, IncomingRequestModal (CAR_COLOR_MAP_MODAL) | Unificar |
| getCarFillThinking | History.jsx, HistorySellerView | Variante para "thinking" (gris distinto) |

### 2.2 Helpers repetidos

| Helper | Ubicaciones |
|--------|------------|
| formatPlate | 6 archivos |
| getCarFill | 5 archivos |
| CarIconProfile (SVG coche) | Home.jsx, History.jsx (duplicado) |

### 2.3 Estilos repetidos

| Patrón | Archivos |
|--------|----------|
| `min-h-[100dvh]` | 15+ archivos |
| `min-min-h-[100dvh]` (typo) | Chat.jsx, Chats.jsx, Settings.jsx, NotificationSettings.jsx |
| `bg-black`, `text-white` | Múltiples páginas |
| safe-area padding | globals.css, BottomNav, MapScreenPanel |

### 2.4 Cálculos viewport/safe-area

| Ubicación | Valor |
|-----------|-------|
| globals.css | --bottom-nav-h, --header-h, --safe-* |
| MapScreenPanel | paddingBottom: 150px |
| BottomNav | paddingBottom: calc(4px + env(safe-area-inset-bottom)) |

### 2.5 Scripts repetidos

| Script | Duplicado |
|--------|-----------|
| dev | dev:auto (idéntico) |
| test | test:e2e (idéntico) |
| test:ui | test:e2e:ui (idéntico) |

---

## 3. CÓDIGO MUERTO O CONFUSO

### 3.1 Archivos no usados

| Archivo | Motivo |
|---------|--------|
| src/hooks/useParkingAlerts.js | No importado |
| src/services/parkingAlertService.js | Solo usado por useParkingAlerts (muerto) |
| src/models/ParkingAlert.js | createParkingAlert no importado |

### 3.2 Exports no usados

| Archivo | Export |
|---------|--------|
| src/lib/utils.js | isIframe |
| src/utils/carUtils.js | haversineMeters |
| src/lib/mockNearby.js | getMockNearbyAlerts (solo MOCK_USERS usado) |
| src/components/ui/use-toast.jsx | useToast (solo toast usado) |

### 3.3 Typo min-min-h

- `min-min-h-[100dvh]` en 4 archivos: clase Tailwind no válida, debería ser `min-h-[100dvh]` |

---

## 4. RENDIMIENTO

### 4.1 Componentes sin memo

| Componente | Nota |
|------------|------|
| UserAlertCard | Recibe alert, userLocation; podría beneficiar de memo |
| CreateAlertCard | Formulario, menos crítico |
| BottomNav | Re-render en cada navegación |
| MapZoomControls | Dentro de overlays |

### 4.2 Callbacks sin useCallback

| Ubicación | Callback |
|-----------|----------|
| Home.jsx | handleMapMove, handleMapMoveEnd, handleRecenter, etc. (algunos ya con useCallback) |
| History.jsx | formatPlate, getCarFill, formatCardDate pasados a hijos |

### 4.3 Cálculos sin useMemo

| Ubicación | Cálculo |
|-----------|---------|
| History.jsx | filteredAlerts, visibleActiveAlerts (ya con useMemo en varios) |
| Home.jsx | homeMapAlerts, filteredAlerts (ya con useMemo) |

### 4.4 MapboxMap

- ResizeObserver: correcto
- cleanup en unmount: correcto
- 100dvh: correcto
- Posibles fugas: markersRef cleanup en useEffect return

### 4.5 Listeners / eventos

| Evento | Riesgo |
|--------|--------|
| waitme:goLogo | Múltiples listeners en MapboxMap, Home |
| waitme:thinkingUpdated | History.jsx |
| resize | MapboxMap ResizeObserver |

---

## 5. ESTABILIDAD

### 5.1 Dependencias

| Dependencia | Sensibilidad |
|-------------|--------------|
| mapbox-gl | Token obligatorio |
| @supabase/supabase-js | URL y key obligatorios |
| @capacitor/* | Solo en build iOS |
| react-router-dom | v6 |

### 5.2 Viewport / safe-area

| Riesgo | Estado |
|--------|--------|
| 100vh en iOS | Eliminado, usar 100dvh |
| HMR host hardcodeado | Eliminado |
| MapScreenPanel padding | 150px fijo, validado |

### 5.3 Web vs iOS

| Aspecto | Estado |
|---------|--------|
| Mismo shell mapa | MapViewportShell unificado |
| Mismo servidor dev | dev:ios con IP automática |
| Safe area | env() en globals.css |

### 5.4 Lugares frágiles

| Archivo | Riesgo |
|---------|--------|
| History.jsx | thinking_requests, rejected_requests en localStorage |
| Chat.jsx | DemoFlowManager + flujo real |
| MapboxMap | Token, dimensiones contenedor |

---

## 6. ENTORNO

### 6.1 package.json

- Scripts: dev, dev:ios, ios:*, build, lint, test, format
- Duplicados: dev:auto=dev, test=test:e2e, test:ui=test:e2e:ui

### 6.2 vite.config.js

- host: true, port: 5173 ✓
- Sin hmr hardcodeado ✓

### 6.3 capacitor.config.ts

- server condicional con CAPACITOR_USE_DEV_SERVER ✓

### 6.4 .vscode

- settings.json: formatOnSave, eslint ✓
- extensions.json: eslint, prettier, tailwind ✓

### 6.5 husky / lint-staged

- pre-commit: lint-staged + build ✓
- post-commit: git push ✓
- lint-staged: prettier + eslint ✓

### 6.6 playwright

- webServer: vite ✓
- CI: webkit-mobile ✓

### 6.7 Sentry

- src/lib/sentry.js, opcional
- VITE_SENTRY_DSN

### 6.8 GitHub Actions

- ci.yml: lint, build, playwright ✓

---

## 7. PRIORIDADES

### Crítica

| # | Hallazgo | Acción |
|---|----------|--------|
| 1 | min-min-h typo (4 archivos) | Corregir a min-h |
| 2 | Código muerto: useParkingAlerts, parkingAlertService, ParkingAlert | Eliminar |

### Alta

| # | Hallazgo | Acción |
|---|----------|--------|
| 3 | getCarFill/formatPlate duplicados | Centralizar en carUtils (History protegido) |
| 4 | getMockNearbyAlerts no usado | Eliminar export o archivo |
| 5 | Scripts duplicados package.json | Eliminar dev:auto, unificar test |

### Media

| # | Hallazgo | Acción |
|---|----------|--------|
| 6 | isIframe, haversineMeters no usados | Eliminar o documentar |
| 7 | useToast no usado | Mantener (API del componente) |
| 8 | CarIconProfile duplicado Home/History | Documentar, no tocar History |

### Baja

| # | Hallazgo | Acción |
|---|----------|--------|
| 9 | Memoización componentes | Evaluar caso a caso |
| 10 | Barrel exports system/map, system/layout | Mantener |
