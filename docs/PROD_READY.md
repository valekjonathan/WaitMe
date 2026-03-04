# WaitMe - Setup Producción

## 1. Variables de entorno

Crear `.env` en la raíz (copiar desde `.env.example`):

```
VITE_MAPBOX_TOKEN=pk.xxx
VITE_BASE44_API_BASE_URL=https://api.base44.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SENTRY_DSN=   # opcional
```

## 2. Supabase - Setup una vez

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar migraciones:
   ```bash
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```
3. Secrets para Edge Functions:
   - `MAPBOX_SECRET_TOKEN`: token secreto de Mapbox (para map-match)
4. Habilitar Realtime en tabla `parking_alerts` (ya incluido en migración)

## 3. Desplegar sin tocar Supabase UI

- Las migraciones están en `supabase/migrations/`
- `supabase db push` aplica todas las migraciones pendientes
- No es necesario copiar/pegar SQL en el dashboard

## 4. GitHub Actions

El workflow `.github/workflows/lint-and-build.yml` ejecuta:
- `npm run lint`
- `npm run build`

En cada push a `main`. No requiere DB ni secrets.
