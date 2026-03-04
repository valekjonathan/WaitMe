/**
 * Logger con breadcrumbs para Sentry.
 */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

function hasSentry() {
  return typeof window !== 'undefined' && window.Sentry;
}

export const logger = {
  info(msg, data) {
    if (hasSentry()) window.Sentry.addBreadcrumb({ category: 'info', message: msg, data });
    if (import.meta.env.DEV) console.info('[WaitMe]', msg, data ?? '');
  },
  warn(msg, data) {
    if (hasSentry()) window.Sentry.addBreadcrumb({ category: 'warn', message: msg, data });
    if (hasSentry()) window.Sentry.captureMessage(msg, 'warning');
    console.warn('[WaitMe]', msg, data ?? '');
  },
  error(msg, err) {
    if (hasSentry()) {
      window.Sentry.addBreadcrumb({ category: 'error', message: msg });
      window.Sentry.captureException(err ?? new Error(msg));
    }
    console.error('[WaitMe]', msg, err ?? '');
  },
};
