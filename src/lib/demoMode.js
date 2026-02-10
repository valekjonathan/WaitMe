export const getDemoMode = () => {
  // ✅ Seguro para iOS Safari
  if (typeof window === 'undefined') return true;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') return true;

    // fallback por hostname Base44
    if (window.location.hostname.includes('base44.app')) {
      return true;
    }

    return false;
  } catch (e) {
    // Si Safari peta aquí, forzamos demo
    return true;
  }
};