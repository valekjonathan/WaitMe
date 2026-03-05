import React from "react";
import App from "../App";

export default function AppProbe() {
  return (
    <div>
      <div
        style={{
          background: "#1a1a1a",
          color: "#4ade80",
          padding: "8px 16px",
          fontFamily: "monospace",
          fontSize: 12,
          borderBottom: "1px solid #333",
        }}
      >
        APP PROBE OK
      </div>
      <App />
    </div>
  );
}
