# Auditoría CI / Vercel / Supabase / Emails — Fix

**Fecha:** 2026-03-07

---

## 1. Estado actual

| Sistema | Estado | Causa de emails |
|---------|--------|-----------------|
| GitHub Actions CI | ✅ Verde (lint, typecheck, build, playwright) | Fallos → email si configurado |
| Vercel | ✅ Build OK | Fallos → email si configurado |
| Supabase Migrations | ⚠️ Integración opcional | Si GitHub integration activa y migración falla → email |

---

## 2. Workflow CI (.github/workflows/ci.yml)

```yaml
jobs:
  build:
    - lint
    - typecheck
    - build
    - playwright install
    - playwright test
```

**Secrets requeridos:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

**Resultado típico:** 24 passed, 13 skipped. Los skips son intencionados.

---

## 3. Tests skipped — justificación

| Categoría | Tests | Motivo |
|-----------|-------|--------|
| Login requerido | smoke/create, visual/*, validation/* | Requieren usuario logueado; en CI no hay auth |
| Geometría CI | layout-map-create, layout/map-layout | viewport/geometría variable en webkit-mobile headless |
| Screenshots | create-card-position | Percy/Chromatic; skip en CI |
| Safe mode | safe-mode.spec | Solo cuando VITE_SAFE_MODE=true |

**Conclusión:** Skips justificados. No hay skips falsos que deban eliminarse sin antes implementar auth en tests (fixtures, bypass).

---

## 4. Emails — causas reales

| Fuente | Cuándo | Fix |
|--------|--------|-----|
| GitHub | CI job falla | Revisar logs; secrets; dependencias |
| Vercel | Build falla | Env vars en Vercel dashboard |
| Supabase | Migración falla | Dashboard → Integrations → GitHub: desactivar si no se usan migraciones automáticas; o corregir migraciones |

**Supabase migrations integration:** Si en Supabase Dashboard → Project Settings → Integrations tienes GitHub conectado, las migraciones en `supabase/migrations/` pueden ejecutarse en push. Si fallan, Supabase envía email. Para evitar: desactivar la integración o asegurar que las migraciones sean válidas.

---

## 5. Vercel

- **Build command:** `npm run build`
- **Output:** `dist`
- **Env:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN
- **Rewrites:** SPA (/(.*) → /index.html)

---

## 6. Acciones recomendadas

1. **CI:** Mantener workflow actual; secrets configurados.
2. **Emails Supabase:** Revisar Dashboard → Integrations → GitHub. Si no usas migraciones automáticas, desactivar.
3. **Tests skipped:** Documentar en README o docs; considerar en futuro auth fixtures para reducir skips.
