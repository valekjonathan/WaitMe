# Auditoría rendimiento dev — WaitMe

**Fecha:** 2026-03-07

---

## 1. Procesos que más consumen

| Proceso | Rol | Consumo |
|---------|-----|---------|
| Cursor Helper (Renderer) | IDE, extensiones | Alto |
| SimMetalHost / Simulator | iOS Simulator | Alto (GPU) |
| WebKit | WKWebView en Simulator | Alto |
| Vite | HMR, dev server | Medio |
| Mapbox GL | WebGL, tiles | Alto |

---

## 2. Causas del calentamiento

1. **Simulator + WebGL:** Mapbox usa GPU; Simulator emula GPU.
2. **Vite HMR:** File watchers, recompilación.
3. **RENDER_LOG:** ~11 archivos con console.log en cada render (DEV).
4. **Múltiples mapas:** Home tiene MapboxMap; si hay overlays pesados, más trabajo.
5. **Cursor:** Extensiones, indexación, agentes en segundo plano.

---

## 3. Mejoras aplicables

| Acción | Impacto | Riesgo |
|--------|---------|--------|
| Reducir RENDER_LOG | Bajo consumo CPU | Bajo |
| Throttle logs en dev | Menos I/O | Bajo |
| Cerrar Simulator cuando no se usa | Alto | Ninguno |
| Usar web en vez de Simulator para iterar | Alto | Ninguno |
| Evitar múltiples instancias de Vite | Medio | Ninguno |

---

## 4. Cambios de código

- **RENDER_LOG:** Envolver en `import.meta.env.DEV && someThrottle` o reducir frecuencia.
- **Mapbox:** No hay optimización obvia sin cambiar arquitectura.
- **Vite:** `server.watch` ya optimizado; no tocar.

---

## 5. Recomendaciones

1. Cerrar Simulator cuando trabajes solo en web.
2. Usar `npm run dev` sin abrir Simulator para cambios rápidos.
3. Reducir logs en componentes que renderizan mucho (MapboxMap, AuthContext, Layout).
