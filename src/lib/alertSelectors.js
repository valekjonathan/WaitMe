/**
 * Shared pure selectors for parking alert data.
 * Used by HistorySellerView (via History.jsx) and BottomNav to guarantee
 * the badge count matches exactly what the seller tab renders.
 */

export function toMs(v) {
  if (v == null) return null;

  // Date
  if (v instanceof Date) return v.getTime();

  // Number (ms o seconds)
  if (typeof v === 'number') {
    return v > 1e12 ? v : v * 1000;
  }

  // String
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // Si tiene zona horaria (Z o +hh:mm) → Date normal
    if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) {
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    }

    // 🔴 CLAVE: string SIN zona → tratar como hora local (Madrid)
    const t = new Date(s + ':00').getTime();
    return Number.isNaN(t) ? null : t;
  }

  return null;
}

/**
 * Returns ALL alerts owned by the user with status 'active' or 'reserved'.
 * Ownership: user_id OR created_by OR user_email.
 * No limit on count — all visible seller alerts in "Tus alertas → Activas".
 *
 * Returns [] when no data or no qualifying alert.
 */
export function getActiveSellerAlerts(myAlerts, userId, userEmail) {
  if (!Array.isArray(myAlerts) || myAlerts.length === 0) return [];

  return myAlerts.filter((a) => {
    if (!a) return false;

    const isMine =
      (userId && (a.user_id === userId || a.created_by === userId)) ||
      (userEmail && a.user_email === userEmail);

    if (!isMine) return false;

    const status = String(a.status || '').toLowerCase();
    return status === 'active' || status === 'reserved';
  });
}

/**
 * Returns ALL active seller alerts that are not hidden in the UI.
 * hiddenKeys is the Set persisted in localStorage under 'waitme:hidden_keys'.
 * Cards use the key format `active-${alert.id}`.
 * Count matches exactly what HistorySellerView renders in "Tus alertas → Activas".
 */
export function getVisibleActiveSellerAlerts(myAlerts, userId, userEmail, hiddenKeys) {
  const active = getActiveSellerAlerts(myAlerts, userId, userEmail);
  if (!hiddenKeys || hiddenKeys.size === 0) return active;
  return active.filter((a) => !hiddenKeys.has(`active-${a.id}`));
}

/** Read the persisted hiddenKeys Set from localStorage (safe fallback to empty Set). */
export function readHiddenKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem('waitme:hidden_keys') || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}
