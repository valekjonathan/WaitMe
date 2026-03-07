# Tests Skipped — Justificación Técnica

Documento de referencia para los tests que se ejecutan condicionalmente o se omiten.

---

## Resumen (ejecución local `npm run test`)

| Tipo | Cantidad | Archivo(s) | Motivo |
|------|----------|------------|--------|
| Safe Mode (suite condicional) | 6 | smoke/safe-mode.spec.js | Requieren `VITE_SAFE_MODE=true`. Ejecutar: `npm run test:safe-mode` |
| Ubícate / __WAITME_MAP__ | 2 | layout-map-create.spec.js:125 | Mapbox no expone `__WAITME_MAP__` en headless WebKit/Chromium |

**Total: 8 tests skipped** en `npm run test` estándar.

**Para ejecutar todos:** `npm run test:all` (incluye safe-mode en segundo paso).

---

## 1. Skips por CI (geometría)

**Archivos:** `tests/layout/map-layout.spec.js`, `tests/layout-map-create.spec.js`, `tests/visual/measure-card-nav-gap.spec.js`

| Archivo | Línea | Test | Motivo |
|---------|-------|------|--------|
| layout/map-layout.spec.js | 54 | gap tarjeta / menú inferior = 15px ±1 | Geometría card-nav variable en viewport CI |
| layout/map-layout.spec.js | 61 | pin centrado entre header y tarjeta ±2px | Pin/overlay no fiables en webkit-mobile CI |
| layout-map-create.spec.js | 64 | gap entre tarjeta y menú inferior | Idem |
| layout-map-create.spec.js | 74 | punta del pin en centro esperado ± 2px | Idem |
| layout-map-create.spec.js | 86 | medidas completas registradas | Idem |
| layout-map-create.spec.js | 105 | botones de zoom están 5px más arriba | Zoom controls no visibles en webkit-mobile CI |
| layout-map-create.spec.js | 120 | Ubícate ejecuta geolocalización | Geoloc real no fiable en headless |
| measure-card-nav-gap.spec.js | 11 | medir gap real cardBottom vs navTop | Describe completo skip en CI |

**Justificación:** En CI (Chromium headless, viewport 390x844) la geometría renderizada puede diferir de local (WebKit Simulator, etc.). Los asserts pixel-perfect (15±1px, pin ±2px) fallan de forma intermitente. Mantener skip evita falsos negativos; validar layout en local.

---

## 2. Skip por CI (Mapbox/Realtime)

| Archivo | Línea | Test | Motivo |
|---------|-------|------|--------|
| map.spec.js | 38 | realtime no rompe la app | Mapbox + Realtime pueden disparar ErrorBoundary en headless WebKit |

**Justificación:** WebGL/Mapbox y Supabase Realtime tienen comportamiento distinto en headless. Verificar localmente.

---

## 3. Skip por CI (screenshot)

| Archivo | Línea | Test | Motivo |
|---------|-------|------|--------|
| create-card-position.spec.js | 38 | screenshot: tarjeta create + menú inferior | Layout variable en CI para toHaveScreenshot |

**Justificación:** Comparación visual requiere viewport y render estables. En CI el layout puede variar.

---

## 4. Safe Mode (suite condicional)

| Archivo | Línea | Test | Motivo |
|---------|-------|------|--------|
| smoke/safe-mode.spec.js | 12 | SAFE MODE carga y muestra shell | Requiere VITE_SAFE_MODE=true |
| smoke/safe-mode.spec.js | 24 | no hay pantalla blanca en SAFE MODE | Idem |
| smoke/safe-mode.spec.js | 36 | ruta /dev-diagnostics carga en SAFE MODE | Idem |

**Justificación:** La suite Safe Mode valida el shell mínimo cuando Supabase/Mapbox están deshabilitados. Solo tiene sentido con `VITE_SAFE_MODE=true`.

**Ejecutar:**
```bash
npm run test:safe-mode
```

---

## Ejecución completa (sin skips por CI)

Para ejecutar todos los tests incluyendo los que se omiten en CI:

```bash
# Sin CI (p. ej. en terminal local sin CI=1)
CI= npm run test

# O explícitamente
env -u CI npm run test
```

---

## Referencias

- `playwright.config.js` — `testIgnore`, `projects`, `webServer`
- `docs/SAFE_CHANGE_PROTOCOL.md` — Protocolo de cambios
- `docs/CI_FAILURES_ROOT_CAUSE_FIXED.md` — Histórico de skips por geometría
