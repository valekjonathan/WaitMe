import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import { getSupabaseConfig } from "./lib/supabaseClient";
import App from "./App";
import MissingEnvScreen from "./diagnostics/MissingEnvScreen";
import "./globals.css";
import "./styles/no-zoom.css";

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

const rootEl = document.getElementById("root");
if (rootEl) {
  const config = getSupabaseConfig();
  if (!config.ok) {
    ReactDOM.createRoot(rootEl).render(
      <HashRouter>
        <MissingEnvScreen missing={config.missing} />
      </HashRouter>
    );
  } else {
    ReactDOM.createRoot(rootEl).render(
      <ErrorBoundary>
        <HashRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </HashRouter>
      </ErrorBoundary>
    );
  }
}
