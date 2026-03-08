# Auditoría Rendimiento Dev — WaitMe (Final)

**Fecha:** 2026-03-07

---

## 1. Procesos que consumen recursos

| Proceso | Rol | Consumo |
|---------|-----|---------|
| Cursor Helper | IDE, extensiones | Alto |
| SimMetalHost / Simulator | iOS Simulator, emulación GPU | Alto |
| WebKit | WKWebView en Simulator | Alto |
| Vite | HMR, dev server | Medio |
| Mapbox GL | WebGL, tiles | Alto |

---

## 2. Causas del calentamiento del Mac

1. **Simulator + WebGL:** Mapbox usa GPU; Simulator emula GPU (Metal).
2. **Vite HMR:** File watchers, recompilación en cada cambio.
3. **RENDER_LOG:** Varios componentes con console.log en cada render (solo DEV).
4. **Mapbox:** Tiles, estilos, capas GeoJSON.
5. **Cursor:** Extensiones, indexación, agentes.

---

## 3. Mejoras aplicables (sin romper)

| Acción | Impacto | Riesgo |
|--------|---------|--------|
| Reducir RENDER_LOG o throttlear | Menos I/O | Bajo |
| Cerrar Simulator cuando no se usa | Alto | Ninguno |
| Usar web (npm run dev) en vez de Simulator para iterar | Alto | Ninguno |
| Evitar múltiples instancias de Vite | Medio | Ninguno |

---

## 4. Estado actual del código

- **RENDER_LOG:** Condicionado a `import.meta.env.DEV`; no se ejecuta en build.
- **Mapbox:** Una sola instancia en Home; capas GeoJSON (no DOM markers pesados).
- **Watchers:** Un solo locationEngine; MapboxMap no llama watchPosition si recibe locationFromEngine.
- **Vite:** Config por defecto; no hay watchers redundantes.

---

## 5. Conclusión

No hay optimizaciones críticas pendientes. El calentamiento es inherente a Simulator + WebGL + Vite. Recomendación: cerrar Simulator cuando se trabaje solo en web; usar throttling de logs si molesta.
