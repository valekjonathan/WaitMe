# Flujo ChatGPT-Only — WaitMe

**Objetivo:** Que el usuario solo hable con ChatGPT para gestionar WaitMe, con GitHub como fuente viva de contexto.

---

## Qué ya queda automatizado

| Componente | Estado |
|------------|--------|
| devcontext + docs | `npm run devcontext:update` regenera ZIP, screenshots, logs, docs |
| Git push | Tras devcontext, commit + push a main |
| Bridge local | `automation/bridge` con Express, endpoints listos |
| Ping al bridge | Si `BRIDGE_URL` existe, devcontext hace ping tras push |
| Webhook flow | Bridge recibe POST /github-webhook, lee contexto desde GitHub API |
| Context API | GET /context/latest devuelve docs, auth, ios, artifact_paths |

---

## Qué falta para que ChatGPT pueda leer el contexto sin pegar nada

1. **Desplegar el bridge en Render** (o Railway/Fly.io)
   - URL público HTTPS
   - Variables: GITHUB_WEBHOOK_SECRET, GITHUB_TOKEN, REPO_OWNER, REPO_NAME

2. **Configurar webhook en GitHub**
   - Payload URL: `https://[bridge-url]/github-webhook`
   - Secret = GITHUB_WEBHOOK_SECRET
   - Eventos: push

3. **Conectar ChatGPT al bridge**
   - Opción A: Custom GPT que llama GET /context/latest y usa el JSON como contexto
   - Opción B: MCP server que expone el bridge como herramienta
   - Opción C: Apps SDK que registra el bridge como fuente de datos

4. **OPENAI_API_KEY** (cuando se implemente el agente)
   - Para que el bridge procese con Agents SDK y responda

---

## Qué parte sigue siendo manual (una sola vez)

1. Crear cuenta en Render
2. Conectar repo WaitMe
3. Configurar variables de entorno
4. Crear webhook en GitHub
5. (Opcional) Configurar Custom GPT / MCP en ChatGPT con la URL del bridge

---

## Cómo desplegar el bridge en Render

1. Render Dashboard → New → Web Service
2. Conectar repo (valekjonathan/WaitMe)
3. Root Directory: `automation/bridge`
4. Build: `npm install`
5. Start: `npm start`
6. Env vars:
   - GITHUB_WEBHOOK_SECRET: `openssl rand -hex 32`
   - GITHUB_TOKEN: Personal Access Token (repo scope)
   - REPO_OWNER: valekjonathan
   - REPO_NAME: WaitMe
7. Deploy → copiar URL (ej: https://waitme-bridge.onrender.com)

---

## Cómo configurar el webhook de GitHub

1. Repo → Settings → Webhooks → Add webhook
2. Payload URL: `https://[bridge-url]/github-webhook`
3. Content type: application/json
4. Secret: el mismo que GITHUB_WEBHOOK_SECRET
5. Eventos: Just the push event
6. Add webhook

---

## Cómo evolucionar a Apps SDK / MCP

1. **MCP:** Crear servidor MCP en el bridge que exponga `get_waitme_context` como herramienta
2. **ChatGPT:** Configurar MCP server URL en ChatGPT
3. **Apps SDK:** Registrar el bridge como app que proporciona contexto
4. **Agents SDK:** Implementar `processWithOpenAI(context)` en openaiAgent.js

---

## Flujo completo (cuando esté desplegado)

```
Usuario edita en Cursor
    ↓
npm run devcontext:update (o on-change.sh)
    ↓
git push origin main
    ↓
GitHub webhook → Bridge
    ↓
Bridge lee docs/ y devcontext/ desde GitHub API
    ↓
Guarda en .cache/latest-context.json
    ↓
Usuario pregunta a ChatGPT
    ↓
ChatGPT llama GET /context/latest (o MCP)
    ↓
ChatGPT responde con contexto vivo del repo
```
