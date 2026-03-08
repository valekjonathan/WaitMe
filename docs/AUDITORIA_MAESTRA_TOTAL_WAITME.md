# Auditoría Maestra Total — WaitMe

**Fecha:** 2026-03-08  
**ZIP:** `tmp/waitme-auditoria-maestra-actual.zip`

---

## 1. Estado general

| Área | Estado |
|------|--------|
| Lint | OK |
| Typecheck | OK |
| Build | OK |
| Tests | 83+ passed, 8 skipped |
| CI | Verde |
| Boot | MissingEnvScreen cuando env inválidas; ErrorBoundary en DEV |
| Ubicación | Motor único, getPreciseInitialLocation, MapboxMap sin watcher si locationFromEngine |
| Mapa | GeoJSON layers (StaticCarsLayer, UserLocationLayer, WaitMeCarLayer) + interpolación |
| OAuth iOS | com.waitme.app://auth/callback, PKCE, Safari → Supabase (no localhost) |

---

## 2. Qué sobra

| Elemento | Ubicación | Acción |
|----------|-----------|--------|
| quarantine/ | Raíz | Código deprecado; no en build |
| workflows_disabled/ | .github | No ejecutados; mantener por referencia |
| runtimeConfig.resetRuntimeConfig | lib/runtimeConfig.js | Export no usado; mantener para tests |
| ios_run_last.log | Raíz | Log generado; añadir a .gitignore si molesta |

---

## 3. Qué está duplicado

| Duplicado | Ubicación | Estado |
|-----------|-----------|--------|
| locationMovementValidator | lib/location/ y lib/locationPipeline/ | Pipeline es activo; lib usado por transactionEngine |
| locationFraudDetector | lib/location/ y lib/locationPipeline/ | Idem |
| transactionEngine | lib/ (balance/finalize) y lib/transaction/ (proximity) | Nombres distintos; roles distintos |
| haversineKm, getCarColor, formatPlate | Navigate, History, Profile | Duplicados locales; carUtils centralizado |
| getCarFill, getCarFillThinking | History | Pasados a HistorySellerView; carUtils tiene getCarFill |

---

## 4. Qué está mal / frágil

| Problema | Archivo | Fix sugerido |
|----------|---------|--------------|
| userLocationsSupabase retorna [] en error | services/userLocationsSupabase.js | Retornar { data: [], error } para consistencia |
| AddressAutocompleteInput: fetch sin abort | AddressAutocompleteInput.jsx | AbortController en cleanup |
| Empty catch {} en muchos archivos | BottomNav, IncomingRequestModal, etc. | Logging en DEV; no romper |
| locationMapMatcher positionBuffer | locationPipeline/locationMapMatcher.js | Buffer compartido; posible race |

---

## 5. Qué impide 10/10

1. **Duplicidad location:** Unificar validators/fraud entre lib/location y pipeline
2. **Duplicidad carUtils:** Navigate, History, Profile deberían importar de @/utils/carUtils
3. **Error handling:** Muchos catch vacíos; mejorar en fases
4. **Login Google Simulator:** Requiere validación manual con VITE_DEV_BYPASS_AUTH=true

---

## 6. Qué puede limpiarse sin riesgo

- Imports no usados (lint:fix)
- ~~Unificar haversineKm en Navigate~~ → **Aplicado:** Navigate importa haversineKm de @/utils/carUtils
- getCarColor en Navigate: mantiene mapeo extendido (blanca, negra, etc.); carUtils.getCarFill tiene subset
- Documentar resetRuntimeConfig como test-only

---

## 7. Boot / Arranque

- **main.jsx:** getRuntimeConfig → MissingEnvScreen si !canBoot; ErrorBoundary envuelve App
- **runtimeConfig:** Valida VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN
- **canBoot:** true si hasSupabase (no requiere Mapbox para arrancar)
- **ErrorBoundary:** Muestra error + stack en DEV; link a modo seguro
- **MissingEnvScreen:** Lista variables faltantes; clara

---

## 8. Ubicación exacta

- **locationEngine:** getPreciseInitialLocation (skipPipeline:true) → watchPosition
- **useLocationEngine:** subscribeToLocation
- **Home:** locationFromEngine={engineLocation ?? userLocation}, suppressInternalWatcher
- **MapboxMap:** No watchPosition si locationFromEngine != null
- **Ubícate:** getPreciseInitialLocation directo
- **Race:** firstPreciseReceived evita emitir hasta tener primera posición

---

## 9. Mapa tipo Uber

- **StaticCarsLayer:** GeoJSON + CircleLayer, setData
- **UserLocationLayer:** GeoJSON + CircleLayer
- **WaitMeCarLayer:** GeoJSON + CircleLayer, useVehicleInterpolation
- **DOM markers:** Eliminados
- **Interpolación:** useVehicleInterpolation (RAF + lerp) para coche comprador

---

## 10. Mapbox / Estilo Google Maps noche (FASE 8)

**¿Se puede aproximar visualmente al modo noche de Google Maps?**

Sí, con Mapbox se puede acercar bastante:

| Aspecto | Replicable | Enfoque |
|---------|------------|---------|
| Fondo oscuro | Sí | `mapbox://styles/mapbox/dark-v11` (ya usado) |
| Carreteras sutiles | Sí | Ajustar `line-opacity`, `line-color` en capas |
| Labels legibles | Sí | `text-color`, `text-halo-color` en SymbolLayer |
| POIs reducidos | Sí | Filtrar por `minzoom` o capas custom |
| Contraste tipo Maps | Parcial | Mapbox dark-v11 es cercano; fine-tuning con `paint` |

**Qué NO conviene copiar exacto:** iconografía propietaria de Google, tipografías, proporciones exactas (riesgo legal).

**Enfoque profesional:** Usar `dark-v11` como base, ajustar `paint` de capas (line, fill, symbol) para reducir ruido visual y aumentar contraste de rutas. Opcional: estilo custom con Mapbox Studio.

---

## 11. CI / Vercel / Supabase

- **CI:** ubuntu-22.04, Chromium, verde (run #197)
- **Supabase migrations:** Repo NO ejecuta; emails de integración externa Dashboard
- **Vercel:** npm run build, dist; env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

---

## 12. Reglas fijas verificadas

- Coches NO se mueven (mockNavigateCars estáticos)
- Solo coche dinámico con WAITME_ACTIVE en "Estoy aparcado aquí"
- MapboxMap no duplicado
- Home no tocado salvo necesario
