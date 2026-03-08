# Configuración de base de datos WaitMe

## Migraciones

Las migraciones están en `supabase/migrations/`. Para aplicar:

```bash
npm run supabase:migrate
# o
npm run db:migrate:print   # imprime SQL para pegar en Supabase SQL Editor
```

## Realtime

Tras aplicar la migración `20260305160000_core_schema.sql`, activar Realtime en **Supabase Dashboard**:

1. Ir a **Database** → **Replication**
2. En la publicación `supabase_realtime`, asegurarse de que están incluidas:
   - `public.parking_alerts`
   - `public.alert_reservations`
   - `public.messages`
   - `public.user_locations`

Si la migración ya ejecutó `ALTER PUBLICATION supabase_realtime ADD TABLE ...`, las tablas estarán incluidas. Si aparece error "already member", las tablas ya estaban añadidas.

La app se suscribe a estas tablas para actualizaciones en tiempo real.
