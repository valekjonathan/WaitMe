# WaitMe Automation Bridge

Backend puente: GitHub Webhook → Context → OpenAI (futuro).

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Health check (status, timestamp, version) |
| POST | /github-webhook | Recibe push de GitHub, valida firma, lee contexto y guarda snapshot |
| POST | /ping | Recibe { repo, status, timestamp } para hooks |
| GET | /context/latest | Devuelve último contexto (docs, devcontext, commit) |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| PORT | Puerto (default: 3000) |
| GITHUB_WEBHOOK_SECRET | Secret del webhook de GitHub |
| GITHUB_TOKEN | Token para leer repo (rate limit mayor) |
| OPENAI_API_KEY | Para Agents SDK (futuro) |
| REPO_OWNER | Owner del repo (default: valekjonathan) |
| REPO_NAME | Nombre del repo (default: WaitMe) |
| BRIDGE_URL | URL pública del bridge (para hooks locales) |

## Cómo arrancar localmente

```bash
cd automation/bridge
npm install
cp .env.example .env
# Editar .env con valores reales
npm run dev
```

## Desplegar en Render

1. **Crear servicio desde repo:**
   - Render Dashboard → New → Web Service
   - Conectar repo WaitMe
   - Root Directory: `automation/bridge`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Variables de entorno:**

   | Key | Secret |
   |-----|--------|
   | PORT | (auto) |
   | GITHUB_WEBHOOK_SECRET | Generar con `openssl rand -hex 32` |
   | GITHUB_TOKEN | Personal Access Token (repo scope) |
   | GITHUB_TOKEN | (opcional) |
   | REPO_OWNER | valekjonathan |
   | REPO_NAME | WaitMe |

3. **Deploy** → Render asigna URL pública (ej: `https://waitme-bridge.onrender.com`)

4. **Configurar webhook en GitHub:**
   - Repo → Settings → Webhooks → Add webhook
   - Payload URL: `https://[tu-bridge-url]/github-webhook`
   - Content type: `application/json`
   - Secret: el mismo que GITHUB_WEBHOOK_SECRET
   - Eventos: Just the push event

## Flujo ChatGPT

1. Usuario hace push → GitHub envía webhook al bridge
2. Bridge lee docs/ y devcontext/ desde GitHub API
3. Guarda snapshot en `.cache/latest-context.json`
4. ChatGPT (o MCP) llama GET /context/latest para obtener contexto
5. (Futuro) OpenAI Agents SDK procesa el contexto y responde

## Conectar Cursor Hooks

Copiar `automation/cursor-hooks-example.json` a `.cursor/hooks.json`.

Tras push, `automation/on-change.sh` hace ping al bridge si `BRIDGE_URL` está definido.
