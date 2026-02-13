import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO MANAGER - ESTADO VACÍO
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/* ======================================================
   ESTADO DEMO (VACÍO)
====================================================== */

export const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },
  users: [],
  alerts: [],
  conversations: [],
  messages: {},
  notifications: []
};

/* ======================================================
   API (EXPORTS)
====================================================== */

export function isDemoMode() { return true; }
export function setDemoMode() { return true; }
export function getDemoState() { return demoFlow; }

export function startDemoFlow() {
  if (started) return;
  started = true;

  // Mantener todo vacío
  demoFlow.users = [];
  demoFlow.alerts = [];
  demoFlow.conversations = [];
  demoFlow.messages = {};
  demoFlow.notifications = [];

  if (!tickTimer) {
    tickTimer = setInterval(() => notify(), 1000);
  }

  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

// Getters
export function getDemoAlerts() { return demoFlow.alerts || []; }
export function getDemoAlert(id) { return null; }
export function getDemoAlertById(id) { return null; }
export function getDemoAlertByID(id) { return null; }

export function getDemoConversations() { return demoFlow.conversations || []; }
export function getDemoConversation(id) { return null; }
export function getDemoConversationById(id) { return null; }

export function getDemoMessages(id) { return []; }

export function getDemoNotifications() { return demoFlow.notifications || []; }

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  // No hacer nada en estado vacío
}

export function markDemoRead(id) {
  notify();
}

export function markDemoNotificationRead(id) {
  return markDemoRead(id);
}

export function markAllDemoRead() {
  notify();
}

export function ensureConversationForAlert(alertId, hint = null) {
  return null;
}

export function ensureConversationForAlertId(alertId) {
  return null;
}

export function ensureInitialWaitMeMessage(conversationId) {
  return null;
}

export function applyDemoAction({ conversationId, alertId, action }) {
  notify();
}

export function reserveDemoAlert(alertId) {
  return null;
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow();
    toast({ title: 'App lista', description: 'Sin datos de simulación.' });
  }, []);
  return null;
}