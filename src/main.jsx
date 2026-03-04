import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import App from "./App";
import "./globals.css";
import "./styles/no-zoom.css";

const DIAG = import.meta.env.VITE_DIAG === "1";

let bootStep = 1;
let lastError = null;
let lastErrorType = null;

function setBootStep(n) {
  bootStep = n;
}

function ErrorFallback({ error }) {
  lastError = error;
  lastErrorType = "React ErrorBoundary";
  return (
    <div
      style={{
        padding: 40,
        fontFamily: "sans-serif",
        background: "#1a0000",
        color: "#fca5a5",
        minHeight: "100vh",
      }}
    >
      <h1>App error</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{String(error)}</pre>
      {error?.stack && (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 16 }}>
          {error.stack}
        </pre>
      )}
    </div>
  );
}

class DiagErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    lastError = error;
    lastErrorType = "ErrorBoundary";
  }
  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}

setBootStep(2);

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

window.addEventListener("error", (e) => {
  lastError = e?.message || e?.error || "Unknown JS error";
  lastErrorType = "window.onerror";
  const msg = esc(e?.message || String(e?.error || "Unknown"));
  const stack = esc(e?.error?.stack || "");
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;background:#1a0000;color:#fca5a5;min-height:100vh"><h1>JS ERROR</h1><pre style="white-space:pre-wrap">${msg}</pre><pre style="white-space:pre-wrap;font-size:11px">${stack}</pre></div>`;
});

window.addEventListener("unhandledrejection", (e) => {
  lastError = e?.reason ? String(e.reason) : "Unknown promise rejection";
  lastErrorType = "unhandledrejection";
  const reason = esc(e?.reason ? String(e.reason) : "Unknown");
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;background:#1a0000;color:#fca5a5;min-height:100vh"><h1>PROMISE ERROR</h1><pre style="white-space:pre-wrap">${reason}</pre></div>`;
});

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

function Root() {
  React.useEffect(() => {
    setBootStep(3);
  }, []);

  return (
    <>
      {DIAG && (
        <div
          id="boot-diag"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99998,
            background: "#0a0a0a",
            color: "#4ade80",
            fontFamily: "monospace",
            padding: "12px 24px",
            fontSize: 14,
            borderBottom: "1px solid #333",
          }}
        >
          BOOT: 1 HTML OK · BOOT: 2 JS OK · BOOT: 3 React OK
        </div>
      )}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif"><h1>NO ROOT</h1><p>div#root no encontrado</p></div>';
} else {
  ReactDOM.createRoot(rootEl).render(
    <DiagErrorBoundary>
      <Root />
    </DiagErrorBoundary>
  );
}
