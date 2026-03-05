# Observabilidad WaitMe — Startup-grade

## Sentry (Frontend)

### Configuración actual

- **Paquete:** `@sentry/react`
- **Inicialización:** `src/lib/sentry.js` (importado en `main.jsx`)
- **Activación:** Solo si `VITE_SENTRY_DSN` está definido
- **Integraciones:** `browserTracingIntegration()` (performance)
- **ErrorBoundary:** `Sentry.captureException` en `componentDidCatch`

### Variables de entorno

| Variable | Uso |
|---------|-----|
| `VITE_SENTRY_DSN` | DSN del proyecto Sentry. Sin él, Sentry no se inicializa. |

### Sourcemaps (opcional)

Para que los errores en Sentry muestren el código fuente original:

1. Instalar: `npm i -D @sentry/vite-plugin`
2. Añadir en `vite.config.js`:
   ```js
   import { sentryVitePlugin } from "@sentry/vite-plugin";
   // En plugins: sentryVitePlugin({ org, project, authToken })
   ```
3. En CI/Vercel, definir: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

### Verificación

1. Con `VITE_SENTRY_DSN` configurado, provocar un error (ej. `throw new Error('test')`).
2. Comprobar en Sentry que el evento aparece.
3. Con sourcemaps, verificar que el stack trace apunta al código fuente.

## Logging

- **Logger:** `src/lib/logger.js` — breadcrumbs y `captureException` si Sentry está activo.
- **Uso:** `logger.info()`, `logger.warn()`, `logger.error()`.

## Mínimo imprescindible

- DSN en producción (Vercel env).
- Revisar Sentry al menos semanalmente.
- Alertas en Sentry para errores no capturados (configurar en dashboard).
