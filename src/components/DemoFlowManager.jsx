// src/components/DemoFlowManager.jsx
/* ======================================================
   DEMO CENTRAL ÚNICO (VACÍO + COMPATIBLE)
   - Mantiene TODOS los exports legacy que usa la app
   - NO genera datos
   - isDemoMode = false (app completamente vacía)
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

// Estado demo vacío
export const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },
  users: [],
  alerts: [],
  conversations: [],
  messages: {},
  notifications: []
};

function resetDemo() {
  demoFlow.users = [];
  demoFlow.alerts = [];
  demoFlow.conversations = [];
  demoFlow.messages = {};
  demoFlow.notifications = [];
}

// ======================
// EXPORTS COMPATIBLES
// ======================

export function isDemoMode() { return false; }
export function getDemoMode() { return false; }
export function setDemoMode() { return false; }
export function getDemoState() { return demoFlow; }

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
  started = false;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  notify();
}

export function resetDemoFlow() {
  resetDemo();
  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

export function unsubscribeDemoFlow() {}

// Listas vacías
export function getDemoAlerts() { return []; }
export function getDemoConversations() { return []; }
export function getDemoChats() { return []; }
export function getDemoUsers() { return []; }
export function getDemoNotifications() { return []; }
export function getDemoMessages() { return []; }
export function getDemoChatMessages() { return []; }

// Acciones vacías
export function sendDemoMessage() { return null; }
export function applyDemoAction() {}
export function markDemoRead() {}
export function markDemoNotificationRead() {}
export function markAllDemoRead() {}
export function ensureConversationForAlert() { return null; }
export function ensureConversationForAlertId() { return null; }
export function ensureInitialWaitMeMessage() { return null; }
export function reserveDemoAlert() { return null; }

// ======================
// COMPONENTE
// ======================
export default function DemoFlowManager() {
  return null;
}