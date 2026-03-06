import { useEffect, useRef } from 'react';

/**
 * Debounced save effect. Calls saveFn when formData changes after delay ms,
 * only if payload differs from last saved.
 * @param {Object} options
 * @param {boolean} options.enabled - Whether to run (hydrated, user?.id)
 * @param {Object} options.formData - Current form data
 * @param {Function} options.toPayload - (formData) => payload
 * @param {Function} options.saveFn - async (payload) => { data } | null
 * @param {number} options.delay - Debounce ms (600-900)
 * @param {Function} options.onSuccess - (data) => void, e.g. setProfile
 * @param {Function} options.onError - (err) => void
 */
export function useDebouncedSave({
  enabled,
  formData,
  toPayload,
  saveFn,
  delay = 750,
  onSuccess,
  onError,
}) {
  const lastSavedRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled || !formData || !toPayload || !saveFn) return;

    const payload = toPayload(formData);
    const payloadKey = JSON.stringify(payload);

    if (lastSavedRef.current === payloadKey) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      timeoutRef.current = null;
      try {
        const data = await saveFn(payload);
        if (data) {
          lastSavedRef.current = payloadKey;
          onSuccess?.(data);
        }
      } catch (err) {
        onError?.(err);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, formData, toPayload, saveFn, delay, onSuccess, onError]);
}
