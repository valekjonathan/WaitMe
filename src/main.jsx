import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import { getSupabaseConfig } from "./lib/supabaseClient";
import App from "./App";
import MissingEnvScreen from "./diagnostics/MissingEnvScreen";
import SafeModeShell from "./diagnostics/SafeModeShell";
import "./globals.css";
import "./styles/no-zoom.css";

// Captura global de errores — guarda en window.__WAITME_DIAG__ para diagnóstico
function initErrorCapture() {
  if (typeof window === "undefined") return;
  window.__WAITME_DIAG__ = window.__WAITME_DIAG__ || { errors: [], maxErrors: 10 };

  const push = (type, err) => {
    const entry = { type, message: err?.message ?? String(err), stack: err?.stack, ts: Date.now() };
    window.__WAITME_DIAG__.errors.push(entry);
    if (window.__WAITME_DIAG__.errors.length > window.__WAITME_DIAG__.maxErrors) {
      window.__WAITME_DIAG__.errors.shift();
    }
  };

  window.onerror = (msg, src, line, col, err) => {
    push("onerror", err || new Error(String(msg)));
  };
  window.addEventListener("unhandledrejection", (e) => {
    push("unhandledrejection", e.reason);
  });
}
initErrorCapture();

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

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary]', error);
    try {
      if (typeof window !== "undefined" && window.__WAITME_DIAG__) {
        window.__WAITME_DIAG__.errors = window.__WAITME_DIAG__.errors || [];
        window.__WAITME_DIAG__.errors.push({
          type: "ErrorBoundary",
          message: error?.message ?? String(error),
          stack: error?.stack,
          ts: Date.now(),
        });
        if (window.__WAITME_DIAG__.errors.length > (window.__WAITME_DIAG__.maxErrors || 10)) {
          window.__WAITME_DIAG__.errors.shift();
        }
      }
    } catch (_) {}
  }

  render() {
    const err = this.state.error;
    if (err) {
      const msg = err?.message ?? String(err);
      const stack = err?.stack ?? '';
      return (
        <div
          style={{
            background: "#0a0a0a",
            color: "#fca5a5",
            padding: 24,
            fontFamily: "monospace, system-ui",
            fontSize: 13,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          <h2 style={{ marginBottom: 12, color: "#ef4444" }}>Runtime error:</h2>
          <div style={{ marginBottom: 16 }}>{msg}</div>
          {stack && (
            <>
              <h3 style={{ marginBottom: 8, color: "#f97316" }}>Stack:</h3>
              <pre style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{stack}</pre>
            </>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

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
