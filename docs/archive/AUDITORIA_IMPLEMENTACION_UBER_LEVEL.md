# Auditoría: Implementación Nivel Uber/Airbnb

## Qué se hizo

### A) Estabilidad Auth + Perfil
- **AuthContext**: `refreshProfile()`, `profile` nunca null (fallback `{}`), `profile: profile ?? {}` en context
- **Guards**: `useProfileGuard` usa `profile` (persistido), mensaje dinámico con campos faltantes
- **Profile.jsx**: formData local, debounce 750ms, guardado inmediato en handleBack, sin guardar en cleanup

### B) Mapbox Premium + Realtime
- **MapboxMap.jsx**: carga alertas desde `parking_alerts` (Supabase), pinta en `parking_alerts_layer`
- **Realtime**: suscripción a INSERT/UPDATE/DELETE en `parking_alerts`, actualiza GeoJSON en vivo
- **Migración**: `20260304160000_enable_realtime_parking_alerts.sql` añade tabla a publicación

### C) Map Matching
- **Edge Function** `supabase/functions/map-match`: recibe puntos, llama Mapbox Matching API con `MAPBOX_SECRET_TOKEN`
- **Cliente** `useMapMatch.js`: buffer 10s, llama cada 5s, fallback a GPS crudo si falla
- **MapboxMap**: usa `corrected` cuando existe, sino `userPosition`

### D) Geo-index
- **Migración** `20260304170000_add_geohash_parking_alerts.sql`: columna `geohash`, índice compuesto
- **alertService**: `createAlert` calcula geohash (precision 7), `getActiveAlertsNear(lat, lng, radiusKm)`
- **ngeohash**: librería para encode

### E) Cache React Query
- **useAlertsQuery.js**: `useActiveAlertsQuery`, `useActiveAlertsNearQuery`, `useCreateAlertMutation`, `useReserveAlertMutation`, `useCloseAlertMutation`
- Invalidación en mutations; Realtime como principal

### F) Logging Sentry
- **main.jsx**: `Sentry.init` si `VITE_SENTRY_DSN`
- **ErrorBoundary**: `Sentry.captureException` en `componentDidCatch`
- **logger.js**: `logger.info`, `logger.warn`, `logger.error` con breadcrumbs

### G) Automatización
- **docs/PROD_READY.md**: setup, variables, deploy sin UI
- **GitHub Actions**: lint + build en push a main (ya existía)

### H) iOS Simulator
- **capacitor.config.ts**: `server.url` solo cuando `CAPACITOR_USE_DEV_SERVER=true`
- **dev:ios**: usa la variable; sin ella, app usa bundled (dist/) → no pantalla blanca

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Map-match Edge Function no desplegada | Fallback a GPS crudo en cliente |
| Realtime no habilitado en Supabase | Migración lo añade; verificar en dashboard |
| geohash null en filas antiguas | `getActiveAlertsNear` usa OR; filas sin geohash no matchean prefijos |
| Sentry sin DSN | Init no se ejecuta; app funciona igual |
| IP 192.168.0.10 distinta | `CAPACITOR_DEV_SERVER` env override |

---

## Checklist de pruebas

### 1. Auth + Perfil
- [ ] Login con OAuth
- [ ] Recargar página → profile no se vacía
- [ ] Editar perfil en Profile.jsx → guardar → back → datos persisten
- [ ] Perfil incompleto → intentar crear alerta → mensaje "Faltan: X, Y"

### 2. Mapa
- [ ] Abrir app con mapa (showBackgroundMap o modo search)
- [ ] Sin token Mapbox → mensaje "Configura VITE_MAPBOX_TOKEN"
- [ ] Con token → mapa carga, marcador usuario, círculo accuracy

### 3. Realtime Alertas
- [ ] Crear alerta en Supabase (insert manual o vía app)
- [ ] Mapa actualiza sin recargar

### 4. Map Matching
- [ ] Con Edge Function desplegada: moverse → marcador corregido
- [ ] Sin Edge Function: fallback a GPS crudo (sin error)

### 5. iOS Simulator
- [ ] `npm run build && npx cap sync ios && npx cap run ios` → app carga sin blanco
- [ ] `npm run dev:ios` → Vite + simulador, app carga desde localhost

### 6. Sentry
- [ ] Con VITE_SENTRY_DSN: provocar error → aparece en Sentry
- [ ] Sin DSN: app funciona
