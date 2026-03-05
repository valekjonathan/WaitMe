# One-time: Environment Production (1 pantalla)

Si el script `github_hardening.sh` no pudo configurar el environment por API, hazlo manualmente en **1 pantalla**.

---

## Pasos (mínimos)

1. **Abre:** `https://github.com/OWNER/REPO/settings/environments`
   - Sustituye `OWNER/REPO` por tu repo (ej. `valekjonathan/WaitMe`).

2. **Clic en "New environment"** (o en "production" si ya existe).

3. **Nombre:** `production`

4. **Required reviewers:** Añade al menos 1 usuario (tú o un compañero).

5. **Save protection rules.**

---

## Resumen visual

```
Settings → Environments → New environment
    └── Name: production
    └── Required reviewers: [tu usuario]
    └── [Save]
```

Listo. El workflow `supabase.yml` usará este environment y esperará aprobación antes de aplicar migrations.
