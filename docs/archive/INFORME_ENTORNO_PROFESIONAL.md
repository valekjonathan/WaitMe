# Informe — Entorno Profesional y Automatización

**Fecha:** 2025-03-06

---

## 1. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `vite.config.js` | Eliminado `hmr.host` hardcodeado (192.168.0.11); `host: true`, `port: 5173` |
| `capacitor.config.ts` | Añadido `server` condicional para live reload |
| `.vscode/settings.json` | formatOnSave, defaultFormatter, eslint validation |
| `.vscode/extensions.json` | Nuevo: extensiones recomendadas |
| `.lintstagedrc.json` | Añadido `prettier --write` antes de `eslint --fix` |
| `docs/FLUJO_DESARROLLO_IOS.md` | Instrucciones iPhone real con CAPACITOR_DEV_SERVER_URL |

---

## 2. Configuraciones nuevas

### Vite
- `server.host: true` — permite acceso desde red (iPhone, Simulator)
- `server.port: 5173`
- Eliminado `hmr.host` — evita EADDRNOTAVAIL cuando la IP cambia

### Capacitor
- `server.url`: `process.env.CAPACITOR_DEV_SERVER_URL || 'http://localhost:5173'`
- `server.cleartext: true`
- Solo cuando `CAPACITOR_USE_DEV_SERVER=true`

### VS Code
- `editor.formatOnSave: true`
- `editor.defaultFormatter: "esbenp.prettier-vscode"`
- `editor.codeActionsOnSave.source.fixAll.eslint: "explicit"`
- `eslint.validate`: javascript, javascriptreact, typescript, typescriptreact

### lint-staged
- `*.{js,jsx,ts,tsx}`: `["prettier --write", "eslint --fix"]`

---

## 3. Scripts añadidos

Ninguno nuevo. Los existentes cubren el flujo:

| Script | Uso |
|--------|-----|
| `dev` | Vite con `--host --port 5173` |
| `dev:ios` | Vite + Capacitor live reload |
| `ios:dev` | Alias de `dev:ios` |
| `ios:run:dev` | Solo `cap run` (cuando `dev` ya está en otra terminal) |

---

## 4. Herramientas instaladas

Ya estaban instaladas:
- **eslint** — linting
- **prettier** — formateo
- **husky** — hooks git (pre-commit, post-commit)
- **lint-staged** — ejecuta prettier + eslint en staged

Configuración actualizada para uso profesional.

---

## 5. Confirmación: mismo servidor Vite

| Cliente | Cómo accede |
|---------|-------------|
| **Web** | `http://localhost:5173` (o IP de la máquina) |
| **iOS Simulator** | `http://localhost:5173` (simulador comparte red con host) |
| **iPhone real** | `http://TU_IP:5173` (misma red; usar `CAPACITOR_DEV_SERVER_URL`) |

Todos usan el mismo servidor Vite cuando se ejecuta `npm run dev` o `npm run dev:ios`.

---

## Validación

```bash
# Web
npm run dev
# Abrir http://localhost:5173

# iOS Simulator (mismo servidor)
npm run dev:ios

# iPhone real (misma red)
CAPACITOR_DEV_SERVER_URL=http://192.168.x.x:5173 npm run dev:ios
```
