# Resumen Técnico Único — WaitMe

**Última actualización:** 2026-03-09 18:35

---

## Qué se cambió

- Marcador **WAITME RUNTIME CHECK — BUILD: HH:MM:SS** en App.jsx (parte inferior) y ErrorBoundary
- Vite define: __SHOW_BUILD_MARKER__, __BUILD_TIMESTAMP__
- Solo visible con VITE_IOS_DEV_BUILD=1 (ios:refresh)

---

## Verificación ios-refresh.sh

- terminate → uninstall → rm -rf dist → build → cap sync → cap run
- Garantiza reinstalación completa

---

## Estado real reportado

- **Inconsistente:** Cargando / Error / Login según ejecución
- **No afirmar** crash corregido ni Login estable sin verificar

---

## Rutas evidencia

- devcontext/latest-simulator.png
- devcontext/latest-auth-log.txt
- devcontext/latest-ios-refresh-log.txt
