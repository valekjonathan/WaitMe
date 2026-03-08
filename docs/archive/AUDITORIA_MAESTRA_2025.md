# Auditoría Maestra WaitMe — Marzo 2025

## Resumen ejecutivo

Auditoría completa del proyecto WaitMe: optimización de procesos, Mapbox, tests y generación de artefactos para análisis profundo.

---

## 1. Problemas detectados

### Alta prioridad
| Problema | Ubicación | Estado |
|----------|-----------|--------|
| DemoFlowManager: `setInterval` sin cleanup | `DemoFlowManager.jsx` | ✅ Corregido: añadido `stopDemoFlow()` |
| Playwright: workers ilimitados, fullyParallel | `playwright.config.js` | ✅ Corregido: workers=2, fullyParallel=false |
| Vitest: threads paralelos excesivos | `vite.config.js` | ✅ Corregido: poolOptions.forks.maxForks=2, threads=false |

### Media prioridad
| Problema | Ubicación | Estado |
|----------|-----------|--------|
| Vite: watchers sin usePolling explícito | `vite.config.js` | ✅ Corregido: usePolling=false |
| Movimiento coches sin interpolación | ParkingMap, SellerLocationTracker | ✅ Corregido: useVehicleInterpolation |

### Baja prioridad
| Problema | Ubicación | Estado |
|----------|-----------|--------|
| 8 tests skipped (condicionales) | safe-mode, layout-map-create | Documentado en TESTS_SKIPPED.md |
| Resize timeouts | ParkingMap, SellerLocationTracker | Ya tenían clearTimeout en cleanup |

---

## 2. Optimizaciones aplicadas

### FASE 1 — Sobrecalentamiento Mac
- **playwright.config.js**: `workers: 2`, `fullyParallel: false`
- **vite.config.js (test)**: `pool: 'forks'`, `poolOptions.forks.maxForks: 2`, `threads: false`
- **package.json**: script `cleanup:tests` para matar procesos chrome-headless-shell y playwright
- **DemoFlowManager**: `stopDemoFlow()` para limpiar `tickTimer`

### FASE 2 — Procesos y subprocesos
- **vite.config.js**: `server.watch.usePolling: false` (evita polling innecesario)
- Playwright reutiliza servidor existente con `reuseExistingServer: !process.env.CI`

### FASE 3 — Mapbox (arquitectura Uber)
Las capas ya usan **GeoJSON source + CircleLayer** (no DOM markers):
- `StaticCarsLayer`: `map.getSource().setData(geojson)`
- `UserLocationLayer`: idem
- `WaitMeCarLayer`: idem
- `SellerLocationLayer`, `SelectedPositionLayer`: idem

Flujo actual: backend → React Query / Zustand → capas → `setData()`. No se recrea el mapa ni los markers DOM.

### FASE 4 — Movimiento coches tipo Uber
- **useVehicleInterpolation**: hook con `requestAnimationFrame`, `lerp(lat1, lat2, t)`
- Integrado en `ParkingMap` y `SellerLocationTracker` para `buyerLocForLayer`
- Duración interpolación: 500ms por defecto

---

## 3. Procesos antes / después

| Métrica | Antes (estimado) | Después |
|---------|------------------|---------|
| Playwright workers | undefined (CPU cores) | 2 |
| Playwright fullyParallel | true | false |
| Vitest maxForks | default | 2 |
| Vite watch polling | default | false |
| DemoFlowManager timer | Sin cleanup | stopDemoFlow() disponible |

**Nota:** Los valores exactos de 763 procesos / 4124 subprocesos dependen del entorno. Las optimizaciones reducen carga al limitar paralelismo y evitar polling.

---

## 4. Estado Mapbox optimizado

- Capas: GeoJSON + CircleLayer (sin DOM markers)
- Interpolación: activa para WaitMeCarLayer (comprador)
- Sin rerenders React innecesarios: actualización vía `setData` en el source

---

## 5. Arquitectura de coches aplicada

```
Backend/Realtime → useQuery(buyerLocations)
       ↓
rawBuyerLoc
       ↓
useVehicleInterpolation(rawBuyerLoc)  ← RAF + lerp
       ↓
buyerLocForLayer
       ↓
addWaitMeCarLayer(map, buyerLocForLayer, ...)
       ↓
map.getSource('waitme-car-source').setData(geojson)
```

---

## 6. Estado de tests

| Tipo | Cantidad | Notas |
|------|----------|-------|
| Safe Mode (suite condicional) | 6 | Requieren `VITE_SAFE_MODE=true` |
| Ubícate / __WAITME_MAP__ | 2 | Mapbox no expone en headless |
| **Total skipped** | 8 | Ver docs/TESTS_SKIPPED.md |

Ejecución completa: `npm run test:all`

---

## 7. Estado lint / typecheck / build

Ejecutar validación:
```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

---

## 8. Ubicación ZIP de auditoría

```
/audit/waitme-audit.zip
```

Contenido: src, tests, configs, scripts, docs, package.json. Excluye: node_modules, build, dist.

---

## Referencias

- `docs/WAITME_AGENT_CONTEXT.md`
- `docs/CURSOR_RULES_WAITME.md`
- `docs/SAFE_CHANGE_PROTOCOL.md`
- `docs/TESTS_SKIPPED.md`
