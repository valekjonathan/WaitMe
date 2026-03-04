import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

window.onerror = function (msg, url, line, col, err) {
  document.body.innerHTML =
    "<pre style='background:#000;color:#fff;padding:20px'>" +
    "WINDOW ERROR\n\n" +
    msg +
    "\n\n" +
    (err?.stack || "") +
    "</pre>";
};

window.onunhandledrejection = function (e) {
  document.body.innerHTML =
    "<pre style='background:#000;color:#fff;padding:20px'>" +
    "PROMISE ERROR\n\n" +
    (e.reason?.stack || e.reason) +
    "</pre>";
};

function ErrorFallback({ error }) {
  return (
    <div
      style={{
        background: "#111",
        color: "#fff",
        padding: "20px",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
      }}
    >
      REACT ERROR:
      {"\n"}
      {String(error)}
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

  componentDidCatch(error, info) {
    console.error("React error:", error, info);
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
