# Auditoría Maestra — Fix Total WaitMe

**Fecha:** 2026-03-07  
**Objetivo:** Diagnóstico exhaustivo y fixes reales para dejar la app estable.

---

## FASE 0 — SNAPSHOT Y ÁRBOL

- **ZIP:** `tmp/waitme-master-fix-snapshot.zip` (excluye node_modules, dist, .git, etc.)
- **Árbol:** `docs/ARBOL_REAL_PROYECTO_ACTUAL.md`
- **Exploración:** `docs/REPORTE_EXPLORACION_PROYECTO.md`

---

## FASE 1 — LÓGICA Y FLUJO REAL WAITME

### Flujo de negocio

1. **Usuario A** publica alerta (precio, ubicación, tiempo)
2. **Usuario B** la reserva
3. **Usuario B** va hacia la ubicación de A
4. **Proximidad válida y estable** → pago se libera
5. **Usuario B** puede publicar su propia alerta

### Regla fija

- Coches **siempre quietos**
- Solo se mueve un coche si hay WaitMe aceptado y el usuario está en "Estoy aparcado aquí" viendo venir al coche

### Archivos que soportan esta lógica

| Dominio | Archivos |
|--------|----------|
| Alertas | `src/data/alerts.js`, `src/services/alertsSupabase.js` |
| Reservas | `src/data/` (alerts), `alert_reservations` |
| Proximidad / pago | `src/lib/transaction/transactionEngine.js`, `src/hooks/useTransactionMonitoring.js` |
| Ubicación | `src/lib/location/locationEngine.js`, `getPreciseInitialLocation.js` |
| Mapa | `src/components/MapboxMap.jsx`, `ParkingMap.jsx` |
| Coches estáticos | `src/lib/mockNavigateCars.js`, `useArrivingAnimation` (solo en arriving) |

### Estado

- **Bien:** Flujo de alertas, reservas, transacciones, proximidad
- **A medias:** Ubicación (watcher duplicado en MapboxMap cuando locationFromEngine es null)
- **Contradicciones:** Home llama getPreciseInitialLocation y locationEngine también; MapboxMap tiene watcher propio que compite

---

## FASE 2 — BOOT / ARRANQUE

### Flujo actual

1. `main.jsx` → `getRuntimeConfig()` → canBoot (Supabase mínimo)
2. Si !canBoot → `MissingEnvScreen`
3. Si canBoot → `ErrorBoundary` > `AuthProvider` > `App`
4. Error en render → ErrorBoundary muestra "Error cargando WaitMe"

### Archivos

- `src/main.jsx` — bootstrap, SafeMode, bypass, MissingEnvScreen
- `src/lib/runtimeConfig.js` — validación env
- `src/core/ErrorBoundary.jsx` — captura crashes
- `src/diagnostics/MissingEnvScreen.jsx` — env faltantes
- `src/diagnostics/SafeModeShell.jsx` — modo seguro

### Problemas detectados

- **"Error cargando WaitMe":** Proviene de ErrorBoundary cuando un componente hijo lanza. En DEV muestra `error.message` y link a SafeMode.
- **Causa típica:** Env inválidas, Mapbox token placeholder, o crash en primer render (ej. componente que accede a ref null).
- **Fix:** ErrorBoundary ya muestra stack en DEV. Mejorar mostrando `info.componentStack` para localizar componente exacto.

---

## FASE 3 — UBICACIÓN Y MAPA

### Problemas reales

1. **Watcher duplicado:** MapboxMap inicia `getPreciseInitialLocation` + `watchPosition` cuando `locationFromEngine` es null. Pero Home usa locationEngine. Al montar, engineLocation es null → MapboxMap arranca su watcher → **dos watchers activos**.

2. **Home llama getPreciseInitialLocation:** Duplicado con locationEngine.

3. **Formato locationFromEngine:** MapboxMap espera array `[lat, lng]`. useLocationEngine devuelve `[lat, lng]`. OK. Pero conviene soportar también `{lat, lng}` por robustez.

### Fixes aplicados

- MapboxMap: prop `suppressInternalWatcher`. Cuando true, no inicia watcher propio.
- Home: pasar `suppressInternalWatcher={true}`; eliminar useEffect con getPreciseInitialLocation para initialLocation.
- MapboxMap: normalizar locationFromEngine para aceptar array o objeto.

---

## FASE 4 — GOOGLE LOGIN iOS

### Config actual

- **Login.jsx:** redirect `com.waitme.app://` (OAUTH_REDIRECT_CAPACITOR)
- **App.jsx:** processOAuthUrl acepta `capacitor://localhost` y `com.waitme.app://`
- **Info.plist:** CFBundleURLSchemes con `capacitor` y `com.waitme.app`

### Requisito Supabase

- Dashboard → Auth → URL Configuration → Redirect URLs:
  - `capacitor://localhost`
  - `com.waitme.app://`
  - `http://localhost:5173`

### Error típico

- Redirect URL no añadida en Supabase → OAuth no vuelve a la app.
- Fix: Añadir URLs en Supabase Dashboard (manual).

---

## FASE 5 — CI / EMAILS

### Estado CI

- `ci.yml`: lint, typecheck, build, playwright
- Secrets: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN
- Tests: 15 passed, 22 skipped (skips por viewport/geolocation/CI)

### Emails

- **GitHub CI failed:** Secrets vacíos o tests fallidos.
- **Supabase migrations:** Integración GitHub en Supabase Dashboard.
- **Vercel:** Build fallido por env.

### Acciones

- Configurar secrets en GitHub.
- Desactivar notificaciones en Supabase/Vercel si no se desean.

---

## FASE 6–11 — RESUMEN

- **Scroll/drag:** Tests validation excluidos en CI; documentado.
- **Mapa:** Arquitectura en `docs/ARQUITECTURA_MAPA_ESCALABLE_WAITME.md`.
- **Rendimiento:** `docs/AUDITORIA_RENDIMIENTO_DEV_WAITME.md`.
- **Limpieza:** quarantine/, workflows_disabled/ documentados.
