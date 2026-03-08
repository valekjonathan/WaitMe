# Auditoría exhaustiva del repositorio WaitMe

**Fecha:** 2025-03  
**Herramienta:** Knip + análisis manual

---

## 1. Archivos muertos (no importados)

| Archivo | Acción recomendada |
|---------|---------------------|
| `src/App.css` | Vacío. Eliminar. |
| `src/store/` | Carpeta vacía. Eliminar. |
| `src/components/ErrorBoundary.jsx` | Duplicado de main.jsx. Mover a quarantine. |
| `src/components/cards/ActiveAlertCard.jsx` | No importado. Mover a quarantine. |
| `src/components/UserNotRegisteredError.jsx` | No importado. Mover a quarantine. |
| `src/hooks/useAlertsQuery.js` | No importado. Mover a quarantine. |
| `src/hooks/useMapMatch.js` | No importado. Mover a quarantine. |
| `src/hooks/useDebouncedSave.js` | No importado. Mover a quarantine. |
| `src/hooks/use-mobile.jsx` | No importado. Mover a quarantine. |
| `src/lib/logger.js` | No importado. Mover a quarantine. |
| `src/lib/PageNotFound.jsx` | No importado. Mover a quarantine. |
| `src/lib/query-client.js` | No importado. Mover a quarantine. |
| `src/lib/maps/carUtils.js` | No importado. Mover a quarantine. |
| `src/lib/maps/mapConstants.js` | No importado. Mover a quarantine. |
| `src/lib/maps/mapMarkers.js` | No importado. Mover a quarantine. |
| `src/pages.config.js` | No importado. Mover a quarantine. |
| `src/services/alertService.js` | Solo usado por useAlertsQuery (muerto). Mover a quarantine. |

**UI components (shadcn):** Knip marca muchos como "unused" pero forman parte del design system. NO eliminar. Mantener por si se usan en el futuro o en Storybook.

---

## 2. Dependencias potencialmente muertas

**No eliminar sin verificar:** Muchas son peer de Radix/UI. Verificar uso real antes de borrar.

| Dependencia | Estado |
|-------------|--------|
| `@capacitor/ios` | Usado por Capacitor. Mantener. |
| `@hello-pangea/dnd` | Verificar si hay drag-and-drop. |
| Radix (accordion, alert-dialog, etc.) | Usados por shadcn. Mantener. |
| `cmdk`, `embla-carousel`, `input-otp` | Verificar. |
| `next-themes` | Verificar. |
| `react-day-picker`, `react-hook-form` | Verificar. |
| `recharts`, `sonner`, `vaul`, `zod` | Verificar. |

**DevDependencies:** `@vitest/coverage-v8`, `baseline-browser-mapping`, `eslint-plugin-react-refresh`, `supabase` — evaluar si se usan.

---

## 3. Exports muertos

Ver informe Knip. Los más relevantes: DemoFlowManager (muchos exports demo), badgeVariants, buttonVariants, varios de dialog/select/use-toast. Mantener por compatibilidad con UI.

---

## 4. Backups / restos a eliminar

| Elemento | Acción |
|----------|--------|
| `ios__backup*` | Ya en .gitignore. No existe en repo. |
| `DerivedData` | Ya en .gitignore. |
| `ios_run_last.log` | 1MB. Añadir a .gitignore. Eliminar del repo si está trackeado. |
| `storybook-static/` | Build output. Ya en .gitignore. |
| `playwright-report/`, `test-results/` | Ya en .gitignore. |
| `force-sync.txt` | Verificar propósito. |

---

## 5. Código temporal de debugging

| Ubicación | Código | Acción |
|-----------|--------|--------|
| `src/main.jsx` | RENDER_LOG | Mantener en DEV. Opcional: envolver en flag. |
| `src/Layout.jsx` | RENDER_LOG | Idem. |
| `src/pages/Home.jsx` | RENDER_LOG, __DEV_DIAG | Idem. |
| `src/components/MapboxMap.jsx` | RENDER_LOG, __DEV_DIAG | Idem. |
| `src/lib/AuthContext.jsx` | RENDER_LOG | Idem. |

**Recomendación:** Mantener RENDER_LOG solo si `import.meta.env.DEV`. Ya está así. Documentar que son para diagnóstico.

---

## 6. Flags DEV actuales

| Flag | Archivo | Propósito |
|------|---------|-----------|
| `VITE_DISABLE_MAP` | Home.jsx | Kill switch mapa |
| `VITE_DEV_BYPASS_AUTH` | AuthContext.jsx | Bypass auth mock |
| `VITE_HARD_BYPASS_APP` | main.jsx | Bypass App completo |
| `VITE_HARD_BYPASS_APP_SIMPLE` | main.jsx | Variante del bypass |

**A consolidar con:** VITE_SAFE_MODE, VITE_DISABLE_REALTIME (nuevos).

---

## 7. Recomendaciones por prioridad

### Alta
1. Crear `quarantine/` y mover archivos muertos.
2. Eliminar `src/App.css` (vacío) y `src/store/` (vacío).
3. Implementar SAFE MODE y ruta /dev-diagnostics.
4. Añadir ErrorBoundary + window.onerror + unhandledrejection.
5. Añadir `ios_run_last.log` a .gitignore.

### Media
6. Consolidar flags DEV.
7. Scripts audit:repo, check:fast, dev:safe.
8. Tests smoke para safe mode y diagnostics.

### Baja
9. Revisar dependencias con depcheck o similar.
10. Limpiar exports no usados (con cuidado).

---

## 8. Root cause del fallo blanco/negro (histórico)

**Error detectado en iOS Simulator:** `null is not an object (evaluating 'dispatcher.useCallback')`

**Stack:** useCallback → useStore → useRealtimeAlerts → Layout.jsx

**Causa:** Zustand `useAppStore()` invocado cuando el React dispatcher no estaba listo en WebKit.

**Fix aplicado:** Uso correcto del hook con selectores en top-level. `VITE_DISABLE_REALTIME` para desactivar la capa si persiste.

---

## 9. Plan para no volver a romper a ciegas

1. **SAFE MODE:** `VITE_SAFE_MODE=true` o `npm run dev:safe` — shell mínima siempre carga.
2. **Diagnóstico:** `/dev-diagnostics` muestra estado de capas y últimos errores.
3. **Error capture:** `window.__WAITME_DIAG__` guarda onerror + unhandledrejection + ErrorBoundary.
4. **Scripts:** `audit:repo`, `check:fast`, `dev:safe`.
5. **Tests:** smoke/load, smoke/safe-mode, smoke/diagnostics.
6. **Antes de merge:** `npm run check:fast` debe pasar.
