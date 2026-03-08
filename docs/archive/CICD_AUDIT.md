# CI/CD Audit — WaitMe

**Fecha:** 2025-03-04  
**Objetivo:** Arquitectura startup-grade blindada con SOLO main, cero pasos manuales, Supabase como código.

---

## 1. Qué hace hoy el pipeline (paso a paso)

### Workflows existentes

| Workflow | Trigger | Pasos |
|----------|---------|-------|
| **lint-and-build.yml** | `push` → main | checkout → setup Node 20 → npm ci → lint → build |
| **tests.yml** | `push`/`pull_request` → main | checkout → setup Node 20 → npm ci → playwright install chromium → lint → typecheck → playwright test |
| **supabase-migrations.yml** | `push` → main (solo si cambian `supabase/**` o el workflow) | checkout → setup Supabase CLI → link --project-ref --password → db push |

### Flujo actual

1. **Push a main**
   - `lint-and-build` y `tests` corren en paralelo (independientes).
   - `supabase-migrations` solo corre si hay cambios en `supabase/**` o en el propio workflow.

2. **Problemas detectados**
   - No hay gate: migrations pueden correr aunque lint/tests fallen.
   - Duplicación: lint corre en ambos workflows.
   - No hay cache explícito de dependencias (solo `cache: npm` en setup-node).
   - No hay artifacts de build.
   - No hay verificación de drift de DB.
   - No hay Dependabot ni CodeQL.
   - No hay environments con approvals.

---

## 2. Supabase como código

### Estructura actual

```
supabase/
├── config.toml          # project_id = "WaitMeNuevo", migrations enabled
├── seed.sql             # Vacío (solo comentarios)
├── migrations/          # 6 migraciones SQL
│   ├── 20260304134200_create_profiles.sql
│   ├── 20260304150000_create_parking_alerts.sql
│   ├── 20260304160000_enable_realtime_parking_alerts.sql
│   ├── 20260304170000_add_geohash_parking_alerts.sql
│   ├── 20260305120000_fix_profiles_rls_and_trigger.sql
│   └── 20260305160000_core_schema.sql
└── functions/           # Edge functions (map-match)
```

### Config

- `db.migrations.enabled = true`
- `db.seed.sql_paths = ["./seed.sql"]`
- `major_version = 17`

---

## 3. Qué falta para estar “blindado”

| Gap | Descripción |
|-----|-------------|
| Gate único | CI debe pasar antes de aplicar migrations. Hoy migrations pueden correr aunque tests fallen. |
| Drift check | No se verifica si la DB remota tiene cambios manuales no reflejados en migrations. |
| Workflow unificado | Lint, typecheck, tests y build en un solo pipeline con dependencias claras. |
| Cache | Cache de npm y Playwright browsers. |
| Artifacts | Build artifacts para deploy posterior. |
| Dependabot | Actualización automática de dependencias. |
| CodeQL | Análisis de seguridad de código. |
| Environments | Staging (auto) y Production (con approval). |
| Secrets audit | Documentar qué secrets se usan y cuáles faltan. |

---

## 4. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Drift de DB** | Alta | Ejecutar `supabase db diff` antes de push; fallar si hay diferencias no migradas. |
| **Migrations sin gate** | Alta | Migrations solo tras CI exitoso; usar `workflow_run` o job dependencies. |
| **Secrets faltantes** | Alta | Documentar y validar SUPABASE_*, VITE_*, MAPBOX en CI. |
| **Deploy inseguro** | Media | Environments con approval para producción. |
| **Sin SAST** | Media | CodeQL para detección de vulnerabilidades. |
| **Dependencias desactualizadas** | Media | Dependabot. |
| **Tests flaky** | Media | Retries en CI; considerar smoke tests más estables. |
| **Build sin artifacts** | Baja | Subir build a artifacts para deploy. |

---

## 5. Lista priorizada de cambios

### P0 (crítico)

- [x] **CI unificado** (`ci.yml`): lint + typecheck + tests + build en un solo pipeline.
- [x] **Gate de migrations**: Supabase solo corre tras CI exitoso; migrations SOLO en main.
- [x] **Drift check**: Verificar drift antes de aplicar migrations; fallar si hay diferencias.

### P1 (importante)

- [x] **Cache**: npm + Playwright browsers.
- [x] **Artifacts**: Subir build para deploy.
- [x] **Dependabot**: `dependabot.yml` para npm y GitHub Actions.
- [x] **CodeQL**: Análisis de seguridad.
- [x] **Environments**: Documentar staging/production con approvals.

### P2 (mejora)

- [ ] **Prettier en CI**: Añadir `format:check` al pipeline.
- [ ] **Branch protection**: Requerir CI antes de merge a main.
- [ ] **Supabase preview**: Branch previews para PRs (si plan lo permite).
- [ ] **Smoke tests**: Tests más rápidos para validación básica.

---

## 6. Secrets requeridos

| Secret | Uso | Workflow |
|-------|-----|----------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI auth | supabase.yml |
| `SUPABASE_PROJECT_REF` | Link al proyecto | supabase.yml |
| `SUPABASE_DB_PASSWORD` | DB password para link | supabase.yml |
| `VITE_SUPABASE_URL` | Tests E2E | ci.yml |
| `VITE_SUPABASE_ANON_KEY` | Tests E2E | ci.yml |
| `VITE_MAPBOX_TOKEN` | Tests E2E (mapas) | ci.yml |

---

## 7. Resumen ejecutivo

El pipeline actual tiene **duplicación**, **falta de gate** entre CI y migrations, y **sin verificación de drift**. La implementación P0/P1 unifica CI, añade drift check, cache, artifacts, Dependabot, CodeQL y documentación de environments, dejando el repo listo para un flujo blindado con main como única rama de producción.
