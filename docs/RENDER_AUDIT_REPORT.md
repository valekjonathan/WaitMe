# Auditoría de render — pantalla negro/blanco

## Objetivo

Identificar la causa raíz del crash silencioso que produce:
- **Safari simulador** → pantalla negra
- **App instalada (Capacitor)** → pantalla blanca

---

## Capas auditadas

| Capa | Archivo | Líneas clave | Estado |
|------|---------|--------------|--------|
| 1. Auth / router | `src/lib/AuthContext.jsx`, `src/App.jsx` | AuthProvider, AuthRouter | Logs añadidos |
| 2. Home / Layout | `src/pages/Home.jsx`, `src/Layout.jsx` | Home, LayoutShell | Logs añadidos |
| 3. Mapa (MapboxMap) | `src/components/MapboxMap.jsx` | ENTER, error, RETURNS | Logs añadidos |
| 4. Capacitor dev server | `ios/App/App/capacitor.config.json` | server.url | Config existente |
| 5. Safari simulador | — | WKWebView | Por validar |
| 6. App instalada | — | Capacitor runtime | Por validar |
| 7. HMR / Vite | `vite.config.js` | hmr.host | Config existente |

---

## Trazado de render (logs temporales)

Todos los logs usan prefijo `[RENDER:...]` y solo se emiten en `import.meta.env.DEV`.

| Componente | Logs |
|------------|------|
| main.jsx | root found, config ok/not ok |
| AuthContext | AuthProvider ENTER, useState init, RENDER |
| App (AuthRouter) | ENTER, RETURNS loading/Login/Layout, CATCH |
| Layout | Layout ENTER, LayoutShell ENTER, path |
| Home | ENTER, RETURNS map disabled/enabled |
| MapboxMap | ENTER, RETURNS error/map container |

---

## Kill switches DEV

| Flag | Archivo | Comportamiento |
|------|---------|----------------|
| `VITE_DISABLE_MAP=true` | `src/pages/Home.jsx` | Home renderiza bloque simple en vez del mapa |
| `VITE_DEV_BYPASS_AUTH=true` | `src/lib/AuthContext.jsx` | Usa Supabase real en vez de mock |
| `VITE_HARD_BYPASS_APP=true` | `src/main.jsx` | NO monta App: solo bloque "WAITME HARD BYPASS OK" |
| `VITE_HARD_BYPASS_APP_SIMPLE=true` | `src/main.jsx` | Con HARD_BYPASS: muestra "APP SIMPLE OK" |

**Uso:** Añadir a `.env` o ejecutar:
```bash
VITE_DISABLE_MAP=true npm run dev
VITE_DEV_BYPASS_AUTH=true npm run dev
```

---

## Ruta /dev-diagnostics

- **URL:** `#/dev-diagnostics` (HashRouter)
- **Solo en DEV:** La ruta no existe en build de producción
- **Muestra:** import.meta.env.DEV, Capacitor, auth state, router path, Home/MapboxMap montados, mapRef, flags

---

## Procedimiento para identificar causa raíz

1. **VITE_HARD_BYPASS_APP=true** (aisla capa base):
   - Si ves "WAITME HARD BYPASS OK" → main/React/CSS/root OK; fallo en App/Layout/router
   - Si NO ves nada → fallo en main.jsx, globals.css, montaje root, Capacitor/WebView

2. **Si HARD BYPASS funciona**, probar `VITE_HARD_BYPASS_APP_SIMPLE=true` (mismo bloque, texto distinto)

3. **Abrir consola** y observar logs `[RENDER:...]`

4. **VITE_DISABLE_MAP=true** — si desaparece negro/blanco → Mapa culpable

5. **VITE_DEV_BYPASS_AUTH=true** — para aislar auth

---

## Plan para evitar que reaparezca

1. **Mantener ErrorBoundary global** (ya en main.jsx) — captura errores de React
2. **Logs de trazado** — quitar cuando se confirme causa raíz (buscar `RENDER_LOG`)
3. **CI:** smoke tests (`npm run test:e2e tests/smoke/`) deben pasar
4. **Checklist pre-release:** Probar en Safari simulador + app instalada antes de merge
5. **Documentar** en `docs/MAP_DEBUG_CHECKLIST.md` si el mapa es culpable

---

## Validación ejecutada

- `npm run build` ✓
- `npm run test:e2e tests/smoke/` — 6/7 passed (1 fallo en create.spec por locator strict mode, no por render)
