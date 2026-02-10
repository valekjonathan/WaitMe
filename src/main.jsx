import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

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



