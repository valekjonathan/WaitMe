# Cursor Last Response

**Última actualización:** 2026-03-09 20:59

---

## Prompt recibido

Evitar passkey de Google en simulador iOS. Añadir login alternativo sin passkeys.

---

## Resumen exacto de lo hecho

- **Login.jsx**: botón "Entrar en modo test" visible solo cuando isSimulatorDevBuild() (Capacitor iOS + VITE_IOS_DEV_BUILD=1)
- **AuthContext**: loginAsSimulatorTest() → setUser(DEV_MOCK_USER), setProfile(DEV_MOCK_PROFILE), isAuthenticated true
- **Detección**: Capacitor.isNativePlatform() && platform === 'ios' && (VITE_IOS_DEV_BUILD=1 || VITE_IOS_SIMULATOR=true)
- Login Google real intacto para iPhone físico y producción

---

## Opción elegida

- **A) Botón "Entrar en modo test"** — explícito, profesional, reversible. Solo visible en simulador.

---

## Archivos modificados

- src/pages/Login.jsx
- src/lib/AuthContext.jsx
- docs/AUTH_STATUS.md, docs/DEV_STATUS.md, docs/IOS_RUNTIME_STATUS.md, docs/LIVE_CONTEXT_SUMMARY.md, docs/CURSOR_LAST_RESPONSE.md
