# WaitMe Automation Bridge

Backend puente: GitHub Webhook → OpenAI Agents SDK.

## Cómo arrancarlo

```bash
cd automation/bridge
npm install
cp .env.example .env
# Editar .env con valores reales
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3000) |
| `GITHUB_WEBHOOK_SECRET` | Secret del webhook de GitHub |
| `OPENAI_API_KEY` | API key de OpenAI (para Agents SDK) |
| `BRIDGE_URL` | URL pública del bridge |

## Conectar a GitHub Webhook

1. GitHub → Settings → Webhooks → Add webhook
2. Payload URL: `https://[tu-bridge-url]/webhook/github`
3. Content type: `application/json`
4. Secret: generar uno y ponerlo en `GITHUB_WEBHOOK_SECRET`
5. Eventos: push, pull_request (o "Just the push event")

## Conectar al SDK de OpenAI

- Añadir `OPENAI_API_KEY` en `.env`
- Implementar en `src/openaiAgent.js` la llamada al Agents SDK
- El webhook puede invocar `processWithOpenAI(context)` tras recibir push

## Usar con Cursor Hooks

Copiar `automation/cursor-hooks-example.json` a `.cursor/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "stop": [
      {
        "command": "npm run devcontext:update"
      }
    ]
  }
}
```

Para ping al bridge tras push:

```bash
curl -X POST "$BRIDGE_URL/webhook/github" -H "Content-Type: application/json" -d '{"repo":"valekjonathan/WaitMe","status":"updated"}'
```

## Desplegar en Render/Railway/Fly.io/VPS

- **Render:** `npm start`, env vars en dashboard
- **Railway:** `npm start`, env vars en Variables
- **Fly.io:** `fly launch`, `fly secrets set KEY=value`
- **VPS:** pm2 o systemd, `node src/server.js`

Necesario: URL público (HTTPS) para que GitHub pueda enviar webhooks.
