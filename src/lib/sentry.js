/**
 * Inicialización de Sentry para observabilidad.
 * Solo se activa si VITE_SENTRY_DSN está configurado.
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn && typeof dsn === 'string' && dsn.trim() !== '') {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration()],
  });
}
