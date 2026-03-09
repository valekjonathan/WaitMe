# Estado iOS Runtime — WaitMe

**Última actualización:** 2026-03-09

---

## Formato fijo

- **ios:refresh último resultado** — exit, fecha, target, pasos
- **Build instalada** — vars, dist, sync
- **Watcher activo sí/no** — npm run start
- **Live reload iPhone sí/no** — ios:auto, requisitos

---

## ios:refresh último resultado

- **Exit:** 0 (OK)
- **Fecha:** 2026-03-09 15:12:37
- **Target:** 277875BB-CD09-46B9-B5AC-D5D4EE890116
- **Pasos:** terminated → uninstalled → built → synced → launched

---

## Build instalada

- VITE_IOS_DEV_BUILD=1 (marca WAITME BUILD TEST visible)
- dist/ generado por vite build
- cap sync ios ejecutado

---

## Watcher activo sí/no

- **Sí** cuando se ejecuta `npm run start`
- chokidar detecta cambios en src/ → dispara ios:refresh
- Si no se ejecuta start, watcher no corre

---

## Live reload iPhone sí/no

- **Sí** con `npm run ios:auto`
- Requiere: Mac encendido, misma WiFi, permiso Red local
- No funciona con Mac apagado
