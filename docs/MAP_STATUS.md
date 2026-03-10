# Estado Mapa — WaitMe

**Última actualización:** 2026-03-10 18:08

---

## Formato fijo

- **mapa carga sí/no** — si MapboxMap renderiza
- **token ok sí/no** — VITE_MAPBOX_TOKEN
- **createMap success sí/no** — MapInit
- **último error real** — si hubo fallo
- **Ubícate funciona sí/no** — botón/acción
- **user location visible sí/no** — capa de ubicación

---

## mapa carga sí/no

- **Sí** en código — MapboxMap con createMap
- Depende de token y que Home se renderice (auth)

---

## token ok sí/no

- **Pendiente validar** — VITE_MAPBOX_TOKEN en .env
- MapInit usa import.meta.env.VITE_MAPBOX_TOKEN

---

## createMap success sí/no

- **Pendiente validar** — MapInit.js createMap
- Loader "Map loading..." hasta mapReady

---

## último error real

- Ninguno registrado

---

## Ubícate funciona sí/no

- **Pendiente validar** — botón en HomeActions

---

## user location visible sí/no

- **Pendiente validar** — UserLocationLayer en MapboxMap
