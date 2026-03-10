# Resumen Técnico Único — WaitMe

**Última actualización:** 2026-03-10 21:06

---

## Qué se cambió

- Login.jsx: botón "Entrar en modo test" solo en simulador iOS (VITE_IOS_DEV_BUILD=1)
- AuthContext: loginAsSimulatorTest() para bypass sin OAuth/passkey
- docs: AUTH_STATUS, DEV_STATUS, IOS_RUNTIME_STATUS

---

## Qué corrige

- Evita flujo passkey de Google en simulador (no fiable)
- Login alternativo en modo test para pruebas sin passkeys
