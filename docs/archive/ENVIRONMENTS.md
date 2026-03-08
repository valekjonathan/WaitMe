# Environments — Staging y Production

Configuración de entornos para CI/CD con approvals.

---

## Resumen

| Environment | Uso | Approval | Workflows |
|-------------|-----|----------|-----------|
| **staging** | Deploy automático (futuro) | No | — |
| **production** | Migrations Supabase, deploy prod | Sí | supabase.yml |

---

## Configuración en GitHub

### 1. Crear environments

En el repo: **Settings → Environments**

- **staging**: sin protection rules (auto)
- **production**: con **Required reviewers** (1+ persona)

### 2. production (con approval)

1. Crear environment `production`
2. **Required reviewers**: añadir al menos un miembro del equipo
3. Cuando `supabase.yml` use `environment: production`, el job esperará aprobación antes de ejecutar

### 3. staging (sin approval)

1. Crear environment `staging`
2. Sin protection rules
3. Para futuros deploys automáticos (Vercel, Netlify, etc.)

---

## Flujo actual

```
push/PR a main
    → CI (lint, typecheck, tests, build)
    → Si pasa: Supabase workflow se dispara
    → Job "migrate" usa environment: production
    → Si hay reviewers: espera approval
    → Tras approval: drift check + db push
```

---

## Secrets por environment

Los secrets (`SUPABASE_*`, `VITE_*`) se definen a nivel de repo. Para separar staging/production en el futuro:

- **production**: secrets con sufijo `_PRODUCTION` o environment-specific
- **staging**: secrets con sufijo `_STAGING`

Hoy se usa un único proyecto Supabase (`WaitMeNuevo`), por lo que los secrets son compartidos.
