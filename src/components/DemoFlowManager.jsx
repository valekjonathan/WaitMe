// src/components/DemoFlowManager.jsx
/* ======================================================
   DEMO CENTRAL ÚNICO (VACÍO + COMPATIBLE)
   - Mantiene TODOS los exports legacy que usa la app
   - NO genera datos
   - NO muestra toast
   - isDemoMode = false (app real vacía)
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

// Estado demo vacío (pero con estructura estable)
export const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },
  users: [],
  alerts: [],
  conversations: [],
  messages: {},
  notifications: []
};

// Helpers internos (devuelven null siempre porque está vacío)
function getConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}
function getAlert(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}
function resetDemo() {
  demoFlow.users = [];
  demoFlow.alerts = [];
  demoFlow.conversations = [];
  demoFlow.messages = {};
  demoFlow.notifications = [];
}

// ======================
// EXPORTS (compatibilidad)
// ======================

// Modo demo: DESACTIVADO
export function isDemoMode() { return false; }
export function getDemoMode() { return false; }
export function setDemoMode() { return false; }

// Estado
export function getDemoState() { return demoFlow; }

// Start/Subscribe
export function startDemoFlow() {
  if (started) return;
  started = true;

  // Vacío siempre
  resetDemo();

  // Mantengo el tick por si alguna pantalla “espera” updates
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

// Alias legacy
export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}
export function unsubscribeDemoFlow() {}

// Lists
export function getDemoAlerts() { return demoFlow.alerts || []; }
export function getDemoConversations() { return demoFlow.conversations || []; }
export function getDemoChats() { return demoFlow.conversations || []; }
export function getDemoUsers() { return demoFlow.users || []; }
export function getDemoNotifications() { return demoFlow.notifications || []; }

// Alert getters (legacy)
export function getDemoAlert(alertId) { return getAlert(alertId); }
export function getDemoAlertById(alertId) { return getAlert(alertId); }
export function getDemoAlertByID(alertId) { return getAlert(alertId); }

// Conversation getters (legacy)
export function getDemoConversation(conversationId) { return getConversation(conversationId); }
export function getDemoConversationById(conversationId) { return getConversation(conversationId); }
export function getDemoConversationByID(conversationId) { return getConversation(conversationId); }

// Messages (vacío)
export function getDemoMessages() { return []; }
export function getDemoChatMessages() { return []; }

// Send/Actions (no-op)
export function sendDemoMessage() { notify(); return null; }
export function applyDemoAction() { notify(); }

// Reads (no-op)
export function markDemoRead() { notify(); }
export function markDemoNotificationRead() { notify(); }
export function markDemoNotificationReadLegacy() { notify(); }
export function markDemoNotificationReadById() { notify(); }
export function markAllDemoRead() { notify(); }
export function markDemoNotificationReadAll() { notify(); }

// Conversación ↔ alerta (vacío)
export function ensureConversationForAlert() { return null; }
export function ensureConversationForAlertId() { return null; }
export function ensureInitialWaitMeMessage() { return null; }

// Reservas (vacío)
export function reserveDemoAlert() { return null; }

// ======================
// COMPONENTE (no hace nada)
// ======================
export default function DemoFlowManager() {
  return null;
}