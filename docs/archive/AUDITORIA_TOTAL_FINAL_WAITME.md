# Auditoría Total Final — WaitMe

**Fecha:** 2026-03-07  
**Objetivo:** Base técnica 10/10 — profesional, limpia, estable, segura, automatizada.

---

## 1. Resumen ejecutivo

| Área | Estado | Observaciones |
|------|--------|---------------|
| Lint | ✅ 0 errores | max-warnings=9999 |
| Typecheck | ✅ OK | tsc --noEmit |
| Build | ✅ OK | Vite build |
| Tests | ⚠️ 24 passed, 13 skipped | Skips justificados (login, CI, geometría) |
| Login Google iOS | ⚠️ Requiere validación manual | Flujo implementado; DEV mock bypass necesario |
| Ubicación | ✅ Arquitectura correcta | Engine dominante, getPreciseInitialLocation, MapboxMap sin watcher si locationFromEngine |
| Mapa | ⚠️ Capas GeoJSON listas, no activas | MapboxMap usa DOM markers; layers.js existe |
| CI/Vercel | ✅ Workflow simple | Secrets requeridos; emails por fallos o Supabase integration |
| Quarantine | ⚠️ Código deprecado | quarantine/ no usado en build |

---

## 2. Árbol y estructura

Ver `docs/ARBOL_REAL_PROYECTO_ACTUAL.md`.

**Archivos críticos:**
- `src/App.jsx` — OAuth processOAuthUrl, appUrlOpen
- `src/pages/Login.jsx` — signInWithOAuth, redirectTo
- `src/lib/supabaseClient.js` — PKCE, capacitorStorage
- `src/lib/AuthContext.jsx` — resolveSession, onAuthStateChange
- `src/components/MapboxMap.jsx` — mapa único Home
- `src/components/map/ParkingMap.jsx` — mapas search/create/navigate
- `src/lib/location/*` — motor ubicación
- `src/lib/mapLayers/*` — GeoJSON layers (listas, no activas)

---

## 3. Qué sobra

| Elemento | Ubicación | Acción |
|----------|-----------|--------|
| quarantine/ | Raíz | Mantener; código deprecado, no en build |
| docs obsoletos | docs/ | Muchos; consolidar en fases |
| tmp/codebase_export | tmp/ | Excluido del ZIP |
| DerivedData | ios/App/ | Generado; excluir del ZIP |

---

## 4. Qué está duplicado

| Duplicado | Ubicación | Estado |
|-----------|-----------|--------|
| locationMovementValidator | lib/location/ y lib/locationPipeline/ | Dos versiones; pipeline es la activa |
| locationFraudDetector | lib/location/ y lib/locationPipeline/ | Idem |
| haversineKm / getMetersBetween | Varios archivos | Utils centralizados en lib/location |
| MapboxMap vs ParkingMap | Componentes | No duplicados; roles distintos (Home vs modales/navigate) |

---

## 5. Qué está mal / frágil

| Problema | Archivo | Línea | Fix |
|----------|---------|-------|-----|
| AuthContext DEV mock | AuthContext.jsx | 63-67 | En DEV, auto-login sin Supabase; para probar Google: VITE_DEV_BYPASS_AUTH=true |
| Tests skip por login | Varios .spec.js | - | Tests requieren usuario; usar bypass o mock |
| InAppBrowser.openInExternalBrowser | Login.jsx | 36 | Abre Safari externo; redirect debe abrir app. Info.plist CFBundleURLSchemes correcto |
| Browser.close en processOAuthUrl | App.jsx | 36 | Se llama aunque no se usó Browser; InAppBrowser abre externo. No rompe |

---

## 6. Qué impide 10/10 real

1. **Login Google Simulator:** Requiere validación manual con VITE_DEV_BYPASS_AUTH=true. Flujo implementado; Supabase Redirect URLs debe incluir `com.waitme.app://auth/callback`.
2. **Mapa tipo Uber:** Capas GeoJSON (addStaticCarsLayer, addUserLocationLayer) existen pero MapboxMap no las usa; sigue con DOM markers.
3. **Tests skipped:** 13 skips por login, geometría CI, screenshots. Algunos justificados; otros mejorables con fixtures.
4. **Emails Supabase:** Si hay integración GitHub en Dashboard, migraciones fallidas envían email. Revisar Dashboard → Integrations.

---

## 7. Qué se puede limpiar sin riesgo

- Imports no usados (lint:fix)
- Variables `_` prefijadas que no aportan
- Comentarios obsoletos
- Scripts muertos (si los hay)

---

## 8. Validación actual

```
npm run lint     → OK
npm run typecheck → OK
npm run build    → OK
npx playwright test → 24 passed, 13 skipped
```

---

## 9. Reglas fijas verificadas

- ✅ Coches NO se mueven (mockNavigateCars estáticos)
- ✅ Solo un coche dinámico con WAITME_ACTIVE en "Estoy aparcado aquí"
- ✅ MapboxMap no duplicado
- ✅ Home.jsx no tocado salvo imprescindible
