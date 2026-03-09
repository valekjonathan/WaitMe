# Auditoría Maestra Total — WaitMe

**Fecha:** 8 de marzo de 2025  
**Objetivo:** Diagnóstico técnico real del proyecto antes de seguir desarrollando.  
**Foco crítico:** Botón "Ubícate" no mueve el mapa en iOS Simulator.

---

## Resumen ejecutivo

WaitMe es un marketplace de alertas de aparcamiento con mapa en tiempo real. La auditoría identifica la **causa raíz** del fallo de Ubícate en Simulator y analiza 20 áreas del proyecto. El motor de ubicación funciona; el problema es **arquitectural**: dependencia de `map.on('load')` que no se dispara de forma fiable en iOS Simulator.

**Estado técnico:** ~6.5/10 — base sólida, gaps críticos en integración Mapbox + Capacitor.

---

# DIAGNÓSTICO UBÍCATE — CAUSA RAÍZ

## Flujo actual del botón Ubícate

```
CreateAlertCard (handleLocate)
    → getLastKnownLocation() || getPreciseInitialLocation()
    → window.waitmeMap?.flyToUser(loc.lng, loc.lat)
```

## Dónde se crea window.waitmeMap

```js
// MapboxMap.jsx, dentro de map.on('load')
map.on('load', () => {
  // ...
  window.waitmeMap = {
    flyToUser: (lng, lat) => {
      if (!map || lng == null || lat == null) return;
      const padding = getMapLayoutPadding();
      map.flyTo({ center: [lng, lat], zoom: 17, duration: 800, ...(padding && { padding }) });
    },
  };
});
```

## Causa raíz exacta

**En iOS Simulator, `map.on('load')` puede no ejecutarse.**

Mapbox GL JS tiene problemas conocidos con el evento `load` en iOS Simulator:

1. **WebGL limitado**: El Simulator tiene soporte WebGL reducido; el mapa puede renderizar parcialmente o fallar silenciosamente.
2. **Issues documentados**: [#6076](https://github.com/mapbox/mapbox-gl-js/issues/6076), [#6707](https://github.com/mapbox/mapbox-gl-js/issues/6707), [#10785](https://github.com/mapbox/mapbox-gl-js/issues/10785) — `map.on('load')` no se dispara de forma fiable.
3. **Safari en Simulator**: Crashes y problemas de WebGL en M1, iOS 14.5+.

**Consecuencia:** Si `map.on('load')` no se ejecuta, `window.waitmeMap` nunca se crea. CreateAlertCard llama `window.waitmeMap?.flyToUser` → undefined → no ocurre nada.

## Por qué el CenterPin no coincide con GPS

El CenterPin es un elemento UI fijo en el centro del viewport. Solo coincide con la posición GPS cuando el mapa está centrado en el usuario. Si `flyToUser` no se ejecuta, el mapa no se mueve y el CenterPin nunca se alinea.

## Conclusión del diagnóstico

| Componente | Estado | Observación |
|------------|--------|-------------|
| Motor de ubicación | OK | getLastKnownLocation, getPreciseInitialLocation funcionan |
| CreateAlertCard | OK | Lógica correcta, llama a window.waitmeMap |
| window.waitmeMap | FALLO | No se crea si map.on('load') no dispara |
| map.on('load') | FALLO | No fiable en iOS Simulator (Mapbox + WebGL) |
| Wiring React | OK | No hay problema de refs ni props |

**El problema NO viene del wiring React. Viene de Mapbox + iOS Simulator.**

---

# ANÁLISIS POR ÁREAS

## 1. Arquitectura general del código

```
src/
├── components/     # UI (map, home, chat, history)
├── pages/          # Home, History, Chat, Navigate, etc.
├── hooks/          # useHome, useLocationEngine, useHomeActions, etc.
├── lib/            # location, mapLayers, AuthContext, supabaseClient
├── services/       # *Supabase.js
├── data/           # Adapters (Strangler pattern)
├── stores/         # carsMovementStore (JS module)
├── system/         # MapViewportShell, MapLayer, OverlayLayer
├── core/           # ErrorBoundary
└── config/
```

**Fortalezas:** Strangler pattern, separación adapters/servicios, hooks especializados.  
**Debilidades:** Zustand instalado sin uso; documentación desactualizada.

---

## 2. Motor de ubicación

- **locationEngine.js**: getPreciseInitialLocation → watchPosition, pipeline opcional.
- **getLastKnownLocation()**: Devuelve `lastKnown` (objeto con lat, lng).
- **getPreciseInitialLocation()**: Promise, getCurrentPosition con reintentos.
- **LocationEngineStarter**: Inicia en App.jsx cuando el usuario está autenticado.

**Estado:** Funciona correctamente. El motor no es la causa del fallo de Ubícate.

---

## 3. Sistema de mapas Mapbox

### MapboxMap.jsx

- **Inicialización:** createMap(container) → Promise → map.on('load').
- **Lifecycle:** useEffect con [] — monta una vez, cleanup al desmontar.
- **Refs:** mapRef (externo de Home), mapboxglRef (interno).
- **window.waitmeMap:** Creado en map.on('load'); limpiado en return del useEffect.

### Problemas detectados

1. **Dependencia total de map.on('load')** para el controlador — no hay fallback.
2. **Sin verificación map.loaded()** — no se comprueba si el mapa está listo antes de operar.
3. **Efecto de recentrado compite** — useEffect con effectiveCenter hace flyTo automático; puede interferir.

### Comparación con Uber

| Aspecto | WaitMe | Uber |
|---------|--------|------|
| Inicialización | createMap + on('load') | SDK nativo, callbacks explícitos |
| Control imperativo | window.waitmeMap | API nativa, refs directos |
| Fallback load | Ninguno | Polling / style.load |
| WebGL | Depende del entorno | Nativo, sin WebGL en mapa |

---

## 4. Comunicación entre componentes React

```
Home (useHome)
  ├── mapRef, engineLocation, handleRecenter
  ├── MapViewportShell
  │   ├── MapLayer → MapboxMap (mapRef, locationFromEngine)
  │   └── OverlayLayer → HomeMapPanel
  │       └── CreateMapOverlay (mode=create)
  │           └── CreateAlertCard (mapRef, onRecenter)
```

**Problema:** CreateAlertCard y MapboxMap no comparten refs ni callbacks. La única conexión es `window.waitmeMap`, que depende de map.on('load').

---

## 5. Sistema de capas GeoJSON

- **StaticCarsLayer:** Círculos para alertas.
- **UserLocationLayer:** Círculo para ubicación GPS — coordinates: [lng, lat] sin offset.
- **WaitMeCarLayer:** Coche dinámico del comprador.

**UserLocationLayer:** Correcto. `userLocationToFeature` usa `coordinates: [lng, lat]` directamente.

---

## 6. Conexión UI ↔ mapa

- **MapLayer:** Contiene MapboxMap (z-0).
- **OverlayLayer:** Contiene HomeMapPanel (z-20, pointer-events-none).
- **CreateAlertCard:** Dentro de MapScreenPanel con pointer-events-auto.

El botón Ubícate es clickeable. La conexión falla porque window.waitmeMap no existe.

---

## 7. Control imperativo del mapa

**Diseño actual:** window.waitmeMap = { flyToUser(lng, lat) } creado en map.on('load').

**Riesgo:** Si load no dispara, no hay controlador. No hay alternativa (mapRef no llega a CreateAlertCard de forma útil sin tocar Home).

---

## 8. Integración Supabase

- Adapters en src/data/, servicios en src/services/.
- Auth, Realtime, Storage configurados.
- Sin problemas detectados en esta auditoría.

---

## 9. Estado global

| Fuente | Tipo | Uso |
|--------|------|-----|
| AuthContext | React Context | user, profile, auth |
| LayoutContext | React Context | header |
| carsMovementStore | Módulo JS | STATIC / WAITME_ACTIVE |
| finalizedAtStore | Módulo JS + localStorage | Timestamps finalizados |
| React Query | Cache | alertas, chats, etc. |
| transactionEngine | Módulo JS + Map | balance (en memoria) |

**Zustand:** En package.json, no usado. Documentación incorrecta.

---

## 10. Flujo WaitMe

Publicar alerta → Reserva → Coche en ruta → Pago a 5m. Flujo coherente con DemoFlowManager e IncomingRequestModal.

---

## 11. Rendimiento

- React Query con staleTime 5min.
- memo en MapboxMap.
- ResizeObserver correcto.
- Posible mejora: clustering para muchas alertas.

---

## 12. Seguridad

- OAuth PKCE, RLS en Supabase.
- locationFraudDetector client-side.
- transactionEngine en memoria (no persiste).

---

## 13. Tests

- Vitest: contracts (alerts, chat, location, etc.).
- Playwright: E2E, smoke, visual.
- tests/visual/verify-ubicate-button.spec.js existe.
- CI no ejecuta tests (solo lint, typecheck, build).

---

## 14. CI/CD

- GitHub Actions: lint, typecheck, build.
- Sin tests en pipeline.
- Sin deploy automático.

---

## 15. Estructura de carpetas

Organización clara. Dev/diagnostics en src/dev/. docs/archive con código en cuarentena.

---

## 16. Duplicaciones de código

- Varios flyTo/easeTo con lógica similar (MapboxMap, handleRecenter, etc.).
- getMapLayoutPadding vs getMapPadding (useCallback) — misma función, dos accesos.

---

## 17. Código muerto

- Zustand importado pero no usado.
- onRecenterRef pasado a MapboxMap pero Home no lo usa.
- Posible código en docs/archive.

---

## 18. Configuración iOS / Simulator

- capacitor.config.ts: appId, webDir, server opcional.
- ios/App/ con Xcode project.
- Dev server: CAPACITOR_USE_DEV_SERVER, cleartext: true.

---

## 19. Integración Mapbox + Capacitor

- Mapbox GL JS en WebView.
- WebGL depende del Simulator.
- Sin fallback para entornos con WebGL limitado.
- Sin detección de plataforma para ajustar estrategia de load.

---

## 20. Integración GPS en Simulator

- iOS Simulator: ubicación simulada (Features → Location).
- navigator.geolocation funciona en Simulator.
- getCurrentPosition y watchPosition operativos.
- El motor de ubicación recibe coordenadas correctamente.

---

# LISTA PRIORIZADA DE PROBLEMAS

## CRÍTICO

1. **map.on('load') no fiable en iOS Simulator** — window.waitmeMap no se crea; Ubícate no funciona.
2. **Sin fallback para load** — Si load no dispara, no hay forma de crear el controlador.
3. **transactionEngine en memoria** — Balance/ban no persisten (de auditoría anterior).

## ALTO

4. **Arquitectura de control del mapa frágil** — Dependencia de window global + evento load.
5. **Tests no en CI** — Vitest y Playwright no se ejecutan en GitHub Actions.
6. **Documentación desactualizada** — appStore/Zustand inexistente.

## MEDIO

7. **onRecenterRef no usado** — MapboxMap lo soporta pero Home no lo pasa.
8. **Código duplicado flyTo** — Múltiples lugares con lógica similar.
9. **Zustand instalado sin uso** — Dependencia huérfana.

## BAJO

10. **getMapLayoutPadding en SSR** — typeof document check correcto.
11. **CenterPin sin fallback** — Si top no se mide, usa calc(50% - 60px).

---

# PLAN TÉCNICO DE MEJORA

## Fase 1 — Ubícate en Simulator (CRÍTICO)

1. **Fallback para map load:**
   - Usar `map.isStyleLoaded()` o polling tras createMap.
   - Crear window.waitmeMap cuando `map.getStyle()` exista, no solo en on('load').
   - Considerar `map.on('style.load')` o `styledata` como alternativa (issues Mapbox).

2. **Controlador resiliente:**
   - Crear window.waitmeMap en cuanto el mapa exista (tras createMap), con verificación `map.getStyle()`.
   - Si on('load') no dispara, usar setTimeout/requestAnimationFrame para retry.

3. **Validar en dispositivo real:**
   - Probar Ubícate en iPhone físico (no Simulator) para confirmar que load sí dispara.

## Fase 2 — Arquitectura mapa (ALTO)

4. Pasar onRecenterRef desde useHome → Home → MapboxMap → CreateAlertCard (evitar window global).
5. O usar React Context para exponer flyToUser desde MapboxMap.
6. Eliminar dependencia de window.waitmeMap como única vía.

## Fase 3 — Calidad (MEDIO)

7. Añadir tests a CI (Vitest + Playwright smoke).
8. Actualizar WAITME_AGENT_CONTEXT (eliminar appStore/Zustand).
9. Eliminar Zustand o implementar store real.

## Fase 4 — Producción (BAJO)

10. Persistir transactionEngine en Supabase.
11. Clustering para alertas.
12. Deploy automático.

---

# ARQUITECTURA RECOMENDADA

## Control del mapa (Ubícate)

```
Opción A — Context:
  MapFlyContext.Provider (en MapViewportShell)
  MapboxMap setea flyToUser en el context cuando map existe
  CreateAlertCard usa useMapFlyContext().flyToUser(lng, lat)

Opción B — Ref imperativo:
  useHome crea onRecenterRef
  Home pasa onRecenterRef a MapboxMap y a CreateAlertCard (vía HomeMapPanel)
  MapboxMap: onRecenterRef.current = flyToUser en useEffect cuando mapReady
  CreateAlertCard: onRecenterRef.current?.(lng, lat)
```

## Fallback para load

```js
// En MapboxMap, tras createMap:
const ensureController = () => {
  if (map && map.getStyle() && !window.waitmeMap) {
    window.waitmeMap = { flyToUser: (lng, lat) => { /* ... */ } };
  }
};
map.on('load', ensureController);
// Fallback: si tras 3s no hay load, intentar igual
setTimeout(ensureController, 3000);
```

---

*Auditoría realizada sin modificar código. Solo análisis y documentación.*
