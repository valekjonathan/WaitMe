/**
 * Timers del demo flow: start, stop.
 * @module hooks/demo/useDemoFlowTimers
 */

import { resetDemo } from './useDemoFlowState';
import { notify } from './useDemoFlowSync';

let started = false;
let tickTimer = null;

export function startDemoFlow() {
  if (started) return;
  started = true;

  resetDemo();

  if (!tickTimer) {
    tickTimer = setInterval(() => notify(), 1000);
  }

  notify();
}

export function stopDemoFlow() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  started = false;
}
