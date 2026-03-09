# Plan de Arreglo — WaitMe

**Fecha:** 2026-03-09  
**Basado en:** AUDITORIA_FORENSE_TOTAL_WAITME.md

---

## ORDEN EXACTO DE ARREGLO

### Fase 1 — Auth (prioridad máxima)

**Por qué primero:** Si auth falla, el usuario no llega a Home. Arreglar auth puede hacer que "Home no se ve" desaparezca sin tocar Home.

| # | Tarea | Qué tocar | Qué no tocar | Validación |
|---|-------|-----------|--------------|------------|
| 1.1 | Verificar NSLocalNetworkUsageDescription en Info.plist | ios/App/App/Info.plist | Resto | Buscar clave; si falta, añadir |
| 1.2 | Añadir timeout a exchangeCodeForSession | oauthCapture.js | AuthContext, App | Si >10s sin respuesta, log y fallback |
| 1.3 | Tras exchange, esperar 100ms antes de ensureUserInDb | AuthContext checkUserAuth(overrideSession) | oauthCapture | Dar tiempo a setSession a actualizar headers |
| 1.4 | Si ensureUserInDb falla con 401, reintentar con delay | AuthContext | - | Retry 1 vez tras 500ms |

**Validación Fase 1:** Login Google en Simulator → debe entrar a Home. Repetir 5 veces; debe ser estable.

---

### Fase 2 — Home (solo si Fase 1 ok)

**No tocar Home hasta que auth funcione de forma estable.**

| # | Tarea | Qué tocar | Qué no tocar | Validación |
|---|-------|-----------|--------------|------------|
| 2.1 | Confirmar que Layout da altura a Home | Layout.jsx | Home.jsx | Inspeccionar en devtools: main > div > Home con height > 0 |
| 2.2 | Si overlay no visible, añadir minHeight explícito al contenedor Home | Home.jsx contenedor | HomeHeader, MapboxMap | Overlay con min-h-[200px] temporal para debug |
| 2.3 | Remover marcador WAITME BUILD TEST de producción | Home.jsx, vite.config | - | Solo mostrar si VITE_IOS_DEV_BUILD=1 |

**Validación Fase 2:** Con auth ok, llegar a Home. Ver logo, frases, botones. Sin build marker en build normal.

---

### Fase 3 — Simulador / Build

| # | Tarea | Qué tocar | Qué no tocar | Validación |
|---|-------|-----------|--------------|------------|
| 3.1 | Añadir debounce a chokidar (evitar múltiples ios:refresh) | package.json dev:auto | ios-refresh.sh | chokidar con --debounce 2000 |
| 3.2 | Documentar en README: "Para ver cambios en Simulator, ejecutar npm run start y dejar abierto" | README o docs | - | Usuario sigue instrucción |
| 3.3 | Verificar que ios:refresh resuelve target en todas las máquinas | ios-refresh.sh | - | Probar en Mac sin iPhone 16e |

**Validación Fase 3:** npm run start, cambiar archivo, esperar. Simulador debe reinstalar y abrir app nueva.

---

### Fase 4 — Limpieza

| # | Tarea | Qué tocar | Qué no tocar | Validación |
|---|-------|-----------|--------------|------------|
| 4.1 | Actualizar INVENTARIO_ENTORNO_WAITME.md | docs | - | Scripts correctos |
| 4.2 | Reducir logs AUTH TRACE a solo VITE_DEBUG_OAUTH | oauthCapture, AuthContext, App | - | Logs no en producción |
| 4.3 | Consolidar scripts ios: (opcional) | package.json | - | Menos redundancia |

---

## QUÉ NO TOCAR AÚN

- MapboxMap (mapa funciona si token ok)
- Login.jsx (flujo OAuth correcto)
- useHome, useHomeMapState (lógica compleja)
- capacitor.config.ts
- supabaseClient.js (storage Capacitor correcto)

---

## CÓMO VALIDAR CADA PASO

1. **Auth:** Login Google → Home. 5 repeticiones.
2. **Home:** Logo, frases, botones visibles.
3. **Simulador:** Cambio en src/ → ios:refresh → app nueva.
4. **iPhone:** ios:auto → app carga desde Mac → live reload al cambiar.

---

## QUÉ NO VOLVER A ROMPER

- No quitar cold start check en App.jsx
- No quitar setSession workaround en oauthCapture
- No quitar checkUserAuth(overrideSession)
- No cambiar flowType: 'pkce' en supabaseClient
- No quitar ALLOWED_PREFIXES en oauthCapture
