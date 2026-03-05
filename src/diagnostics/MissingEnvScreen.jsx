import React from "react";

export default function MissingEnvScreen({ missing = [] }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "#e5e5e5",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#fca5a5",
          marginBottom: 16,
        }}
      >
        Falta configuración de Supabase
      </h1>
      <p style={{ marginBottom: 20, textAlign: "center", maxWidth: 320 }}>
        Sin estas variables la app no puede autenticarse ni cargar datos.
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 16,
          margin: 0,
          background: "#1a1a1a",
          borderRadius: 8,
          minWidth: 280,
        }}
      >
        {missing.map((v) => (
          <li
            key={v}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #333",
              fontFamily: "monospace",
              fontSize: 14,
            }}
          >
            ❌ {v}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 20, fontSize: 13, color: "#888" }}>
        Añade las variables en <code style={{ background: "#222", padding: "2px 6px", borderRadius: 4 }}>.env</code> y reinicia.
      </p>
    </div>
  );
}
