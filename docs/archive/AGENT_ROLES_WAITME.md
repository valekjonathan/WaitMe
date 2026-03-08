# Roles de agente — WaitMe

Cuatro roles para estructurar el trabajo con Cursor. Cada uno tiene responsabilidades y entregables claros.

---

## 1. Auditor

**Qué hace:** Revisa el estado del proyecto sin aplicar cambios. Identifica problemas, deuda técnica y desviaciones de las reglas.

**Entregables:**
- Informe en `docs/` (ej. `AUDIT_YYYYMMDD.md`)
- Resumen en chat con hallazgos críticos
- Lista de archivos afectados y riesgos
- Recomendaciones priorizadas (crítico / medio / bajo)

**Cuándo usar:** Antes de refactors grandes, tras migraciones, o cuando algo "no cuadra".

**Prompt sugerido:** Workflow "Auditoría exhaustiva" en `docs/WORKFLOWS_WAITME.md`.

---

## 2. Implementador

**Qué hace:** Aplica cambios de código siguiendo el protocolo seguro. Hace commits atómicos y documenta.

**Entregables:**
- Código modificado
- Lista de archivos tocados
- Descripción del cambio y prueba recomendada
- Commit con mensaje claro

**Reglas:** No tocar Home.jsx sin orden explícita. No cambiar visuales no pedidos. Preferir cambios mínimos y reversibles.

**Cuándo usar:** Para features, fixes y refactors aprobados.

**Prompt sugerido:** Incluir siempre "Sigue docs/SAFE_CHANGE_PROTOCOL.md" y "docs/CURSOR_RULES_WAITME.md".

---

## 3. Tester visual

**Qué hace:** Valida que la UI funcione correctamente en móvil y desktop. Detecta regresiones visuales y de flujo.

**Entregables:**
- Checklist de pantallas probadas
- Lista de flujos validados (login, home, history, chat, mapa)
- Incidencias encontradas con pasos para reproducir
- Screenshots o descripción si hay anomalías

**Cuándo usar:** Tras cambios en UI, antes de releases, o cuando el usuario reporta "algo se ve mal".

**Prompt sugerido:**
```
Actúa como Tester visual. Valida los flujos críticos de WaitMe en viewport móvil:
- Login → Home
- Búsqueda y Crear alerta
- History → Chat / Navigate
- Mapas visibles
- Notificaciones y badge
Reporta incidencias con pasos para reproducir. No modifiques código.
```

---

## 4. Documentador

**Qué hace:** Mantiene la documentación actualizada. Crea y actualiza docs cuando cambia la arquitectura o los flujos.

**Entregables:**
- Actualización de `docs/PROJECT_SOURCE_OF_TRUTH.md` si cambian dominios/tablas
- Actualización de `docs/CI_SETUP.md` si cambian workflows o secrets
- Nuevos docs cuando se añaden features relevantes
- Changelog o notas de versión si aplica

**Cuándo usar:** Tras migraciones, cambios de arquitectura, o cuando la documentación queda desfasada.

**Prompt sugerido:**
```
Actúa como Documentador. Revisa la documentación de WaitMe y actualízala según el estado actual del código. Verifica:
- PROJECT_SOURCE_OF_TRUTH.md
- CURSOR_RULES_WAITME.md
- CI_SETUP.md
- MAP_DEBUG_CHECKLIST.md
Añade o corrige lo que falte. No modifiques código.
```
