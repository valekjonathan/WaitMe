# Resumen Técnico Único — WaitMe

**Última actualización:** 2026-03-09 18:44

---

## Qué se cambió

- ios-refresh.sh: unset CAP_LIVE_RELOAD, CAPACITOR_USE_DEV_SERVER, CAPACITOR_DEV_SERVER_URL
- Verificación server.url tras cap sync

---

## Qué corrige

- App ya no intenta cargar desde localhost en simulador
- Build local empaquetada siempre en ios:refresh
