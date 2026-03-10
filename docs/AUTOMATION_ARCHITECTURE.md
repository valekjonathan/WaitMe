# Arquitectura de Automatización — WaitMe

Documento que describe el pipeline de automatización, el sistema devcontext y la integración con Cursor.

---

## 1. Visión general

El sistema de automatización mantiene un **estado técnico determinista** del proyecto, permitiendo:

- Herramientas externas (ChatGPT, Bridge) entender el estado del repo
- Reducir copy/paste manual de prompts
- Sincronizar devcontext como fuente única de verdad
- Flujo reproducible: Repo → Build → Simulator

---

## 2. devcontext — Fuente única de verdad

### Ubicación

- `devcontext/` — directorio con artefactos y estado
- `devcontext/STATE_OF_TRUTH.json` — estado canónico del proyecto (JSON)

### STATE_OF_TRUTH.json

Archivo **siempre válido JSON**, regenerado automáticamente. Nunca editar manualmente.

Estructura:

| Sección | Contenido |
|---------|-----------|
| `project` | "waitme" |
| `timestamp` | ISO timestamp de última regeneración |
| `git` | branch, commit, dirty |
| `environment` | node, npm, platform |
| `build` | status, last_run |
| `lint` | status (ok/failed) |
| `typecheck` | status |
| `tests` | passed, failed, skipped |
| `ios_runtime` | mode, server_url, simulator_status |
| `automation` | bridge, webhook, devcontext_updated |
| `cursor` | last_summary, last_files_modified |
| `project_rules` | blocked_areas (map, ui, payments, Home.jsx) |

---

## 3. Scripts de automatización

Ubicación: `automation/`

### detect-change.sh

- **Función:** Detecta si hay modificaciones en el repo
- **Salida:** Exit 0 si hay cambios, 1 si no
- **Uso:** Opcional para decidir si ejecutar pipeline

### validate-project.sh

- **Función:** Ejecuta lint, typecheck y build
- **Salida:** Exit 0 si todo OK, 1 si falla
- **Output:** Variables `LINT_STATUS`, `TYPECHECK_STATUS`, `BUILD_STATUS` para consumo de rebuild-context

### rebuild-context.sh

- **Función:** Regenera STATE_OF_TRUTH.json y actualiza timestamps en docs
- **Entrada:** Variables de entorno (LINT_STATUS, etc.) de validate-project
- **Salida:** `devcontext/STATE_OF_TRUTH.json` actualizado

### publish-devcontext.sh

- **Función:** Genera artefactos devcontext
- **Artefactos:** ZIP, project-tree.txt, latest-simulator.png (si simulador booted)

### on-change.sh (orquestador)

- **Función:** Orquesta toda la pipeline
- **Flujo:**
  1. validate-project → captura status
  2. rebuild-context → STATE_OF_TRUTH + docs
  3. publish-devcontext → ZIP, tree, screenshot
  4. Git: stage solo devcontext/* y docs/*, commit y push
- **Importante:** NO hace commit de código de aplicación

---

## 4. Integración con Cursor

### Hooks

- `.cursor/hooks.json` define `stop` → `bash automation/on-change.sh`
- Al cerrar sesión Cursor, se ejecuta on-change

### CURSOR_LAST_RESPONSE.md

- Cursor debe escribir un resumen en `docs/CURSOR_LAST_RESPONSE.md`
- Formato: timestamp, descripción de tarea, archivos modificados, resultado de validación
- rebuild-context.sh lee este archivo para poblar `cursor.last_summary` en STATE_OF_TRUTH

### Actualización de STATE_OF_TRUTH

- La sección `cursor` se actualiza en cada rebuild-context
- `last_summary` se extrae de CURSOR_LAST_RESPONSE.md

---

## 5. GitHub automation

### Commit automático

- **Solo se hace commit de:**
  - `devcontext/*`
  - `docs/*`
  - `PROJECT_GUARDRAILS.md`
- **Mensaje:** `chore(devcontext): update project state`
- **Código de aplicación:** nunca se auto-commitea
- **scripts/ y automation/:** no se auto-commitean; cambios quedan en working tree

### Bridge

- Si `BRIDGE_URL` está definido, on-change hace POST a `/ping` tras push
- Payload: repo, status, timestamp

---

## 6. Flujo completo

```
Cursor modifica archivos
    ↓
Cursor escribe CURSOR_LAST_RESPONSE.md (manual o por regla)
    ↓
on-change.sh (trigger: hook stop o manual)
    ↓
validate-project.sh → lint, typecheck, build
    ↓
rebuild-context.sh → STATE_OF_TRUTH.json, docs timestamps
    ↓
publish-devcontext.sh → ZIP, tree, screenshot
    ↓
git add devcontext docs
git commit
git push
    ↓
(OPCIONAL) Bridge recibe ping
```

---

## 7. Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `bash scripts/dev-pipeline.sh` | Pipeline completa: validate → rebuild → publish → snapshot → health |
| `npm run devcontext:update` | Script completo (legacy): ZIP, ios:refresh, logs, docs |
| `bash automation/on-change.sh` | Pipeline nueva: validate, rebuild, publish, commit |
| `bash automation/validate-project.sh` | Solo lint, typecheck, build |
| `bash automation/rebuild-context.sh` | Solo regenerar STATE_OF_TRUTH |
| `bash scripts/project-snapshot.sh` | Genera tmp/waitme-snapshot.zip |
| `bash scripts/project-health.sh` | Health check de infraestructura |

---

## 8. Áreas bloqueadas

El sistema documenta que **no se modifican** sin orden explícita:

- map
- ui
- payments
- Home.jsx

Esto se refleja en `STATE_OF_TRUTH.json` → `project_rules.blocked_areas`.

---

## 9. Guard Rails

Ver **`PROJECT_GUARDRAILS.md`** en la raíz del proyecto para:

- Archivos críticos (Home.jsx, MapboxMap, ParkingMap, CreateAlertCard)
- Sistemas críticos (map engine, payment logic, transaction flow)
- Reglas de commit automático (solo devcontext/*, docs/*, PROJECT_GUARDRAILS.md)
