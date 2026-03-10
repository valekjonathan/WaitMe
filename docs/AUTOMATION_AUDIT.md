# Automation Audit — WaitMe

---

## 1. Cursor

- **Hooks:** .cursor/hooks.json → stop → bash automation/on-change.sh
- **Estado:** Configurado correctamente
- **Trigger:** Al cerrar sesión Cursor (stop)

---

## 2. Hooks

- **Único hook:** stop
- **Comando:** automation/on-change.sh
- **No hay** pre-commit ni otros hooks de Cursor para este flujo

---

## 3. Bridge

- **Ubicación:** automation/bridge/
- **Stack:** Express, Node
- **Función:** Lee docs/devcontext desde GitHub API, endpoint /context/latest, /ping
- **Despliegue:** render.yaml referencia automation/bridge
- **Estado:** Código presente, despliegue no verificado
- **Ping:** on-change hace POST a BRIDGE_URL/ping si BRIDGE_URL está definido

---

## 4. Webhook

- **GitHub webhook:** No configurado explícitamente en esta auditoría
- **Bridge:** Puede recibir webhooks; no hay evidencia de configuración activa

---

## 5. Devcontext

- **Estado:** Operativo
- **STATE_OF_TRUTH.json:** Regenerado por rebuild-context
- **NEXT_TASK.md:** Actualizado por rebuild-context (LAST_UPDATE)
- **Artefactos:** ZIP, project-tree, latest-simulator.png por publish-devcontext
- **Sincronización:** on-change ejecuta validate → rebuild → publish → git add → commit → push

---

## 6. Pipeline

- **dev-pipeline.sh:** validate → rebuild → publish → snapshot → health
- **Estado:** OK (verificado)
- **Comando:** npm run pipeline:devcontext

---

## 7. ship:infra

- **Función:** Commit/push solo infra (devcontext, docs, PROJECT_GUARDRAILS, scripts, automation)
- **Guard:** Bloquea si hay cambios en src/
- **Dry-run:** --dry-run disponible
- **Estado:** OK, guard verificado

---

## 8. Qué Sigue Siendo Manual

| Tarea | Manual | Mitigación |
|-------|--------|------------|
| Escribir CURSOR_LAST_RESPONSE.md | Sí | Regla Cursor puede automatizar |
| Configurar Supabase Redirect URLs | Sí | Una vez por proyecto |
| Configurar BRIDGE_URL | Sí | Opcional |
| Validar Google login en iPhone | Sí | Prueba manual |
| Commit de scripts/automation | No | ship:infra lo hace |
| Ejecutar ios:refresh tras cambio visual | Sí | Regla Cursor lo indica |
