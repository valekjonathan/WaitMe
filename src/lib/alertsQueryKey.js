/**
 * Canonical factory for the ['alerts', mode, locationKey] query key.
 *
 * Using a single factory ensures every setQueryData / getQueryData /
 * invalidateQueries call in the app targets exactly the same key structure
 * as the useQuery that owns the data, eliminating key-mismatch bugs.
 *
 * For prefix-wide invalidation (all alert variants) pass no arguments:
 *   queryClient.invalidateQueries({ queryKey: alertsPrefix })
 */

/** Exact key for a specific mode + location combination. */
export const alertsKey = (mode, locationKey) => ['alerts', mode, locationKey];

/** Prefix key — invalidates ALL alert query variants at once. */
export const alertsPrefix = ['alerts'];
