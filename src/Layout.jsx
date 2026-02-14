import React from 'react';

/**
 * Layout raíz único para que Preview (Base44) y iPhone rendericen con el MISMO ancho útil.
 * - No fija width: solo limita con max-width y centra.
 * - No toca estilos internos de pantallas/tarjetas.
 */
export default function Layout({ children }) {
  return (
    <div className="wm-app-outer">
      <div className="wm-app-inner">{children}</div>
    </div>
  );
}
