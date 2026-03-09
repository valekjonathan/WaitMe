# Resumen Técnico Único — WaitMe

**Última actualización:** 2026-03-09 20:29

---

## Qué se cambió

- ios-refresh.sh: unset + export vacío de CAP_* vars al inicio
- Eliminación forzada de server en capacitor.config.json si cap sync lo inyecta
- Verificación: `[ios:refresh] runtime server url: NONE (build local OK)`

---

## Qué corrige

- ERR_CONNECTION_REFUSED resuelto: app usa bundle local empaquetada
- Simulador muestra Login correctamente
