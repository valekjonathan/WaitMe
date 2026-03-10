# WaitMe — Local Automation Operating Model

Modelo operativo del sistema de automatización local.

---

## 1. QUÉ ES CADA MODO

### Simulator mode
- **Para:** Desarrollo UI, iteración visual, pruebas sin dispositivo físico
- **Qué hace:** Dev server, live reload, auto-login dev user, simulador iOS
- **No requiere:** Google login, cable, iPhone físico

### iPhone mode
- **Para:** Validación real, Google login, TestFlight, producción
- **Qué hace:** Build producción, Xcode, bundle local
- **No usa:** localhost, 192.168.x.x, dev auth

### Launcher
- **Para:** Ejecutar comandos sin escribir en terminal
- **Qué hace:** Wrapper Node que invoca el supervisor

---

## 2. QUÉ SIGNIFICAN LOS ARCHIVOS DE ESTADO

| Archivo | Contenido |
|---------|-----------|
| `devcontext/LIVE_PROJECT_STATE.json` | Estado actual: mode, auth, dev_server, bridge, snapshot, git |
| `devcontext/LAST_ERROR_SUMMARY.md` | Último error: timestamp, comando, explicación |
| `devcontext/CURSOR_LAST_RESPONSE.md` | Última respuesta de Cursor (actualizado por Cursor o reglas) |
| `tmp/waitme_project_snapshot.zip` | Snapshot del proyecto para exportar |

---

## 3. QUÉ ES EL SNAPSHOT

- **Contenido:** src, docs, scripts, devcontext, configs (sin node_modules, .env, dist)
- **Uso:** Enviar contexto a ChatGPT o revisión externa
- **Cuándo se genera:** Solo con `npm run waitme:snapshot`

---

## 4. QUÉ NO SE PUEDE AUTOMATIZAR COMPLETAMENTE

**ChatGPT no puede leer archivos locales del Mac directamente.**

A menos que el repo exporte artefactos actualizados y el usuario los proporcione al chat.

**Workaround práctico:**
- `LIVE_PROJECT_STATE.json` siempre fresco
- `tmp/waitme_project_snapshot.zip` siempre disponible
- `CURSOR_LAST_RESPONSE.md` con último resumen

El usuario puede adjuntar el ZIP o pegar el JSON en el chat para dar contexto.

---

## 5. ACCIÓN ÚNICA EN USO DIARIO

**Para desarrollo visual:** `npm run waitme:simulator`

**Para validar en iPhone:** `npm run waitme:iphone`

**Para ver estado:** `npm run waitme:state`

**Para exportar contexto:** `npm run waitme:snapshot`

**Para parar todo:** `npm run waitme:stop`

