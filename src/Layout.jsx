import React, { useEffect } from 'react';

/**
 * Layout raíz único para que Preview (Base44) y iPhone rendericen con el MISMO ancho útil.
 * Configuración optimizada para iPhone 16 y todos los dispositivos iOS.
 */
export default function Layout({ children }) {
  useEffect(() => {
    // Prevenir zoom en iOS al hacer doble tap
    let lastTouchEnd = 0;
    const preventZoom = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    document.addEventListener('touchend', preventZoom, { passive: false });
    
    // Configurar viewport para iOS
    let viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Prevenir pull-to-refresh en iOS
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.removeEventListener('touchend', preventZoom);
    };
  }, []);

  return (
    <div className="wm-app-outer">
      <div className="wm-app-inner">{children}</div>
    </div>
  );
}