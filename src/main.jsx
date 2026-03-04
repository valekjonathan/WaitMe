import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./lib/AuthContext";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";
import "./styles/no-zoom.css";

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

// SMOKE TEST: render mínimo para confirmar bundle carga en iOS
ReactDOM.createRoot(document.getElementById("root")).render(
  <div style={{ background: "white", color: "black", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
    WAITME BOOT OK
  </div>
);