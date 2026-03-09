# Cursor Last Response

**Última actualización:** 2026-03-09 20:29

---

## Prompt recibido

Cerrar ERR_CONNECTION_REFUSED en simulador. Forzar que la app use SOLO el bundle local empaquetado.

---

## Resumen exacto de lo hecho

- **ios-refresh.sh**: unset + export vacío de CAP_LIVE_RELOAD, CAPACITOR_USE_DEV_SERVER, CAPACITOR_DEV_SERVER_URL al inicio
- **Limpieza server.url**: si cap sync inyecta server en ios/App/App/capacitor.config.json, node -e lo elimina
- **Verificación**: imprime `[ios:refresh] runtime server url: NONE (build local OK)` o WARNING
- **capacitor.config.ts**: server.url solo cuando useLiveReload (CAP_LIVE_RELOAD o CAPACITOR_USE_DEV_SERVER = true)

---

## Causa del fallo

- Shell con CAPACITOR_USE_DEV_SERVER=true (p.ej. de ios:auto o sesión previa) → cap sync generaba config con server.url
- La app instalada intentaba cargar desde localhost → ERR_CONNECTION_REFUSED

---

## Corrección aplicada

- Líneas 9-16: unset + export vacío de las 3 vars
- Líneas 55-76: verificación y eliminación de server en capacitor.config.json tras cap sync
- node -e recibe $CAP_CONFIG como process.argv[1] para eliminar server correctamente
