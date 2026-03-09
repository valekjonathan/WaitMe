# Resumen Técnico Único — WaitMe

**Última actualización:** 2026-03-09

---

## Qué se cambió

- Protocolo "contexto vivo": docs de estado, ZIP, screenshot, regla Cursor
- docs/MAP_STATUS.md creado
- docs ampliados con formato obligatorio
- Regla live-context-protocol.mdc con alwaysApply

---

## Qué se comprobó de verdad

- lint, typecheck, build: OK
- ios:refresh: OK (2026-03-09 15:12:37)
- ZIP generado
- Screenshot: depende de simulador booted

---

## Qué sigue roto

- Auth: pendiente validación manual Login Google → Home en simulador
- user null: pendiente confirmar que fallback session.user evita null

---

## Qué ya está confirmado como arreglado

- Flujo OAuth limpio (sin eventos manuales)
- Fallback session.user si ensureUserInDb falla
- ios:refresh funciona
- Scripts correctos
- Docs de estado creados

---

## Qué build/screenshot/zip corresponde al último estado real

- **ZIP:** devcontext/waitme-live-context.zip (~2 MB) — en GitHub
- **Screenshot:** devcontext/latest-simulator.png — en GitHub
- **Tree:** devcontext/project-tree.txt — en GitHub
- **Build:** VITE_IOS_DEV_BUILD=1, ios:refresh

---

## Qué debe revisar ChatGPT a continuación

1. Leer docs/LIVE_CONTEXT_SUMMARY.md (este archivo)
2. Leer docs/AUTH_STATUS.md para flujo auth
3. Leer docs/DEV_STATUS.md para estado global
4. Si hay ZIP: tmp/waitme-live-context.zip
5. Validar Login Google en simulador y actualizar docs con resultado real
