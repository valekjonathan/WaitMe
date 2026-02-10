import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ---- Viewport iPhone real (Preview = iPhone) ----
// Corrige:
// - 100vh en iOS (barra Safari)
// - safe-area en Preview (fallback para que coincida con iPhone)
const __setViewportVars__ = () => {
  try {
    const root = document.documentElement;

    // Altura real del viewport (evita bugs de 100vh en iOS)
    root.style.setProperty('--app-height', `${window.innerHeight}px`);

    // Detectar soporte real de env(safe-area-inset-*)
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;';
    document.body.appendChild(probe);
    const cs = window.getComputedStyle(probe);
    const top = parseFloat(cs.paddingTop) || 0;
    const bottom = parseFloat(cs.paddingBottom) || 0;
    document.body.removeChild(probe);

    // Si no hay safe-area (desktop/preview), metemos un fallback tipo iPhone (notch + home bar)
    // Solo en pantallas "tipo móvil" para no romper desktop.
    const isSmall = window.innerWidth <= 500;
    if (isSmall && top === 0) root.style.setProperty('--safe-top', '47px');
    else root.style.removeProperty('--safe-top');

    if (isSmall && bottom === 0) root.style.setProperty('--safe-bottom', '34px');
    else root.style.removeProperty('--safe-bottom');
  } catch {
    // no-op
  }
};

window.addEventListener('resize', __setViewportVars__);
window.addEventListener('orientationchange', __setViewportVars__);
window.addEventListener('DOMContentLoaded', __setViewportVars__);
// -----------------------------------------------

// ---- Silenciar ruido de SSE/EventSource (Base44) sin afectar a la app ----
const __IGNORE_SSE_PATTERNS__ = [
  /sseerror/i,
  /eventsource/i,
  /server-sent events/i,
  /failed to fetch/i
];

const __shouldIgnoreSseError__ = (...args) => {
  return args.some((a) => {
    try {
      const msg = typeof a === 'string' ? a : (a?.message || String(a));
      return __IGNORE_SSE_PATTERNS__.some((re) => re.test(msg));
    } catch {
      return false;
    }
  });
};

const __origConsoleError__ = console.error.bind(console);
console.error = (...args) => {
  if (__shouldIgnoreSseError__(...args)) return;
  __origConsoleError__(...args);
};

window.addEventListener('unhandledrejection', (e) => {
  const reason = e?.reason;
  if (__shouldIgnoreSseError__(reason)) {
    e.preventDefault();
  }
});

window.addEventListener('error', (e) => {
  const err = e?.error || e?.message;
  if (__shouldIgnoreSseError__(err)) {
    e.preventDefault();
  }
});


ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



