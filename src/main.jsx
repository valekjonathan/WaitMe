import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./lib/AuthContext";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";
import "./styles/no-zoom.css";

const DIAG_STEP = parseInt(import.meta.env.VITE_DIAG_STEP || "5", 10);

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
}

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

function DiagMinimal() {
  return (
    <div style={{ background: "#000", color: "#fff", padding: "24px" }}>
      <h1>WaitMe OK</h1>
      <p>React montó correctamente</p>
    </div>
  );
}

function renderApp() {
  if (DIAG_STEP === 0) return <DiagMinimal />;
  if (DIAG_STEP === 1) return <QueryClientProvider client={queryClient}><DiagMinimal /></QueryClientProvider>;
  if (DIAG_STEP === 2) return <QueryClientProvider client={queryClient}><AuthProvider><DiagMinimal /></AuthProvider></QueryClientProvider>;
  if (DIAG_STEP === 3) return <QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter><DiagMinimal /></BrowserRouter></AuthProvider></QueryClientProvider>;
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    {renderApp()}
  </ErrorBoundary>
);