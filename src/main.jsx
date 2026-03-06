import "./dev/diagnostics";
import "./dev/layoutInspector";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import { getSupabaseConfig } from "./lib/supabaseClient";
import App from "./App";
import ErrorBoundary from "./core/ErrorBoundary";
import MissingEnvScreen from "./diagnostics/MissingEnvScreen";
import SafeModeShell from "./diagnostics/SafeModeShell";
import "./globals.css";
import "./styles/no-zoom.css";

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

// Sentry debe cargarse después de React para evitar dispatcher.useState null
import('./lib/sentry').catch(() => {});

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:main] ${msg}`, extra ?? '');
    } catch {}
  }
};

const rootEl = document.getElementById("root");
if (rootEl) {
  RENDER_LOG('root element found, getting config');

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
        <div style={{
          minHeight: '100vh',
          background: '#111',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontFamily: 'system-ui',
        }}>
          APP SIMPLE OK
        </div>
      ) : (
        <div style={{
          minHeight: '100vh',
          background: '#111',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontFamily: 'system-ui',
        }}>
          WAITME HARD BYPASS OK
        </div>
      )
    );
  } else {
  const config = getSupabaseConfig();
  if (!config.ok) {
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
} else {
  RENDER_LOG('root element NOT found');
}
