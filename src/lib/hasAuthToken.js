export function hasAuthToken() {
  if (typeof window === 'undefined') return false;
  const ls = window.localStorage;
  // Base44 guarda el token aquí cuando viene por URL (access_token)
  const t1 = ls.getItem('base44_access_token');
  // fallback por si alguna versión usa otra key
  const t2 = ls.getItem('token');
  return !!(t1 || t2);
}
