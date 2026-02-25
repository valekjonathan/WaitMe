/**
 * Client-side store for finalized_at timestamps.
 *
 * Problem solved: server-side dates (updated_at, cancelled_at …) are unreliable
 * for sort order because:
 *   1. They can be null/missing on the server.
 *   2. After invalidateQueries the cache is overwritten by server data, losing
 *      any client-side field we added via setQueryData.
 *
 * Solution: stamp `Date.now()` in localStorage at the exact moment an alert
 * is finalized on the client. The stamp survives refetches because it lives
 * in localStorage, keyed by alert/request id.
 *
 * Usage:
 *   stampFinalizedAt(id)          → call at the cancel/complete action site
 *   getFinalizedAtMap()           → call inside useMemo to read the full map
 *   getFinalizedAt(id)            → convenience single-id lookup
 */

const STORE_KEY = 'waitme:finalized_at_map';

/** Returns the full {id: timestampMs} map from localStorage. */
export function getFinalizedAtMap() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return typeof map === 'object' && !Array.isArray(map) && map !== null
      ? map
      : {};
  } catch {
    return {};
  }
}

/** Returns the stamped timestamp for a single id, or null if not yet stamped. */
export function getFinalizedAt(id) {
  if (!id) return null;
  return getFinalizedAtMap()[id] ?? null;
}

/**
 * Stamps Date.now() for the given id.
 * Idempotent: if already stamped, the original timestamp is preserved so
 * the sort order never changes on subsequent renders/refetches.
 */
export function stampFinalizedAt(id) {
  if (!id) return;
  try {
    const map = getFinalizedAtMap();
    if (map[id]) return; // already stamped — keep original order
    map[id] = Date.now();
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {}
}
