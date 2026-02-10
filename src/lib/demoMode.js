// src/lib/demoMode.js
export const getDemoMode = () => {
  // ✅ Seguro para iOS Safari
  if (typeof window === 'undefined') return true;

  try {
    const params = new URLSearchParams(window.location.search);

    // Param explícito
    if (params.get('demo') === '1') return true;

    const host = window.location.hostname || '';
    const path = window.location.pathname || '';

    // ✅ Producción Base44 (y cualquier subdominio)
    if (host.includes('base44.app')) return true;

    // ✅ Editor/preview de Base44 (app.base44.com / base44.com)
    if (host.includes('base44.com')) return true;
    if (path.includes('/editor/')) return true;

    // ✅ Si está embebida en iframe (editor), también demo
    try {
      if (window.self !== window.top) return true;
    } catch {
      return true; // si el navegador bloquea el acceso, asumimos demo
    }

    return false;
  } catch {
    // Si Safari peta aquí, forzamos demo
    return true;
  }
};
