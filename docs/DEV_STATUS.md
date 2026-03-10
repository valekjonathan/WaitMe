# Estado Global del Proyecto — WaitMe

**Última actualización:** 2026-03-10 21:40

---

## Login simulador (evitar passkey)

- **Botón "Entrar en modo test"**: solo en simulador iOS (VITE_IOS_DEV_BUILD=1). Evita flujo passkey de Google.
- **Detección**: Capacitor iOS + VITE_IOS_DEV_BUILD=1 (ios:refresh). Nunca en producción.
- **Bypass**: loginAsSimulatorTest() → DEV_MOCK_USER. No afecta login Google real en iPhone físico.

---

## ios:refresh — build local forzada

- **unset** al inicio: CAP_LIVE_RELOAD, CAPACITOR_USE_DEV_SERVER, CAPACITOR_DEV_SERVER_URL
- **Limpieza**: si server.url aparece tras cap sync, node -e lo elimina
- **Verificación**: `[ios:refresh] runtime server url: NONE (build local OK)`
- **capacitor.config.json** en ios/App/App: sin server, sin url

---

## Estado simulador (captura 20:58)

- **Login** — app carga correctamente desde bundle local
- **Botón "Entrar en modo test"** visible — evita passkey de Google
- devcontext/latest-simulator.png
