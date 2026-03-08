# Árbol real del proyecto WaitMe — Snapshot actual

**Fecha:** 2026-03-08  
**ZIP:** `tmp/waitme-auditoria-maestra-actual.zip`

---

## Estructura principal

```
WaitMenuevo/
├── src/              # Código fuente
├── tests/            # Playwright + Vitest
├── scripts/          # Scripts útiles
├── docs/             # Documentación
├── public/           # Assets públicos
├── supabase/         # Migraciones y config
├── ios/              # Proyecto iOS Capacitor
├── .github/          # CI/CD
├── .storybook/       # Config Storybook
├── .maestro/         # Flujos Maestro (OAuth)
├── .husky/           # Git hooks
├── quarantine/       # Archivos movidos (referencia)
├── tmp/              # Temporales (ZIP auditoría)
├── package.json
├── vite.config.js
├── playwright.config.js
├── capacitor.config.ts
└── ...
```

## Excluidos del ZIP

- node_modules
- dist
- storybook-static
- coverage
- playwright-report
- test-results
- .git
