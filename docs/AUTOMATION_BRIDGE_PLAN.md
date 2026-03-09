# Plan Técnico — Bridge de Automatización WaitMe

**Objetivo:** Que el usuario solo hable con ChatGPT para gestionar el proyecto WaitMe.

---

## 1. Arquitectura completa

```
Usuario habla con ChatGPT
         ↓
   OpenAI Apps SDK / Agents SDK
         ↓
   Backend Bridge (Node.js)
         ↓
   GitHub Webhook / API
         ↓
   GitHub (repo WaitMe)
         ↓
   Cursor Hooks (opcional, local)
         ↓
   Cursor IDE (edición local)
         ↓
   git push → GitHub
```

---

## 2. Componentes

### Cursor Hooks
- **Qué hace:** Ejecuta comandos locales tras eventos de Cursor (pre-commit, post-save, etc.).
- **Ejemplo:** Tras cambio relevante → `npm run devcontext:update` → `git push`.
- **Ubicación:** Local (máquina del desarrollador).
- **Límite:** Solo corre cuando Cursor está abierto y el usuario hace cambios.

### GitHub Webhook
- **Qué hace:** Notifica a un URL externo cuando hay push/PR en el repo.
- **Payload:** repo, branch, commit, diff, files changed.
- **Ubicación:** Configuración en GitHub → Settings → Webhooks.
- **Límite:** Requiere URL público (backend bridge en cloud).

### Backend Bridge
- **Qué hace:** Recibe webhooks de GitHub, procesa eventos, se comunica con OpenAI Agents SDK.
- **Funciones:** Recibir push → extraer contexto → notificar a agente OpenAI → ejecutar acciones (crear issues, comentar, etc.).
- **Ubicación:** Cloud (Render, Railway, Fly.io, VPS).
- **Límite:** Necesita hosting y secrets (API keys).

### OpenAI Agents SDK
- **Qué hace:** Agentes que reciben contexto (repo, docs, estado) y pueden tomar decisiones.
- **Ejemplo:** "El usuario pidió X → el agente lee docs/DEV_STATUS.md → responde con siguiente paso".
- **Ubicación:** Cloud (OpenAI).
- **Límite:** Coste por uso, rate limits.

### Apps SDK / MCP (Model Context Protocol)
- **Qué hace:** Expone herramientas y contexto a ChatGPT/Claude.
- **Ejemplo:** MCP server que lee `devcontext/waitme-live-context.zip` y lo pasa a ChatGPT.
- **Ubicación:** Puede ser local (Cursor MCP) o cloud.
- **Límite:** Configuración y mantenimiento.

---

## 3. Qué queda local

- Cursor IDE
- Código fuente (git clone)
- Cursor Hooks (scripts que corren en pre-commit, etc.)
- `npm run devcontext:update` (regenera ZIP, docs, push)

---

## 4. Qué quedaría en cloud

- Backend Bridge (Node.js en Render/Railway/Fly.io)
- GitHub Webhook target URL
- OpenAI API (Agents SDK, ChatGPT)
- Posible MCP server si se usa con ChatGPT

---

## 5. Límites reales

| Límite | Descripción |
|--------|-------------|
| Cursor no ejecuta código remoto | Los cambios se hacen en la máquina local. ChatGPT no edita archivos directamente. |
| Webhook requiere URL público | El bridge debe estar en un servidor accesible desde internet. |
| OpenAI no tiene acceso al repo | ChatGPT no lee GitHub directamente. Necesita bridge que le pase contexto. |
| Coste OpenAI | Cada llamada a la API tiene coste. |
| Latencia | Usuario → ChatGPT → Bridge → GitHub → Cursor: varios segundos. |

---

## 6. Qué falta para que funcione totalmente

1. **Backend bridge desplegado** con URL público.
2. **Webhook de GitHub** apuntando al bridge.
3. **OpenAI Agents SDK** o integración con ChatGPT Apps.
4. **Flujo de contexto:** Bridge recibe push → descarga ZIP/docs de GitHub → los pasa a OpenAI.
5. **Respuesta al usuario:** ChatGPT recibe contexto actualizado y puede responder con conocimiento del proyecto.

---

## 7. Riesgos

- **Seguridad:** API keys, webhook secrets. No exponer en cliente.
- **Coste:** Uso de OpenAI puede crecer.
- **Complejidad:** Más componentes = más puntos de fallo.
- **Dependencia:** Si el bridge cae, el flujo se rompe.

---

## 8. Coste aproximado

| Componente | Coste |
|------------|-------|
| Render/Railway free tier | $0 |
| OpenAI API (gpt-4) | ~$0.01–0.03 por 1K tokens |
| GitHub | $0 (público) |
| **Estimado mensual** | $5–50 según uso |

---

## 9. Orden correcto de implementación

1. **Fase 1:** devcontext + docs + GitHub (ya hecho).
2. **Fase 2:** GitHub webhook configurado (solo config, sin backend).
3. **Fase 3:** Backend bridge mínimo (health, recibir webhook, log).
4. **Fase 4:** Integración OpenAI Agents SDK en el bridge.
5. **Fase 5:** ChatGPT App o MCP que consume el bridge.
6. **Fase 6:** Flujo completo: usuario habla → ChatGPT tiene contexto → responde.
