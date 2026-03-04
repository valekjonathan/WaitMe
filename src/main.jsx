import React from "react";
import ReactDOM from "react-dom/client";

function TestApp() {
  return (
    <div
      style={{
        fontSize: "40px",
        padding: "40px",
        background: "white",
        color: "black",
      }}
    >
      REACT FUNCIONA
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<TestApp />);
