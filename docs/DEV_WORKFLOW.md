# WaitMe — Professional Development Workflow

Workflow de desarrollo con auto-login en simulador, preview en tiempo real y export para ChatGPT.

---

## 1. SIMULATOR DEV MODE

**Objetivo:** Preview en tiempo real, siempre logueado (dev user), sin Google OAuth.

```bash
npm run dev:simulator
```

**Qué hace:**
- Arranca Vite dev server (puerto 5173)
- Bootea simulador iPhone
- Sincroniza Capacitor en modo dev server
- Lanza app con live reload
- **Auto-login:** DEV_MOCK_USER (no se dispara Google login)
- Actualiza `devcontext/LIVE_PROJECT_STATE.json`

**Requisitos:** No se usa `VITE_DEV_BYPASS_AUTH` → AuthContext aplica auto-login en DEV.

---

## 2. IPHONE REAL MODE

**Objetivo:** Google login real, build de producción, sin localhost.

```bash
npm run dev:iphone
```

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
