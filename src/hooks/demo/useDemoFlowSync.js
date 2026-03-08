/**
 * Sincronización: listeners y notify.
 * @module hooks/demo/useDemoFlowSync
 */

import { safeCall } from '@/lib/demo/demoFlowUtils';

const listeners = new Set();

export function notify() {
  listeners.forEach((l) => safeCall(l));
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}
