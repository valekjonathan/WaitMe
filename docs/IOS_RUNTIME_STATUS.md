# Estado iOS Runtime — WaitMe

**Última actualización:** 2026-03-10 20:27

---

## Login simulador (evitar passkey)

- Botón "Entrar en modo test" visible solo en build VITE_IOS_DEV_BUILD=1 (ios:refresh).
- No afecta login Google real en iPhone físico ni producción.

---

## runtime server url

- **NONE** — ios:refresh fuerza build local empaquetada
- Verificación: `[ios:refresh] runtime server url: NONE (build local OK)`
- Si cap sync inyecta server, node -e lo elimina antes de cap run

---

## último ios:refresh (2026-03-09 20:58)

- Exit: 0
- runtime server url: NONE (build local OK)
- Estado simulador: Login con botón "Entrar en modo test"
- Screenshot: devcontext/latest-simulator.png
