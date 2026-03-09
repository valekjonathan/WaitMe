# Estado Global del Proyecto — WaitMe

**Última actualización:** 2026-03-09 20:29

---

## ios:refresh — build local forzada

- **unset** al inicio: CAP_LIVE_RELOAD, CAPACITOR_USE_DEV_SERVER, CAPACITOR_DEV_SERVER_URL
- **Limpieza**: si server.url aparece tras cap sync, node -e lo elimina
- **Verificación**: `[ios:refresh] runtime server url: NONE (build local OK)`
- **capacitor.config.json** en ios/App/App: sin server, sin url

---

## Estado simulador (captura 20:28)

- **Login** — app carga correctamente desde bundle local
- devcontext/latest-simulator.png
