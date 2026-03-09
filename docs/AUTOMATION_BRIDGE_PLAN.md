# Plan Técnico — Bridge de Automatización WaitMe

**Objetivo:** Que el usuario solo hable con ChatGPT para gestionar el proyecto WaitMe.

---

## 1. Arquitectura completa

```
Usuario habla con ChatGPT
         ↓
   OpenAI Apps SDK / Agents SDK / MCP
         ↓
   Backend Bridge (Node.js, Render)
         ↓
   GitHub Webhook / API
         ↓
   GitHub (repo WaitMe)
         ↓
   Cursor + devcontext:update
         ↓
   git push → GitHub
```

---

## 2. Componentes

### Backend Bridge (automation/bridge/)
- **Endpoints:** /health, /github-webhook, /ping, /context/latest
- **Context Reader:** Lee docs/ y devcontext/ desde GitHub API
- **Cache:** .cache/latest-context.json tras cada push
- **Deploy:** Render, Railway, Fly.io

### GitHub Webhook
- **URL:** https://[bridge-url]/github-webhook
- **Eventos:** push (main)
- **Secret:** GITHUB_WEBHOOK_SECRET

### devcontext + docs
- **Fuente de verdad:** docs/, devcontext/
- **Regeneración:** npm run devcontext:update
- **Ping:** Tras push, opcional a BRIDGE_URL/ping

---

## 3. Estructura del bridge

```
automation/bridge/
├── package.json
├── .env.example
├── render.yaml
├── README.md
├── src/
│   ├── server.js
│   ├── githubWebhook.js
│   ├── openaiAgent.js
│   ├── routes/
│   │   ├── health.js
│   │   ├── github.js
│   │   └── context.js
│   └── lib/
│       ├── githubClient.js
│       ├── contextReader.js
│       └── logger.js
└── .cache/
    └── latest-context.json
```

---

## 4. Variables de entorno

| Variable | Uso |
|----------|-----|
| PORT | Puerto del servidor |
| GITHUB_WEBHOOK_SECRET | Validar firma del webhook |
| GITHUB_TOKEN | Leer repo vía API (rate limit) |
| OPENAI_API_KEY | Agents SDK (futuro) |
| REPO_OWNER | valekjonathan |
| REPO_NAME | WaitMe |

---

## 5. Orden de implementación

1. ✅ Bridge con endpoints
2. ✅ Context reader (GitHub API)
3. ✅ render.yaml
4. ⏳ Desplegar en Render
5. ⏳ Configurar webhook
6. ⏳ Conectar ChatGPT (Custom GPT / MCP)
