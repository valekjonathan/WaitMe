# Auditoría Emails CI / Vercel / Supabase — Final

**Fecha:** 2026-03-07

---

## 1. CAUSA EXACTA — GitHub CI Failed

### Job que fallaba
- **Workflow:** `.github/workflows/ci.yml`
- **Job:** `build`
- **Paso que fallaba:** `Playwright tests` (step 9)
- **Run:** #195, commit c9c7d221

### Causa raíz
**WebKit en Ubuntu 24.04** — `ubuntu-latest` en GitHub Actions usa Ubuntu 24.04. Playwright WebKit tiene dependencias incompatibles (libicu, libvpx) en Ubuntu 24.04, causando fallos en el step "Install Playwright browsers" o en la ejecución de tests con webkit-mobile.

### Fix aplicado
1. `.github/workflows/ci.yml`: `runs-on: ubuntu-22.04` + `npx playwright install chromium --with-deps`
2. `playwright.config.js`: En CI usa Chromium (viewport 390x844) en vez de WebKit — Chromium estable en runners

### Validación
Tras push, el workflow debe completar en verde. Los pasos Lint, Typecheck, Build ya pasaban; solo Playwright tests fallaba.

---

## 2. SUPABASE MIGRATIONS EMAILS — Origen

### ¿Vienen del repo?
**NO.** El repo NO tiene workflow activo de migraciones.

- `.github/workflows_disabled/supabase.yml` está en carpeta `workflows_disabled/`
- GitHub **solo ejecuta** workflows en `.github/workflows/`
- Los archivos en `workflows_disabled/` **no se ejecutan**

### ¿De dónde vienen entonces?
**Supabase Dashboard → Integrations → GitHub.** Si tienes la integración GitHub conectada al proyecto Supabase, Supabase puede ejecutar migraciones automáticamente al detectar cambios en el repo. Si esas migraciones fallan, Supabase envía el email.

### Cómo desactivar
1. Supabase Dashboard → Project Settings → Integrations
2. Buscar la integración con GitHub
3. Desactivar o eliminar la conexión si no quieres migraciones automáticas

### Confirmación
El repo no dispara migraciones. Si recibes "Supabase Migrations failed", la causa está en la integración externa del Dashboard, no en el código.

---

## 3. VERCEL EMAILS — Origen

### ¿De dónde vienen?
Vercel despliega en cada push a `main` (o la rama configurada). Si el **build** falla, Vercel envía email.

### Causas típicas
1. **Env vars faltantes:** Vercel necesita `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN` en Project Settings → Environment Variables
2. **Build command:** `npm run build` (correcto en vercel.json)
3. **Output:** `dist` (correcto)

### Si CI fallaba, Vercel podía fallar también
Si el build de Vercel usa el mismo código y las mismas env vars, un build que falla en CI podría fallar en Vercel. Pero el build en CI **pasaba** (step 7 success). Así que Vercel normalmente debería construir bien si tiene las env vars.

### Si Vercel sigue fallando
Revisar en Vercel Dashboard → Deployments → último deploy fallido → logs. La causa suele ser:
- Env vars no configuradas
- Límite de build/timeout
- Error de red al instalar dependencias

---

## 4. FLUJO DEV — START DEV Task

### Estado actual
La tarea "START DEV" en `.vscode/tasks.json` ejecuta `npm run dev`.

### ¿Es correcto?
**Sí.** El comando es:
```
npm run dev  →  vite --host --port 5173
```

### Salida esperada
- Vite v6.4.1 ready
- Local: http://localhost:5173/
- Network: http://192.168.0.15:5173/

### runOptions.runOn: "folderOpen"
La tarea se ejecuta al abrir la carpeta. Si ya tienes un dev server en 5173, puede haber conflicto. En ese caso, cerrar el terminal existente antes de abrir el proyecto, o quitar `runOn: "folderOpen"` si no quieres auto-start.

### Procesos duplicados
- Un solo `npm run dev` es correcto
- Playwright usa puerto 5174 por defecto; no choca con 5173
- No hay duplicación de Vite/HMR por defecto

---

## 5. Workflows del repo

| Archivo | Estado | Ejecutado por GitHub |
|---------|--------|----------------------|
| `.github/workflows/ci.yml` | Activo | Sí (push/PR a main) |
| `.github/workflows_disabled/ci.yml` | Desactivado | No (carpeta _disabled) |
| `.github/workflows_disabled/supabase.yml` | Desactivado | No |
| `.github/workflows_disabled/codeql.yml` | Desactivado | No |
| `.github/dependabot.yml` | Activo | Sí (Dependabot) |

---

## 6. Resumen de fixes

| Problema | Causa | Fix |
|----------|-------|-----|
| CI failed | Playwright WebKit en ubuntu-latest (24.04) | `runs-on: ubuntu-22.04` |
| Supabase emails | Integración externa en Dashboard | Desactivar en Supabase → Integrations |
| Vercel emails | Build fallido (env/missing) | Configurar env vars en Vercel |

---

## 7. Validación final

Ejecutar localmente:
```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

Tras push, el workflow CI debe pasar. Si sigue fallando, revisar los logs del run en GitHub Actions para el error concreto.
