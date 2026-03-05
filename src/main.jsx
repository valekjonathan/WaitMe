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

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: "#1a1a1a",
            color: "#fca5a5",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "pre-wrap",
            minHeight: "100vh",
          }}
        >
          <h2 style={{ marginBottom: 16 }}>Error</h2>
          {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

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
