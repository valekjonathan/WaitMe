# Auditoría Rendimiento Dev — WaitMe

**Fecha:** 2026-03-07

---

## 1. Fuentes de carga

- **Vite HMR** — dev server
- **Mapbox GL** — WebGL, tiles
- **Simulator** — WebKit, SimMetalHost
- **locationEngine** — 1 watcher (corregido)

---

## 2. Mejoras aplicadas

- Un solo watcher GPS (locationEngine)
- firstPreciseReceived evita race
- RENDER_LOG removidos de MapboxMap
- suppressInternalWatcher evita watcher duplicado

---

## 3. Recomendaciones

- Reducir re-renders en Home (memo, useCallback)
- Throttle en onMapMove/onMapEnd si hay lag
- Evitar logs en producción
