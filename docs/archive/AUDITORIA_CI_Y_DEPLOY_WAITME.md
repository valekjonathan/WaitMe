# Auditoría CI y Deploy — WaitMe

**Fecha:** 2025-03-07  
**Objetivo:** Resolver emails de CI failed y Vercel failed; dejar pipeline sólido.

---

## 1. PIPELINE ACTUAL

### GitHub Actions (`.github/workflows/ci.yml`)

| Step | Comando | Estado |
|------|---------|--------|
| Checkout | actions/checkout@v4 | ✓ |
| Setup Node | .nvmrc | ✓ |
| Install | npm install | ✓ |
| Lint | npm run lint | ✓ (29 warnings) |
| Typecheck | npm run typecheck | ✓ |
| Build | npm run build | ✓ |
| Playwright install | npx playwright install --with-deps | ✓ |
| Playwright tests | npx playwright test | ✗ (tests skip en CI) |

### Vercel

- **vercel.json:** framework vite, buildCommand `npm run build`, outputDirectory `dist`
- **Rewrites:** SPA (/(.*) → /index.html)
- **Fallos típicos:** Build (env vars), preview deployment

---

## 2. CAUSA RAÍZ DE LOS EMAILS

### CI failed
- **Antes:** Tests de Playwright fallaban (gap -56px, screenshot diff)
- **Ahora:** Tests con `test.skip(!!process.env.CI)` — 8 tests skipeados en CI
- **Resultado:** CI pasa (29 passed, 8 skipped) pero los problemas están ocultos
- **Emails:** GitHub envía "CI failed" cuando algún job falla; si todos pasan, no debería haber email

### Vercel failed
- **Posibles causas:** Build falla (env vars faltantes), timeout, memory
- **Secrets necesarios:** VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN
- **Vercel:** Debe tener estas env vars en Project Settings → Environment Variables

---

## 3. TESTS CON SKIP (OCULTANDO PROBLEMAS)

| Test | Skip condition | Motivo |
|------|----------------|-------|
| layout-map-create: gap | CI | gap -56px |
| layout-map-create: medidas | CI | gap assert |
| measure-card-nav-gap | CI | gap -56px |
| map-layout: gap | CI | gap -56px |
| create-card-position: screenshot | CI | layout variable |
| create.spec: varios | Home no visible | Login/condición |
| verify-ubicate-button | Home no visible | Login |
| map-shell-unified | Login en curso | Condición |

**Problema:** Los tests de gap se skipean en CI en vez de corregir la geometría.

---

## 4. QUÉ HACE FALLAR EL CI (SI NO HUBIERA SKIP)

- **gapCardNav = -56px** (esperado 14-16 o 19-21)
- **Screenshot diff** en create-card-position (layout variable)
- **Archivos que causan:** Layout (main pb-24), MapViewportShell, MapScreenPanel, Home (min-h-[100dvh])

---

## 5. CÓMO ARREGLAR (NO TAPAR)

1. **Geometría:** Corregir layout para que gap = 15px en viewport CI (iPhone 14)
   - Revisar main pb-24 vs BottomNavLayer
   - MapViewportShell height vs contenido
   - MapScreenPanel paddingBottom

2. **Quitar test.skip:** Cuando la geometría sea correcta, eliminar los skip de CI

3. **Screenshot:** Actualizar snapshot o hacer test más tolerante (pixel diff threshold)

4. **Vercel:** Verificar env vars en dashboard; si build falla, revisar logs

---

## 6. CÓMO DEJAR DE RECIBIR EMAILS

### GitHub
- **Settings → Notifications:** Desactivar "Actions" en Email o configurar solo para failures
- **O:** Arreglar la causa (geometría) para que CI pase sin skip

### Vercel
- **Project Settings → Notifications:** Ajustar qué eventos envían email
- **O:** Arreglar build (env vars, dependencias)

---

## 7. RECOMENDACIONES

1. **Prioridad 1:** Corregir geometría card-nav para gap 15px en CI
2. **Prioridad 2:** Quitar test.skip(!!process.env.CI) de los tests de gap
3. **Prioridad 3:** Revisar Vercel env vars y logs de build
4. **Prioridad 4:** Configurar notificaciones GitHub/Vercel para reducir ruido
