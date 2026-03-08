# Auditoría Final WaitMe — Post-Migración Base44 → Supabase

**Fecha:** 2025-03-05  
**Objetivo:** Confirmar eliminación total de Base44, arquitectura correcta, Supabase completo, CI/CD blindado y automatización máxima.

---

## A) Migración Base44 — Pruebas de eliminación

### A.1 Grep de referencias restantes

| Ubicación | Tipo | Acción |
|-----------|------|--------|
| `docs/*.md` | Documentación histórica | Solo menciones en contexto de migración; no código ejecutable |
| `src/data/*.js` | Comentarios | "Sustituye base44..." — informativo |
| `src/services/*.js` | Comentarios | "Sustituye base44..." — informativo |
| `supabase/migrations/*.sql` | Comentario | "migración desde base44" — histórico |

**Resultado:** No hay imports, llamadas ni dependencias de Base44 en código ejecutable. Solo documentación y comentarios históricos.

### A.2 Módulos eliminados

- `src/api/base44Client.js` — ELIMINADO
- `src/api/entities.js` — ELIMINADO
- `src/api/integrations.js` — ELIMINADO
- `src/lib/app-params.js` — ELIMINADO
- `@base44/sdk` — ELIMINADO de package.json
- `@base44/vite-plugin` — ELIMINADO de vite.config.js
- `VITE_BASE44_*` — ELIMINADO de .env.example

### A.3 Data-layer coverage

| Adapter | Provider | Páginas que lo usan |
|---------|----------|---------------------|
| `@/data/alerts` | alertsSupabase | Home, History, Chats, Navigate, Notifications, HistoryBuyerView, HistorySellerView, IncomingRequestModal, ActiveAlertCard, SellerLocationTracker, WaitMeRequestScheduler |
| `@/data/chat` | chatSupabase | Home, Chats, Chat, Navigate, HistoryBuyerView, IncomingRequestModal |
| `@/data/transactions` | transactionsSupabase | Home, History, Navigate |
| `@/data/notifications` | notificationsSupabase | Home, Chats, Notifications |
| `@/data/uploads` | uploadsSupabase | Chat |
| `@/data/profiles` | profilesSupabase | NotificationSettings |
| `@/data/userLocations` | userLocationsSupabase | SellerLocationTracker |

**Regla:** Todas las páginas importan desde `@/data/*`. Ninguna importa desde `@/services/*` directamente.

---

## B) Arquitectura

### B.1 Diagrama

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGES (src/pages/)                        │
│  Home, History, Chats, Chat, Navigate, Notifications, etc.      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ import * as X from '@/data/X'
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ADAPTERS (src/data/)                      │
│  alerts.js, chat.js, transactions.js, notifications.js,         │
│  uploads.js, profiles.js, userLocations.js                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ import * from '@/services/*Supabase'
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICES (src/services/)                         │
│  alertsSupabase, chatSupabase, transactionsSupabase,            │
│  notificationsSupabase, uploadsSupabase, profilesSupabase,       │
│  userLocationsSupabase                                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │ getSupabase()
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + Realtime + Storage)     │
└─────────────────────────────────────────────────────────────────┘
```

### B.2 Reglas

1. **Pages → data:** Las páginas y componentes importan únicamente desde `@/data/*`.
2. **Data → services:** Los adapters reexportan funciones de `@/services/*Supabase`.
3. **Nunca:** Importar `@/services/*` en páginas o componentes de UI.
4. **Nunca:** Llamar a Base44 ni a Supabase directamente desde páginas.

---

## C) Supabase — Inventario

### C.1 Tablas

| Tabla | Columnas clave | Índices | Realtime |
|-------|----------------|---------|----------|
| `profiles` | id, email, full_name, notifications_enabled, notify_* | PK(id) | No |
| `parking_alerts` | id, seller_id, lat, lng, price_cents, status, geohash, metadata, reserved_by | idx_seller, idx_geohash_status, idx_status | Sí |
| `alert_reservations` | id, alert_id, buyer_id, status | idx_alert_id, idx_buyer_id, idx_status | Sí |
| `conversations` | id, alert_id, buyer_id, seller_id | idx_buyer, idx_seller | No |
| `messages` | id, conversation_id, sender_id, body | idx_conversation_created | Sí |
| `transactions` | id, buyer_id, seller_id, alert_id, amount, status | idx_buyer, idx_seller, idx_alert, idx_created | No |
| `user_locations` | user_id (PK), lat, lng | idx_updated_at | Sí |
| `user_location_updates` | id, user_id, alert_id, lat, lng, is_active | idx_alert_id, idx_alert_active | Sí |
| `notifications` | id, user_id, type, title, message, metadata, is_read | idx_user_id, idx_user_read, idx_created | Sí |

### C.2 RLS por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | own | own | own | — |
| parking_alerts | all | own | own | own |
| alert_reservations | buyer/seller | buyer | buyer/seller | — |
| conversations | buyer/seller | buyer/seller | buyer/seller | — |
| messages | in conversation | sender in conv | — | — |
| transactions | buyer/seller | buyer/seller | buyer/seller | — |
| user_locations | all | own | own | — |
| user_location_updates | all | own | own | — |
| notifications | own | any | own | — |

### C.3 Storage

| Bucket | Público | Límite | Tipos | RLS |
|--------|---------|--------|-------|-----|
| uploads | Sí | 10MB | jpeg, png, gif, webp, pdf, mp4, webm | INSERT/DELETE: authenticated; SELECT: public |

---

## D) CI/CD

### D.1 Workflows

| Workflow | Trigger | Jobs | Concurrency |
|----------|---------|------|-------------|
| **CI** | push/PR a main | Lint, Typecheck, Tests, Contract tests, Build | ci-$ref, cancel-in-progress |
| **Supabase** | workflow_run CI success, o manual | migrations_test, migrate | supabase-$sha, cancel-in-progress |
| **CodeQL** | push/PR | analyze | — |
| **Dependabot** | — | — | — |

### D.2 Guardrails

- **check_migrations_safety.sh:** Bloquea DROP TABLE, TRUNCATE, DROP SCHEMA, DELETE FROM sin comentario SAFE.
- **migrations_test:** `supabase db reset` desde cero; verifica que existan: profiles, parking_alerts, alert_reservations, conversations, messages, transactions, user_locations, user_location_updates, notifications.
- **migrate:** `supabase db push` solo tras CI exitoso; usa environment `production`.
- **Schema drift:** Tras push, `supabase db diff` falla si hay cambios no reflejados en migraciones.

### D.3 Migraciones

- **No manual:** Las migraciones se aplican automáticamente por el workflow Supabase tras CI en verde.
- **Orden:** Por timestamp en nombre de archivo (20260304...).

---

## E) Riesgos detectados

### P0 (Crítico) — Corregidos

| Riesgo | Estado | Acción |
|--------|--------|--------|
| user_locations sin alert_id | ✅ Corregido | Creada tabla `user_location_updates` con alert_id; getLocationsByAlert implementado |
| SellerLocationTracker siempre vacío | ✅ Corregido | userLocationsSupabase.getLocationsByAlert consulta user_location_updates |

### P1 (Alto)

| Riesgo | Descripción | Acción sugerida |
|--------|-------------|-----------------|
| Buyer no actualiza ubicación | Navigate no llama upsertLocationForAlert; el comprador no envía su posición al vendedor | Añadir geolocation.watchPosition en Navigate y llamar userLocations.upsertLocationForAlert |
| Docs desactualizados | AUDITORIA_ARQUITECTURA, TECH_AUDIT, MIGRATION_STATUS mencionan Base44 como activo | Actualizar o archivar docs obsoletos |

### P2 (Medio)

| Riesgo | Descripción |
|--------|-------------|
| Sourcemaps Sentry | Plugin opcional; requiere SENTRY_AUTH_TOKEN en CI para subir |
| Branch protection | Ver docs/ONE_TIME_GITHUB_CLICKS.md |
| Storage migration local | `supabase db reset` puede fallar en storage policies (permisos); producción suele funcionar |

---

## F) Checklist end-to-end (Preview)

### F.1 Auth y perfil

1. Abrir app en preview (Vercel).
2. Iniciar sesión con OAuth (Google/Apple).
3. Ir a Perfil → editar datos → guardar.
4. Ir a Ajustes → Notificaciones → cambiar toggles.
5. Verificar que no hay errores en consola.

### F.2 Crear alerta (vendedor)

1. En Home, pulsar "Estoy aparcado aquí".
2. Completar formulario (dirección, precio, tiempo).
3. Confirmar publicación.
4. Verificar que aparece en Historial como activa.

### F.3 Comprar alerta (comprador)

1. En Home, modo búsqueda, seleccionar una alerta.
2. Pulsar "Comprar" / "Enviar WaitMe".
3. Confirmar.
4. Verificar que aparece en Historial como reservada.

### F.4 Chat

1. Desde Historial, abrir chat de una reserva activa.
2. Enviar mensaje.
3. Verificar que el mensaje aparece.
4. (Opcional) Adjuntar imagen.

### F.5 Navegación (comprador)

1. Con reserva activa, ir a Navegar.
2. Ver mapa con ruta.
3. Simular acercamiento (si hay tracking).
4. Liberar pago al estar a <5m.

### F.6 Notificaciones

1. Ir a Notificaciones.
2. Ver lista (demo + real si hay).
3. Marcar como leída.
4. Marcar todas como leídas.

### F.7 Prórroga (Chats)

1. En Chats, con conversación de alerta expirada.
2. Solicitar prórroga.
3. Verificar toast de confirmación.

---

## Resumen ejecutivo

- **Base44:** 100% eliminado del código.
- **Arquitectura:** Pages → data → services. Cumplida.
- **Supabase:** 9 tablas, RLS, Realtime, Storage configurados.
- **CI/CD:** Lint, tests, contract tests, build, migrations automáticas.
- **P0:** user_location_updates implementado; getLocationsByAlert funcional.
- **Pendiente P1:** Buyer actualice ubicación en Navigate; actualizar docs obsoletos.
