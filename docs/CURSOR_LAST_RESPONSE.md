# Cursor Last Response

**Última actualización:** 2026-03-09 18:44

---

## Prompt recibido

Cerrar problema real: app muestra "Error cargando WaitMe", Cursor preview ERR_CONNECTION_REFUSED. Forzar build local empaquetada en ios:refresh.

---

## Resumen exacto de lo hecho

- **ios-refresh.sh**: unset explícito de CAP_LIVE_RELOAD, CAPACITOR_USE_DEV_SERVER, CAPACITOR_DEV_SERVER_URL al inicio
- **Verificación**: tras cap sync, imprime `[ios:refresh] runtime server url: NONE` o WARNING si hay server.url
- **capacitor.config.ts**: server.url solo cuando useLiveReload (CAP_LIVE_RELOAD o CAPACITOR_USE_DEV_SERVER = true)

---

## Causa del fallo

- ios-refresh.sh NO hacía unset de las env vars
- Si el shell tenía CAPACITOR_USE_DEV_SERVER=true (p.ej. de ios:auto o sesión previa), cap sync generaba config con server.url
- La app instalada intentaba cargar desde localhost → ERR_CONNECTION_REFUSED

---

## Corrección aplicada

- Líneas 9-16 de ios-refresh.sh: unset + export vacío de las 3 vars
- Líneas 60-71: verificación de capacitor.config.json tras sync
