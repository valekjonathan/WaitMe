/**
 * Shell mínima cuando VITE_SAFE_MODE=true.
 * App carga SIEMPRE. Navegación + diagnóstico.
 * Sin map, realtime, auth real (usa bypass).
 */
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import DevDiagnostics from "@/pages/DevDiagnostics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0 },
  },
});

function SafeHome() {
  return (
    <div
      style={{
        minHeight: "60vh",
        background: "#111",
        color: "#fff",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>WaitMe — SAFE MODE</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        La app está en modo seguro. Capas problemáticas desactivadas.
      </p>
      <Link
        to="/dev-diagnostics"
        style={{ color: "#a855f7", textDecoration: "underline" }}
      >
        → Ir a Diagnóstico
      </Link>
    </div>
  );
}

export default function SafeModeShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <div
            style={{
              minHeight: "100vh",
              background: "#0a0a0a",
              color: "#fff",
            }}
          >
            <nav
              style={{
                padding: 16,
                borderBottom: "1px solid #333",
                display: "flex",
                gap: 16,
              }}
            >
              <Link to="/" style={{ color: "#a855f7" }}>
                Home
              </Link>
              <Link to="/dev-diagnostics" style={{ color: "#a855f7" }}>
                Diagnóstico
              </Link>
            </nav>
            <main style={{ padding: 24 }}>
              <Routes>
                <Route path="/" element={<SafeHome />} />
                <Route path="/dev-diagnostics" element={<DevDiagnostics />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
