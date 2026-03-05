import React from "react";
import ReactDOM from "react-dom/client";

function ErrorBoundary({ children }) {
  const [error, setError] = React.useState(null);

  if (error) {
    return (
      <div
        style={{
          background: "white",
          color: "red",
          fontSize: 18,
          padding: 40,
          whiteSpace: "pre-wrap",
        }}
      >
        REACT ERROR
        {"\n\n"}
        {String(error)}
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div style={{ padding: 40 }}>Cargando...</div>}>
      <Inner setError={setError}>{children}</Inner>
    </React.Suspense>
  );
}

class Inner extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.setError(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: "white",
            color: "red",
            fontSize: 18,
            padding: 40,
            whiteSpace: "pre-wrap",
          }}
        >
          REACT ERROR
          {"\n\n"}
          {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

function TestApp() {
  return (
    <div
      style={{
        background: "white",
        color: "black",
        fontSize: 40,
        padding: 40,
      }}
    >
      REACT ARRANCÓ
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <TestApp />
  </ErrorBoundary>
);
