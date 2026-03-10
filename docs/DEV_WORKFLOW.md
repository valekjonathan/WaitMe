# WaitMe — Professional Development Workflow

Workflow de desarrollo. Tres modos oficiales. Sin escribir comandos: usar Tasks o NPM Scripts.

---

## CÓMO EJECUTAR (SIN TERMINAL)

**Cursor / VS Code:**
- `Cmd+Shift+P` → "Tasks: Run Task" → **WaitMe: VISUAL MODE** | **WaitMe: REAL DEVICE MODE** | **WaitMe: STOP**
- O panel NPM Scripts → clic ▶ en `waitme:visual`, `waitme:iphone`, `waitme:stop`

---

## 1. VISUAL MODE (desarrollo diario)

**Objetivo:** Simulador + iPhone físico, misma app, live reload.

**Ejecutar:** Tasks → WaitMe: VISUAL MODE, o `npm run waitme:visual`

**Qué hace:**
- Arranca Vite dev server (puerto 5173)
- Configura server.url con IP de red
- Abre selector: elige simulador O iPhone físico
- Ambos usan la misma app con live reload
- **Auto-login:** DEV_MOCK_USER
- Actualiza LIVE_PROJECT_STATE.json a "visual-mode"

**Requisito:** Mac e iPhone en la misma red WiFi.

---

## 2. REAL DEVICE MODE (pruebas reales)

**Objetivo:** Google login real, build de producción, sin localhost.

**Ejecutar:** Tasks → WaitMe: REAL DEVICE MODE, o `npm run waitme:iphone`

**Qué hace:**
- Build de producción (vite build)
- Sync Capacitor (bundle local, sin server.url)
- Abre Xcode
- En Xcode: seleccionar iPhone físico y Run

**Requisitos:** Build de producción → AuthContext usa flujo OAuth real.

---

## 3. PROJECT SNAPSHOT (para ChatGPT)

**Objetivo:** Exportar contexto completo para revisión sin pasos manuales.

```bash
npm run project:snapshot
```

**Output:** `tmp/waitme_project_snapshot.zip`

**Contenido:**
- src/
- docs/
- devcontext/
- scripts/
- automation/
- package.json
- capacitor.config.ts
- vite.config.js
- tsconfig.json
- ios/App/App/capacitor.config.json
- tmp/env-structure.json (solo keys, sin secrets)

**Excluido:** node_modules, dist, .env, .git, secrets.

---

## 4. LIVE_PROJECT_STATE.json

**Ubicación:** `devcontext/LIVE_PROJECT_STATE.json`

**Se actualiza automáticamente tras:**
- `npm run build` (postbuild)
- `npm run dev:simulator` (al iniciar y al salir)
- `npm run dev:iphone` (al finalizar)
- `npm run project:snapshot` (al finalizar)

**Contenido:**
- git branch, commit, dirty
- environment mode, node, platform
- auth_mode (dev_auto_login, bypass_auth)
- ios_config (has_server_url, mode)
- map_config (has_token)
- build_mode
- env_structure (keys, sin valores secretos)

---

## 5. DEV AUTO LOGIN (AuthContext)

**Activación:** Solo cuando `import.meta.env.DEV === true` y `VITE_DEV_BYPASS_AUTH !== 'true'`.

**Comportamiento:**
- En dev (simulator con dev server): usa DEV_MOCK_USER, no llama a Supabase Auth
- En producción o con bypass: flujo OAuth normal (Google)

**No se modifica:** producción auth, Login.jsx, flujo OAuth.

---

## 6. REALTIME RELOAD

**Simulator:** `npm run dev:simulator` usa `npx cap run ios --live-reload --port 5173`. La app carga desde localhost y Vite HMR recarga al cambiar código.

**iPhone físico:** No usa dev server. Build local empaquetada.
