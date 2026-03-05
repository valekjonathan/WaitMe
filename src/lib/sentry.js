/**
 * Inicialización de Sentry para observabilidad en producción.
 * Solo se activa si VITE_SENTRY_DSN está configurado.
 *
 * Variables de entorno:
 *   VITE_SENTRY_DSN       - DSN del proyecto Sentry (obligatorio)
 *   VITE_SENTRY_RELEASE  - Release/versión (opcional, ej: git SHA)
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const isProd = import.meta.env.PROD;

if (dsn && typeof dsn === 'string' && dsn.trim() !== '') {
  Sentry.init({
    dsn,
    environment: isProd ? 'production' : 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    tracesSampleRate: isProd ? 0.2 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      /^Loading chunk \d+ failed/,
    ],
  });
}
