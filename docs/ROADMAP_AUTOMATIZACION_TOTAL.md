# Roadmap — Automatización Total WaitMe

**Objetivo:** Usuario solo habla con ChatGPT para gestionar WaitMe.

---

## Fase 1: devcontext + docs + GitHub

**Estado:** ✅ Hecho

- `npm run devcontext:update` regenera ZIP, screenshots, logs, docs, commit+push.
- docs/ y devcontext/ siempre actualizados en GitHub.
- Regla Cursor: tras cambio relevante → `npm run devcontext:update`.

**Entregables:**
- devcontext/waitme-live-context.zip
- docs/CURSOR_LAST_RESPONSE.md, DEV_STATUS.md, AUTH_STATUS.md, etc.
- GitHub como fuente de verdad.

---

## Fase 2: GitHub Webhook

**Estado:** Pendiente

- Crear webhook en GitHub → Settings → Webhooks.
- URL: `https://[bridge-url]/webhook/github`.
- Eventos: push, pull_request.
- Secret para verificar firma.

**Entregables:**
- Webhook configurado (URL placeholder hasta tener bridge).
- Documentación en automation/bridge/README.md.

---

## Fase 3: Backend Bridge

**Estado:** Esqueleto creado

- Servidor Node.js que recibe webhooks.
- Ruta `/health` para healthcheck.
- Ruta `/webhook/github` para eventos de GitHub.
- Validación de firma HMAC.
- Log de eventos recibidos.

**Entregables:**
- automation/bridge/ con server.js, rutas, README.
- Variables de entorno documentadas.
- Instrucciones para desplegar en Render/Railway/Fly.io.

---

## Fase 4: Agents SDK / Apps SDK

**Estado:** Pendiente

- Integrar OpenAI Agents SDK en el bridge.
- Al recibir webhook: descargar ZIP/docs de GitHub, pasarlos como contexto.
- Agente que puede responder preguntas sobre el proyecto.
- Opcional: MCP server para Cursor/ChatGPT.

**Entregables:**
- src/openaiAgent.js con lógica de agente.
- API key de OpenAI configurada.
- Prueba: "¿Cuál es el estado del login iOS?" → respuesta con contexto real.

---

## Fase 5: Flujo donde el usuario solo habla con ChatGPT

**Estado:** Pendiente

- ChatGPT App o integración que usa el bridge.
- Usuario: "¿Qué falta para cerrar el login?"
- ChatGPT: lee docs/AUTH_STATUS.md, devcontext, responde con estado real.
- Opcional: ChatGPT sugiere cambios → usuario los aplica en Cursor → push → webhook → ChatGPT actualizado.

**Entregables:**
- Flujo end-to-end documentado.
- Usuario puede preguntar y recibir respuestas con contexto vivo del repo.
