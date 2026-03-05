import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import AppProbe from "./diagnostics/AppProbe";
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

function bootOverlayAdd(line) {
  const overlay = window.__bootOverlay;
  if (!overlay) return;
  const cur = overlay.textContent || "";
  overlay.textContent = cur + (cur ? "\n" : "") + line;
  overlay.style.display = "block";
}

function bootOverlayUpdate(title, detail) {
  if (typeof window.__bootUpdate === "function") {
    window.__bootUpdate(title, detail);
  }
}

function bootOverlayHide() {
  if (typeof window.__bootHide === "function") {
    window.__bootHide();
  }
}

const STEP_LABELS = {
  A: "HashRouter",
  B: "AuthProvider",
  C: "QueryClientProvider+AuthProvider",
};

function BootErrorFallback({ error, step }) {
  const msg = `FALLA EN PASO ${step} (${STEP_LABELS[step]})\n\n${String(error)}${error?.stack ? "\n\n" + error.stack : ""}`;
  useEffect(() => {
    bootOverlayUpdate(`FALLA EN PASO ${step} (${STEP_LABELS[step]})`, String(error) + (error?.stack ? "\n\n" + error.stack : ""));
  }, [error, step]);
  return (
    <div
      style={{
        background: "#1a0000",
        color: "#fca5a5",
        padding: 20,
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        minHeight: "100vh",
      }}
    >
      {msg}
    </div>
  );
}

class BootErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, this.props.step);
  }

  render() {
    if (this.state.error) {
      return <BootErrorFallback error={this.state.error} step={this.props.step} />;
    }
    return this.props.children;
  }
}

function MountWatcher({ children, onMounted }) {
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const t = setTimeout(() => {
      const root = document.getElementById("root");
      const hasContent = root?.children?.length > 0;
      if (hasContent) {
        bootOverlayAdd("BOOT 3: React mounted OK");
        bootOverlayHide();
        onMounted?.();
      }
    }, 300);
    return () => clearTimeout(t);
  }, [onMounted]);
  return children;
}

function renderStep(step) {
  switch (step) {
    case "A":
      return (
        <HashRouter>
          <MountWatcher>
            <AppProbe />
          </MountWatcher>
        </HashRouter>
      );
    case "B":
      return (
        <HashRouter>
          <AuthProvider>
            <MountWatcher>
              <AppProbe />
            </MountWatcher>
          </AuthProvider>
        </HashRouter>
      );
    case "C":
      return (
        <HashRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <MountWatcher>
                <AppProbe />
              </MountWatcher>
            </AuthProvider>
          </QueryClientProvider>
        </HashRouter>
      );
    default:
      return null;
  }
}

function BootRoot() {
  const [step, setStep] = useState("A");
  const [lastError, setLastError] = useState(null);

  const handleError = (err, stepName) => {
    setLastError(err);
    if (stepName === "A") setStep("B");
    else if (stepName === "B") setStep("C");
    else setStep("failed");
  };

  if (step === "failed") {
    return (
      <BootErrorFallback
        error={lastError || new Error("Unknown")}
        step="C"
      />
    );
  }

  return (
    <BootErrorBoundary key={step} step={step} onError={handleError}>
      {renderStep(step)}
    </BootErrorBoundary>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  bootOverlayAdd("BOOT 2: main.jsx ejecutado");
  ReactDOM.createRoot(rootEl).render(<BootRoot />);
}
