# Auditoría Técnica Total — WaitMe

**Fecha:** 8 de marzo de 2025  
**Objetivo:** Verificar si el proyecto alcanza nivel profesional comparable a Uber, Cabify, Bolt, Glovo, Stripe.

---

## Resumen ejecutivo

WaitMe es una app marketplace de alertas de aparcamiento con mapa en tiempo real. La auditoría analiza 12 áreas críticas y concluye que el proyecto tiene **base sólida** (arquitectura limpia, pipeline de ubicación profesional, adapters de datos, CI básico) pero presenta **deuda técnica y gaps** que impiden alcanzar nivel 10/10 de apps de movilidad.

**Estado actual:** ~7/10 — listo para MVP, no para escala enterprise.

---

## 1. Arquitectura del proyecto

### Estructura de carpetas

```
src/
├── components/     # UI (map, home, chat, history, etc.)
├── pages/          # Pantallas (Home, History, Chat, Navigate, etc.)
├── hooks/          # Lógica reutilizable (useHome, useLocationEngine, etc.)
├── lib/            # Core: location, mapLayers, AuthContext, supabaseClient
├── services/       # *Supabase.js — capa de acceso a Supabase
├── data/           # Adapters (Strangler pattern) — abstraen proveedor
├── stores/         # carsMovementStore (JS module, no Zustand)
├── system/         # layout, map (MapViewportShell)
├── core/           # ErrorBoundary
├── config/         # Constantes
├── utils/          # Helpers
├── dev/            # diagnostics, layoutInspector
└── assets/
```

### Fortalezas

- **Strangler pattern** en `src/data/`: componentes nunca llaman a Supabase directamente.
- **Separación clara** entre adapters, servicios y UI.
- **Hooks especializados** en Home (useHomeQueries, useHomeAlerts, useHomeMapState, useHomeActions).
- **Motor de ubicación único** centralizado en `locationEngine.js`.

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Zustand en package.json sin uso | BAJO | `zustand` está instalado pero no se usa. Estado global vía Context + módulos JS (carsMovementStore, finalizedAtStore). Documentación (WAITME_AGENT_CONTEXT) menciona "appStore (Zustand)" que no existe. |
| Documentación desactualizada | MEDIO | WAITME_AGENT_CONTEXT.md habla de appStore/Zustand; la realidad es Context + stores JS. |
| Carpeta `stores` mínima | BAJO | Solo `carsMovementStore.js`. `finalizedAtStore` está en `lib/`, no en stores. Inconsistencia de ubicación. |
| Dev/diagnostics en src | BAJO | `src/dev/` mezcla código de diagnóstico con producción. |

### Patrones de arquitectura

- **Adapter pattern** (data/*.js → services/*Supabase.js)
- **Pub/sub** (locationEngine subscribers, carsMovementStore listeners)
- **Pipeline** (locationPipeline: fraud → validator → Kalman → smoother → map matching)

---

## 2. Sistema de ubicación

### Componentes

- **locationEngine.js**: Motor único. Primera posición vía `getPreciseInitialLocation`, luego `watchPosition` + pipeline opcional.
- **locationPipeline.js**: fraud → movement validator → Kalman → advanced smoother → map matching.
- **locationFraudDetector.js**: teleport (>200m/<2s), velocidad imposible (>150 km/h), GPS mock, accuracy extrema.
- **locationMovementValidator.js**: valida saltos y coherencia.
- **locationKalmanFilter.js**, **locationSmoothingAdvanced.js**, **locationMapMatcher.js**: filtrado y snap-to-road.

### Fortalezas

- Pipeline profesional comparable a apps de movilidad.
- Detección de fraude GPS.
- Kalman + map matching para suavizado.
- Fuente única de verdad (locationEngine).

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Pipeline no activado por defecto | MEDIO | `startLocationEngine({ pipeline: true })` debe pasarse explícitamente. Si no se pasa, se usa smoothing legacy o ninguno. |
| Oviedo fallback hardcodeado | BAJO | `OVIEDO_FALLBACK` en locationEngine. Debería ser configurable. |
| positionHistory en módulo global | MEDIO | `locationFraudDetector` mantiene `positionHistory` en closure. Sin reset explícito puede acumular datos entre sesiones. |
| Logs de fraude en stderr | BAJO | `logLocationFraud` escribe a consola. En producción debería ir a backend/analytics. |

### Duplicaciones

- No hay duplicación de lógica de ubicación. Un solo motor.

---

## 3. Sistema de mapas

### Componentes

- **MapboxMap.jsx**: componente principal. ResizeObserver, capas GeoJSON, CenterPin, marcadores.
- **MapLayers.js**: `applyStaticCarsLayer`, `applyUserLocationLayer`, `applyWaitMeCarLayer`, `updateCarPosition`.
- **MapInit.js**, **MapEvents.js**, **MapControls.js**, **MapMarkers.js**: inicialización, eventos, controles.
- **alertsToGeoJSON** (mapLayers): conversión de alertas a GeoJSON.

### Fortalezas

- Capas GeoJSON bien separadas (StaticCars, UserLocation, WaitMeCar).
- Modo STATIC vs WAITME_ACTIVE para coches.
- CenterPin para modo create/search.
- `suppressInternalWatcher` para evitar doble watcher cuando Home pasa `locationFromEngine`.

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Arquitectura no tipo Uber | ALTO | Uber usa tiles vectoriales optimizados, clustering dinámico, capas separadas por zoom. WaitMe usa GeoJSON estático. |
| Sin clustering | MEDIO | Muchas alertas en pantalla pueden degradar rendimiento. Mapbox clustering no implementado. |
| Pin + bolita pendiente | ALTO | Usuario indicó que falta "ubicación exacta real (palito + bolita)". Actualmente solo pin o círculo. |
| VITE_DISABLE_MAP para diagnóstico | BAJO | Flag de desarrollo correcto, pero indica fragilidad del mapa en dev. |
| GeoJSON "definitivo" pendiente | MEDIO | Formato GeoJSON puede evolucionar; no hay contrato estable documentado. |

### Rendimiento

- ResizeObserver correcto.
- `memo` en MapboxMapInner.
- Posible mejora: debounce en `onMapMove`/`onMapMoveEnd` si hay muchos re-renders.

---

## 4. Estado global

### Fuentes de estado

| Fuente | Tipo | Uso |
|--------|------|-----|
| AuthContext | React Context | user, profile, isAuthenticated, signIn, signOut |
| LayoutContext | React Context | header, setHeader |
| carsMovementStore | Módulo JS + listeners | STATIC / WAITME_ACTIVE |
| finalizedAtStore | Módulo JS + localStorage | Timestamps de alertas finalizadas (para orden) |
| React Query | Cache | alertas, reservas, chats, etc. |
| transactionEngine | Módulo JS + Map | balance, ban, extraCommission (en memoria) |

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| transactionEngine en memoria | CRÍTICO | `userState` es un Map en memoria. Al recargar la app se pierde balance, ban, comisión extra. No persiste en Supabase. |
| finalizedAtStore en localStorage | MEDIO | Funciona pero crece indefinidamente. Sin limpieza de IDs antiguos. |
| Zustand no usado | BAJO | Dependencia instalada sin uso. Documentación incorrecta. |
| Múltiples fuentes de verdad | MEDIO | Auth (Context), layout (Context), coches (store), finalized (localStorage), transacciones (memoria). No hay store unificado. |

---

## 5. Backend (Supabase)

### Tablas principales

- profiles, parking_alerts, alert_reservations, conversations, messages, notifications, transactions, user_location_updates.
- Storage: avatars, uploads.

### Migraciones

- 18 migraciones SQL. Schema core, RLS, triggers, geohash, realtime, storage, payment release idempotency.

### Fortalezas

- RLS en profiles y otras tablas.
- Realtime habilitado en parking_alerts.
- Geohash para búsquedas geo.
- Edge Function `release-payment` para pago al llegar a 5m.
- Idempotencia en payment release.

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Auth OAuth en iOS Simulator | CRÍTICO | Usuario indica que login Google real no funciona en iOS Simulator. |
| Realtime no en todas las tablas críticas | MEDIO | Solo parking_alerts tiene realtime explícito. Otras tablas pueden depender de polling/refetch. |
| Queries sin índices documentados | BAJO | Geohash indexado; falta documentar índices para otras consultas frecuentes. |
| Edge Functions sin tests | MEDIO | release-payment no tiene tests automatizados. |

---

## 6. Flujo WaitMe

### Flujo esperado

1. **Publicar alerta**: vendedor publica (precio, ubicación, tiempo).
2. **Reserva**: comprador reserva.
3. **Coche moviéndose**: comprador en ruta; vendedor ve coche en mapa (WAITME_ACTIVE).
4. **Pago al llegar a 5m**: Edge Function `release-payment` libera pago.

### Componentes involucrados

- IncomingRequestModal, WaitMeRequestScheduler (demo).
- arrivalConfidenceEngine (detección 5m).
- transactionEngine (reglas económicas).
- release-payment Edge Function.

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| transactionEngine en memoria | CRÍTICO | Balance/ban no persisten. Flujo de pago real depende de Supabase/Stripe; el motor de transacciones es ficticio en memoria. |
| Demo vs real mezclado | MEDIO | DemoFlowManager, WaitMeRequestScheduler para demo. Flujo real depende de Supabase. Documentar claramente qué es demo y qué real. |
| arrivalConfidenceEngine | BAJO | Lógica de 5m implementada; verificar integración con release-payment. |

---

## 7. Rendimiento

### Observaciones

- **React Query** con staleTime 5min, gcTime 30min. Refetch desactivado en focus/reconnect/mount.
- **Sentry** con tracesSampleRate 1.0 (alto; en producción considerar 0.1).
- **ResizeObserver** en MapboxMap.
- **memo** en componentes internos del mapa.

### Posibles problemas

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| tracesSampleRate 1.0 | MEDIO | En producción puede generar mucho volumen en Sentry. |
| Sin lazy loading de rutas | BAJO | Todas las páginas cargadas. React.lazy para History, Chat, etc. podría ayudar. |
| Watchers duplicados si mal configurado | BAJO | `suppressInternalWatcher` evita doble watcher cuando Home pasa locationFromEngine. Correcto. |
| Memory leaks en listeners | BAJO | carsMovementStore, locationEngine usan Set + unsubscribe. Correcto. Revisar que todos los componentes limpien. |

---

## 8. Seguridad

### Auth

- OAuth con PKCE (Supabase).
- Redirect URLs allowlist (capacitor://, com.waitme.app://, localhost).
- DEV_MOCK_USER solo en desarrollo.

### Ubicación

- locationFraudDetector: teleport, velocidad, mock, accuracy.
- Logs de fraude (actualmente consola; debería backend).

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Fraude solo client-side | MEDIO | Detección de fraude GPS es client-side. Un atacante puede bypassear. Backend debería validar ubicaciones críticas (ej. llegada 5m). |
| transactionEngine sin persistencia | CRÍTICO | Estado económico en memoria. No hay auditoría ni persistencia. |
| RLS no auditado en profundidad | MEDIO | Migraciones definen RLS; falta auditoría de que todas las tablas críticas estén protegidas. |

---

## 9. Tests

### Estado actual

- **Vitest**: 105 tests pasando (contracts: alerts, chat, notifications, transactions, uploads, userLocations, locationFraud, mockNavigateCars, etc.).
- **Playwright**: E2E configurado (smoke, load, safe-mode). No se ejecutaron en esta auditoría por tiempo.
- **tests/** en .cursorignore: no se pudo inspeccionar con grep directo.

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Tests E2E no en CI | ALTO | CI solo ejecuta lint, typecheck, build. No ejecuta `npm test` (Vitest) ni Playwright. |
| Tests skipped (según usuario) | MEDIO | Usuario indicó "24 passed / 13 skipped". En ejecución reciente: 105 passed. Posible discrepancia por suite diferente (contracts vs E2E). |
| Sin tests de integración para Edge Functions | MEDIO | release-payment sin tests. |
| Cobertura no medida | BAJO | No hay reporte de cobertura (c8, vitest --coverage). |

---

## 10. CI/CD

### Configuración actual

```yaml
# .github/workflows/ci.yml
- lint
- typecheck
- build
```

### Problemas detectados

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| Sin tests en CI | CRÍTICO | Vitest y Playwright no se ejecutan en CI. |
| Sin deploy automático | MEDIO | No hay workflow de deploy a staging/producción. |
| Secrets requeridos | BAJO | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN. Correcto. |
| Sin cache de node_modules | BAJO | npm install cada vez. actions/cache podría acelerar. |

---

## 11. Preparación para producción

### Logging

- Sentry configurado (si VITE_SENTRY_DSN).
- logLocationFraud, logLocationDiagnostic en consola.
- No hay logging estructurado (JSON) para backend.

### Errores

- ErrorBoundary en main.jsx.
- SafeModeShell para VITE_SAFE_MODE.
- MissingEnvScreen para env faltante.

### Observabilidad

- Sentry con browserTracingIntegration.
- Sin métricas de negocio (alertas publicadas, reservas, pagos).
- Sin health checks documentados.

### Escalabilidad

- Supabase escala por plan.
- Sin CDN para assets estáticos documentado.
- Mapbox tiene límites de uso por token.

---

## 12. Comparación con apps grandes

### Uber / Cabify / Bolt

| Aspecto | WaitMe | Uber/Cabify/Bolt |
|---------|--------|------------------|
| Ubicación | Pipeline Kalman + fraud + map matching | Similar + backend validation |
| Mapa | GeoJSON, capas básicas | Tiles vectoriales, clustering, optimización por zoom |
| Estado | Context + módulos JS | Zustand/Redux, store unificado |
| Tests | Contracts OK, E2E no en CI | E2E en CI, integración, carga |
| Observabilidad | Sentry básico | APM, métricas, logs centralizados |
| Transacciones | En memoria (ficticio) | Persistido, auditoría, idempotencia |
| Auth | OAuth PKCE | Similar + refresh, session management |

### Glovo / Stripe

- Glovo: flujo de pedidos, tracking en tiempo real, pagos integrados.
- Stripe: idempotencia, webhooks, reconciliación.

WaitMe tiene base similar en arquitectura de datos (adapters, servicios) pero le falta persistencia de transacciones, tests en CI y observabilidad avanzada.

---

---

# Lista priorizada de problemas

## CRÍTICO

1. **transactionEngine en memoria** — Balance, ban y comisión extra no persisten. Recarga pierde estado.
2. **Tests no en CI** — Vitest y Playwright no se ejecutan en GitHub Actions.
3. **Login Google en iOS Simulator** — No funciona (según usuario).

## ALTO

4. **Arquitectura mapa no tipo Uber** — Sin clustering, tiles optimizados, capas por zoom.
5. **Pin + bolita de ubicación** — Pendiente implementación "ubicación exacta real".
6. **Fraude GPS solo client-side** — Backend debería validar ubicaciones críticas.
7. **Documentación desactualizada** — WAITME_AGENT_CONTEXT menciona appStore/Zustand inexistente.

## MEDIO

8. **Pipeline de ubicación no activado por defecto** — Debe pasarse `pipeline: true` explícitamente.
9. **finalizedAtStore sin limpieza** — localStorage crece indefinidamente.
10. **Realtime no en todas las tablas** — Solo parking_alerts documentado.
11. **Edge Functions sin tests** — release-payment sin tests automatizados.
12. **tracesSampleRate 1.0** — Sentry puede generar volumen alto en producción.
13. **Demo vs real poco documentado** — Clarificar qué flujos son demo y cuáles real.

## BAJO

14. **Zustand instalado sin uso** — Eliminar o implementar.
15. **Oviedo fallback hardcodeado** — Hacer configurable.
16. **Carpeta stores vs lib** — finalizedAtStore en lib; inconsistencia.
17. **Sin lazy loading de rutas** — Mejora de rendimiento.
18. **Sin reporte de cobertura** — Añadir vitest --coverage.
19. **Logs de fraude en consola** — Enviar a backend/analytics en producción.

---

---

# Plan de mejora paso a paso (hacia 10/10)

## Fase 1 — Estabilidad (CRÍTICO)

1. **Persistir transactionEngine** — Mover balance, ban, extraCommission a Supabase (tabla `user_transaction_state` o similar). Migración + servicio.
2. **Añadir tests a CI** — Ejecutar `npm test` (Vitest) en ci.yml. Opcional: Playwright en job separado.
3. **Arreglar login Google iOS** — Revisar redirect URLs, Capacitor config, Supabase OAuth para iOS Simulator.

## Fase 2 — Calidad (ALTO)

4. **Actualizar documentación** — Corregir WAITME_AGENT_CONTEXT (eliminar appStore/Zustand o implementar).
5. **Implementar pin + bolita** — Ubicación exacta en mapa (círculo precisión + marcador).
6. **Validación backend de ubicación** — En release-payment o en una Edge Function, validar que la ubicación del comprador esté realmente a ≤5m antes de liberar pago.
7. **Mapa: clustering** — Añadir Mapbox clustering para muchas alertas. Documentar arquitectura tipo Uber.

## Fase 3 — Robustez (MEDIO)

8. **Activar pipeline por defecto** — `startLocationEngine({ pipeline: true })` como default.
9. **Limpiar finalizedAtStore** — Política de retención (ej. eliminar IDs > 30 días).
10. **Tests para release-payment** — Tests de integración o unitarios para Edge Function.
11. **Reducir tracesSampleRate** — 0.1 en producción.
12. **Documentar demo vs real** — Sección en docs indicando flujos demo (DemoFlowManager) y real (Supabase).

## Fase 4 — Pulido (BAJO)

13. **Eliminar Zustand o usarlo** — Si no se usa, eliminar de package.json. Si se quiere store unificado, migrar carsMovementStore/finalizedAtStore a Zustand.
14. **Configurar fallback de ubicación** — Variable de entorno para centro por defecto.
15. **Lazy loading de rutas** — React.lazy para History, Chat, etc.
16. **Cobertura de tests** — vitest --coverage, umbral mínimo.
17. **Logs de fraude a backend** — Endpoint o Supabase para registrar intentos de fraude.

## Fase 5 — Producción

18. **Deploy automático** — Workflow para staging/producción.
19. **Health checks** — Endpoint o página de status.
20. **Métricas de negocio** — Eventos a analytics (alertas publicadas, reservas, pagos).

---

---

# Arquitectura ideal (referencia)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages (Home, History, Chat, Navigate)                          │
│       ↓                                                          │
│  Hooks (useHome, useLocationEngine, useMyAlerts, ...)             │
│       ↓                                                          │
│  Data Adapters (alerts, chat, notifications, ...)               │
│       ↓                                                          │
│  Services (*Supabase.js)                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Estado: AuthContext + LayoutContext + React Query               │
│  Stores: carsMovementStore, finalizedAtStore (o Zustand unificado)│
│  transactionEngine → persistido en Supabase                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase: Auth, Postgres, Realtime, Storage, Edge Functions     │
│  Mapbox: Tiles, geocoding                                        │
│  Sentry: Errores, traces (sample rate configurable)               │
└─────────────────────────────────────────────────────────────────┘
```

**Ubicación:** Motor único → pipeline (fraud, Kalman, map matching) → subscribers.  
**Mapa:** Capas GeoJSON + clustering + pin/bolita.  
**Transacciones:** Persistidas en Supabase, validación backend de ubicación en release-payment.

---

*Auditoría realizada sin modificar código. Solo análisis y documentación.*
