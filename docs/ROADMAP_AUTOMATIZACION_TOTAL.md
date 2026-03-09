# Roadmap — Automatización Total WaitMe

**Objetivo:** Usuario solo habla con ChatGPT para gestionar WaitMe.

---

## Fase 1: devcontext + docs + GitHub

**Estado:** ✅ Hecho

- `npm run devcontext:update` regenera ZIP, screenshots, logs, docs, commit+push
- docs/ y devcontext/ siempre actualizados en GitHub
- Regla Cursor: tras cambio relevante → `npm run devcontext:update`

---

## Fase 2: Backend Bridge

**Estado:** ✅ Hecho

- automation/bridge/ con Express
- GET /health, POST /github-webhook, POST /ping, GET /context/latest
- contextReader lee docs/ y devcontext/ desde GitHub API
- openaiAgent.js esqueleto para Agents SDK / MCP

---

## Fase 3: Desplegar en Render

**Estado:** Listo para ejecutar

- render.yaml en repo root
- rootDir: automation/bridge
- Variables documentadas en .env.example
- README con pasos exactos

**Acción:** Crear Web Service en Render, conectar repo, configurar env vars

---

## Fase 4: GitHub Webhook

**Estado:** Pendiente (tras deploy)

- GitHub → Settings → Webhooks → Add webhook
- URL: https://[bridge-url]/github-webhook
- Secret: GITHUB_WEBHOOK_SECRET
- Eventos: push

---

## Fase 5: Conectar ChatGPT

**Estado:** Pendiente

- Opción A: Custom GPT que llama GET /context/latest
- Opción B: MCP server en el bridge
- Opción C: Apps SDK

---

## Fase 6: Flujo completo

**Estado:** Pendiente

- Usuario pregunta a ChatGPT
- ChatGPT tiene contexto vivo del repo
- Responde con estado real (auth, ios, home, mapa)
