import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function ErrorFallback({ error }) {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>App error</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{String(error)}</pre>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}

window.addEventListener("error", (e) => {
  const msg = e?.message || "Unknown JS error";
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif"><h1>JS ERROR</h1><pre style="white-space:pre-wrap">${msg}</pre></div>`;
});

window.addEventListener("unhandledrejection", (e) => {
  const reason = e?.reason ? String(e.reason) : "Unknown promise rejection";
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif"><h1>PROMISE ERROR</h1><pre style="white-space:pre-wrap">${reason}</pre></div>`;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
