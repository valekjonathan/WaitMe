# Auditoría FASE 2 — Clasificación de archivos/carpetas

## A) Imprescindible
- `src/` — Código fuente
- `ios/` — Proyecto iOS Capacitor
- `supabase/` — Migraciones y config
- `tests/` — Tests
- `scripts/` — Scripts útiles
- `package.json`, `package-lock.json`
- `vite.config.js`, `playwright.config.js`, `eslint.config.js`, `tailwind.config.js`, `capacitor.config.ts`, `tsconfig.json`
- `.env.example`, `.env.local.example`
- `index.html`, `manifest.json`
- `.github/` — CI/CD
- `.husky/` — Git hooks
- `.storybook/` — Config Storybook
- `public/` — Assets públicos

## B) Regenerable
- `dist/` — `npm run build`
- `node_modules/` — `npm install`
- `playwright-report/` — `npm run test`
- `test-results/` — `npm run test`
- `storybook-static/` — `npm run build-storybook`

## C) Borrable seguro
- `dist/` ✓
- `playwright-report/` ✓
- `test-results/` ✓
- `storybook-static/` ✓
- `waitme_codebase_snapshot.zip` (raíz) ✓
- `ios_run_last.log` ✓
- `tmp/*.zip` (zips viejos) ✓
- `audit/waitme-audit.zip` (se regenerará) ✓

## D) Revisar antes
- `quarantine/` — Referencia, no importado. Mantener por si se necesita.
- `tmp/codebase_export/` — Export anterior. Revisar.
- `tmp/audit-icono/` — Auditoría icono. Revisar.
- `docs/` — Muchos docs. No borrar sin validar vigencia.
- `file-list.txt` — Lista de archivos. Revisar si útil.
