import './dev/diagnostics';
import './system/diagnostics/waitmeDiagnostics';
import './dev/layoutInspector';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/AuthContext';
import { getRuntimeConfig } from './lib/runtimeConfig';
import App from './App';
import ErrorBoundary from './core/ErrorBoundary';
import MissingEnvScreen from './diagnostics/MissingEnvScreen';
import SafeModeShell from './diagnostics/SafeModeShell';
import './globals.css';
import './styles/no-zoom.css';

// diagnostics.js es el único manejador global de errores (window.onerror, onunhandledrejection)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

// Sentry debe cargarse después del primer render para evitar dispatcher.useState null
setTimeout(
  () =>
    import('./lib/sentry').catch((error) => {
      console.error('[WaitMe Error]', error);
    }),
  0
);

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:main] ${msg}`, extra ?? '');
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  }
};

const rootEl = document.getElementById('root');
if (rootEl) {
  RENDER_LOG('root element found, getting config');

  const renderApp = () => {
    try {
      // SAFE MODE — shell mínima con nav + diagnóstico, siempre carga
      if (import.meta.env.VITE_SAFE_MODE === 'true') {
        RENDER_LOG('VITE_SAFE_MODE active');
        ReactDOM.createRoot(rootEl).render(
          <ErrorBoundary>
            <SafeModeShell />
          </ErrorBoundary>
        );
      } else if (import.meta.env.VITE_HARD_BYPASS_APP === 'true') {
        const isSimple = import.meta.env.VITE_HARD_BYPASS_APP_SIMPLE === 'true';
        RENDER_LOG('VITE_HARD_BYPASS_APP active', { isSimple });
        ReactDOM.createRoot(rootEl).render(
          isSimple ? (
            <div
              style={{
                minHeight: '100vh',
                background: '#111',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontFamily: 'system-ui',
              }}
            >
              APP SIMPLE OK
            </div>
          ) : (
            <div
              style={{
                minHeight: '100vh',
                background: '#111',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontFamily: 'system-ui',
              }}
            >
              WAITME HARD BYPASS OK
            </div>
          )
        );
      } else {
        const config = getRuntimeConfig();
        if (!config.canBoot) {
          RENDER_LOG('config NOT ok, rendering MissingEnvScreen', config.missing);
          ReactDOM.createRoot(rootEl).render(
            <HashRouter>
              <MissingEnvScreen missing={config.missing} />
            </HashRouter>
          );
        } else {
          RENDER_LOG('config ok, rendering App with ErrorBoundary');
          ReactDOM.createRoot(rootEl).render(
            <ErrorBoundary>
              <AuthProvider>
                <HashRouter>
                  <QueryClientProvider client={queryClient}>
                    <App />
                  </QueryClientProvider>
                </HashRouter>
              </AuthProvider>
            </ErrorBoundary>
          );
        }
      }
    } catch (bootError) {
      console.error('[main] Boot error:', bootError);
      ReactDOM.createRoot(rootEl).render(
        <HashRouter>
          <div
            style={{
              minHeight: '100vh',
              background: '#0f0f0f',
              color: '#e5e5e5',
              padding: 24,
              fontFamily: 'system-ui',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1 style={{ fontSize: 20, color: '#fca5a5', marginBottom: 12 }}>
              Error al iniciar WaitMe
            </h1>
            {import.meta.env.DEV && bootError && (
              <pre
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  maxWidth: '100%',
                  overflow: 'auto',
                  padding: 12,
                  background: '#1a1a1a',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                {bootError?.message || String(bootError)}
              </pre>
            )}
            <a
              href="?VITE_SAFE_MODE=true"
              style={{ color: '#a78bfa', textDecoration: 'underline' }}
            >
              Abrir en modo seguro
            </a>
          </div>
        </HashRouter>
      );
    }
  };

  renderApp();
} else {
  RENDER_LOG('root element NOT found');
}
