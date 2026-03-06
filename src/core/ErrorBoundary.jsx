import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("React crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background:"#0B0B0F",
          color:"white",
          height:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          fontSize:"18px"
        }}>
          Error cargando WaitMe
        </div>
      );
    }

    return this.props.children;
  }
}
