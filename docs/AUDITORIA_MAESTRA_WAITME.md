# Auditoría Maestra WaitMe — 2026-03-10

Auditoría exhaustiva del proyecto WaitMe. Estado real verificado contra código y configuración.

---

## 1. REPO / ARQUITECTURA

### Estructura del proyecto

- **Frontend:** React 18, Vite 6, Tailwind, Zustand, React Query, Framer Motion, Mapbox GL
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage)
- **iOS:** Capacitor 8, Xcode
- **Fuente de verdad por dominio:** Supabase para datos; devcontext para estado técnico; docs para documentación

### Rutas de runtime principales

- `src/main.jsx` → initOAuthCapture, AuthProvider, App
- `src/App.jsx` → AuthRouter (login/home), Layout
- `src/lib/supabaseClient.js` → punto único Supabase, lazy init
- `src/lib/AuthContext.jsx` → sesión, ensureUserInDb, loginAsSimulatorTest
- `src/lib/oauthCapture.js` → appUrlOpen, processOAuthUrl, exchangeCodeForSession

### Módulos duplicados / lógica duplicada

- **VERIFICADO:** No hay imports de base44. Solo comentarios legacy en servicios (sustituye base44.X).
- **VERIFICADO:** Supabase es la única capa de datos activa.

### Código muerto / legacy

- `docs/archive/` — 100+ archivos archivados. No afectan runtime.
- Comentarios "sustituye base44" en `src/services/*` — informativos, no código activo.

### Patrones inconsistentes

- Algunos archivos `.js`, otros `.jsx`/`.ts` — aceptable.
- `import.meta.env.VITE_*` usado de forma consistente.

### Archivos protegidos (guard rails)

- `src/pages/Home.jsx`
- `src/components/MapboxMap.jsx`
- `src/components/map/ParkingMap.jsx`
- `src/components/cards/CreateAlertCard.jsx`

### Archivos centrales / de alto riesgo

- `src/lib/supabaseClient.js` — fallo aquí rompe toda la app
- `src/lib/AuthContext.jsx` — fallo aquí rompe auth
- `src/lib/oauthCapture.js` — fallo aquí rompe OAuth iOS
- `capacitor.config.ts` — inyecta server.url si CAPACITOR_USE_DEV_SERVER=true

---

## 2. CURSOR / AUTOMATION / DEV WORKFLOW

### Flujo del hook Cursor

- `.cursor/hooks.json` → `stop` → `bash automation/on-change.sh`
- **VERIFICADO:** Hook configurado correctamente.

### automation/on-change.sh

- 1) validate-project
- 2) rebuild-context
- 3) publish-devcontext
- 4) git add devcontext/, docs/, PROJECT_GUARDRAILS.md
- 5) commit + push (solo si hay cambios)
- **NO** añade scripts/ ni automation/ — uso de ship:infra para eso.

### Scripts de automatización

| Script | Estado | Verificado |
|--------|--------|------------|
| automation/validate-project.sh | OK | lint, typecheck, build |
| automation/rebuild-context.sh | OK | STATE_OF_TRUTH, NEXT_TASK, docs |
| automation/publish-devcontext.sh | OK | ZIP, tree, screenshot |
| automation/detect-change.sh | OK | git status |
| scripts/project-snapshot.sh | OK | tmp/waitme-snapshot.zip |
| scripts/project-health.sh | OK | 9 checks |
| scripts/dev-pipeline.sh | OK | 5 pasos |
| scripts/ship-infra.sh | OK | guard src/, dry-run |

### Reproducibilidad

- **SÍ** — npm run lint, typecheck, build son deterministas.
- **SÍ** — ios:refresh fuerza build local, sin dev server.
- **PARCIAL** — tests Vitest tienen 6 unhandled errors (Preferences/window en node).

### Copy/paste manual restante

- CURSOR_LAST_RESPONSE.md — Cursor debe escribirlo manualmente o por regla.
- Supabase Redirect URLs — config manual en Dashboard.
- BRIDGE_URL — variable de entorno opcional para ping.

### Sincronización devcontext

- **SÍ** — on-change regenera STATE_OF_TRUTH, NEXT_TASK, docs.
- **SÍ** — rebuild-context actualiza LAST_UPDATE en NEXT_TASK.md.

### STATE_OF_TRUTH.json

- **CONFIABLE** — generado por rebuild-context, JSON válido.
- **VERIFICADO** — estructura correcta, artifacts, workflow.

### NEXT_TASK.md

- **CONFIABLE** — actualizado por rebuild-context.
- current_stage: infrastructure_stable
- next_task: close_google_login_ios

### PROJECT_GUARDRAILS.md

- **NO ENFORZADO** automáticamente — es documentación.
- ship-infra SÍ bloquea src/ en runtime.

### ship:infra

- **SEGURO** — bloquea si hay cambios en src/.
- **VERIFICADO** — dry-run funciona, solo stagea paths permitidos.

### Auto-commit inseguro

- **NO** — on-change solo commit devcontext, docs, PROJECT_GUARDRAILS.
- **NO** — ship-infra bloquea src/.

### ChatGPT-driven workflow

- **PARCIAL** — devcontext, STATE_OF_TRUTH, NEXT_TASK permiten entender estado.
- **FALTA** — bridge debe estar desplegado y BRIDGE_URL configurado para ping automático.
- **FALTA** — ChatGPT necesita acceso a repo (GitHub API o ZIP) para leer contexto.

---

## 3. SUPABASE

### Arquitectura Auth

- Supabase Auth con OAuth (Google, Apple).
- flowType: pkce.
- Storage: Capacitor Preferences en iOS, default en web.

### Configuración Google en código

- redirectTo: `com.waitme.app://auth/callback` para iOS native.
- Login.jsx evita localhost en redirectTo.
- **ASUNTO EXTERNO:** Supabase Dashboard debe tener `com.waitme.app://auth/callback` en Redirect URLs.

### Flujo de sesión

1. getSession() al boot
2. applySession → ensureUserInDb → setUser
3. onAuthStateChange(SIGNED_IN) → applySession

### Sync profile/user

- ensureUserInDb inserta en profiles si no existe.
- profile se lee de tabla profiles tras auth.

### base44 / Supabase

- **VERIFICADO:** No hay base44 en código. Solo Supabase.

### Migraciones

- 17 migraciones SQL en supabase/migrations/.
- Core schema, profiles, parking_alerts, alert_reservations, conversations, messages, notifications, transactions, user_location_updates, storage.

### Riesgos Auth

- **Pendiente validación manual** — AUTH_STATUS indica "Pendiente validar" para user null fallback.
- Google passkey en simulador — evitado con "Entrar en modo test" (loginAsSimulatorTest).

---

## 4. XCODE / IOS / CAPACITOR

### capacitor.config.ts

- server.url **solo** si CAPACITOR_USE_DEV_SERVER === "true".
- **VERIFICADO** — lógica correcta.

### iOS runtime config

- ios/App/App/capacitor.config.json — **sin** server key.
- **VERIFICADO** — build local, no localhost.

### local bundle vs dev server

- ios:refresh — unset CAPACITOR_USE_DEV_SERVER, rebuild, cap sync, limpia server.url.
- **VERIFICADO** — no hay path que cargue localhost por defecto.

### Riesgos de variables de entorno

- Bajo — ios:refresh fuerza unset al inicio.

### Simulador

- Login con "Entrar en modo test" (bypass).
- Google OAuth — InAppBrowser → redirect com.waitme.app://auth/callback.

### Deep link / URL scheme

- Info.plist: CFBundleURLSchemes = com.waitme.app.
- URL: com.waitme.app://auth/callback.
- **VERIFICADO** — configuración correcta.

### Google login iOS

- **CÓDIGO:** Listo — redirectTo, oauthCapture, exchangeCodeForSession.
- **CONFIG:** Supabase Redirect URLs debe incluir com.waitme.app://auth/callback.
- **BLOQUEADOR POTENCIAL:** Passkey de Google en simulador — bypass con "Entrar en modo test".

### Info.plist / URL scheme / appId

- appId: com.waitme.app.
- URL scheme: com.waitme.app.
- **SIN** mismatch detectado.

### Producción

- Build local empaquetada — adecuada para producción.
- Dev server solo para desarrollo explícito.

### iPhone físico vs simulador

- Simulador: "Entrar en modo test" disponible (VITE_IOS_DEV_BUILD=1).
- iPhone físico: flujo Google normal, sin bypass.

### Riesgos iOS

- Passkey en simulador — mitigado con bypass.
- Validación manual de Google en dispositivo real — pendiente según docs.

---

## 5. APP TECHNICAL HEALTH

### npm run lint

- **OK** — exit 0.

### npm run typecheck

- **OK** — exit 0.

### npm run build

- **OK** — exit 0.
- Warning: chunks > 500 kB (mapbox-gl, index).

### Tests

- 105 passed, 14 test files.
- 6 unhandled errors (Preferences.get en node — Capacitor no tiene window).
- **FRAGIL** — Vitest en node no simula bien Capacitor.

### Tests saltados

- No hay .skip explícitos en los resultados mostrados.

### Puntos débiles

- **Realtime:** Supabase Realtime — no auditado en profundidad.
- **Location:** LocationEngineStarter, hooks de ubicación — no auditados.
- **Map:** MapboxMap, ParkingMap — protegidos, no modificados.
- **Auth:** ensureUserInDb timeout, fallback — documentado en AUTH_STATUS.

---

## 6. FLUJOS CRÍTICOS (sin modificar lógica)

### Login

- AuthRouter → Login si !user.
- Login → handleOAuthLogin('google') o loginAsSimulatorTest.

### Google login

- signInWithOAuth({ redirectTo: com.waitme.app://auth/callback, skipBrowserRedirect: true })
- InAppBrowser.openInExternalBrowser
- Redirect → appUrlOpen → processOAuthUrl → exchangeCodeForSession(code)
- onAuthStateChange(SIGNED_IN) → applySession

### Persistencia auth

- Capacitor Preferences (sb-* keys).
- getSession al boot.

### Flujo alerta activa

- No auditado en detalle (fuera de scope).

### Geolocalización

- LocationEngineStarter — no auditado.

### Pagos

- transactionsSupabase, release-payment — no auditado.

### History / Notifications / Chat

- Dependen de Supabase. No auditados en detalle.

### Puntos de fallo en producción

- Supabase no disponible
- Redirect URL mal configurado en Supabase
- Token Mapbox inválido
- ensureUserInDb timeout (5s) — fallback a session.user

---

## 7. HIGIENE / ESCALABILIDAD

### Nomenclatura

- Consistente en general.
- Algunos archivos en archive con nombres largos.

### Separación de responsabilidades

- data/ → adapters
- services/ → Supabase
- Componentes no llaman Supabase directamente — **VERIFICADO**.

### Config / secrets

- .env para VITE_*
- .gitignore excluye .env
- Secrets en GitHub Actions

### Limpieza repo

- docs/archive extenso pero no afecta build.
- tmp/ para snapshots.

### Drift docs vs realidad

- IOS_RUNTIME_STATUS: "último ios:refresh (2026-03-09 20:58)" — timestamp antiguo.
- DEV_STATUS: "captura 20:58" — antiguo.
- Estado real más reciente en STATE_OF_TRUTH.

### CI/CD

- .github/workflows/ci.yml — lint, typecheck, build.
- **OK** — determinista.

### Nivel técnico

- Infraestructura de automatización sólida.
- Auth/Supabase bien estructurado.
- Falta validación E2E de Google en dispositivo real.
- Tests unitarios con errores de entorno (Capacitor en node).

---

## 8. RESPUESTAS A PREGUNTAS MANDATARIAS

1. **¿El problema de iOS runtime está cerrado?** — **SÍ.** capacitor.config.ts condicional, ios-refresh limpia server.url, ios/App/App/capacitor.config.json sin server.

2. **¿Hay path que cargue localhost por accidente?** — **NO.** Solo si CAPACITOR_USE_DEV_SERVER=true explícitamente.

3. **¿devcontext es fuente de verdad?** — **PARCIAL.** Para estado técnico (build, lint, git) sí. Para estado de producto (auth, map) no — eso está en Supabase y código.

4. **¿ChatGPT-only workflow es posible?** — **PARCIAL.** Devcontext permite entender estado. Falta bridge desplegado y flujo de lectura automática.

5. **¿Qué obliga trabajo manual?** — CURSOR_LAST_RESPONSE (si no hay regla), Supabase Redirect URLs, BRIDGE_URL, validación manual de Google en iPhone.

6. **¿Google login iOS está bloqueado?** — **NO por código.** Código listo. Posible bloqueo: config Supabase Redirect URLs, passkey en simulador (bypass disponible).

7. **Archivos que controlan Google login:** Login.jsx, AuthContext.jsx, oauthCapture.js, supabaseClient.js.

8. **Archivos que controlan redirect/deep link:** oauthCapture.js, Info.plist (CFBundleURLSchemes), Login.jsx (redirectTo).

9. **Archivos más peligrosos:** supabaseClient.js, AuthContext.jsx, oauthCapture.js, capacitor.config.ts, Home.jsx, MapboxMap.jsx.

10. **Deuda técnica urgente vs no urgente:** Urgente: validar Google en iPhone real. No urgente: tests Vitest/Capacitor, chunks > 500kB.

11. **Duplicaciones:** Solo comentarios legacy base44. No duplicación activa.

12. **Fragilidades:** Tests con Capacitor en node, ensureUserInDb timeout, AUTH_STATUS "pendiente validar".

13. **Lo que está 10/10:** capacitor.config.ts, ios-refresh, ship-infra guard, STATE_OF_TRUTH, NEXT_TASK, automation pipeline.

14. **Fake-green:** AUTH_STATUS "callback recibido sí" — no hay evidencia de prueba manual reciente. IOS_RUNTIME_STATUS timestamps antiguos.

15. **Orden de prioridad:** 1) Validar Google login en iPhone real. 2) Arreglar tests Vitest/Capacitor. 3) Actualizar timestamps en docs. 4) Desplegar bridge si se quiere ChatGPT workflow completo.
