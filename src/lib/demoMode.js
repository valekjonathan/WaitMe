// Demo mode helper
// Por defecto: demo activado (si no existe la clave)

export function getDemoMode() {
  try {
    const v = localStorage.getItem('waitme_demo_mode');
    if (v === null) return true;
    return v === 'true';
  } catch {
    return true;
  }
}
