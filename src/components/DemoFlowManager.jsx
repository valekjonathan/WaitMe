import { useEffect } from 'react'
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO CENTRAL ÚNICO (VACÍO)
   - Mantiene todos los exports
   - Mantiene compatibilidad total
   - Sin usuarios
   - Sin alerts
   - Sin chats
   - Sin notificaciones
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

function normalize(s) { return String(s || '').trim().toLowerCase(); }

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
   HELPERS
====================================================== */

function getConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

function getAlert(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

/* ======================================================
   START (SIN SEED)
====================================================== */

function resetDemo() {
  demoFlow.users = [];
  demoFlow.alerts = [];
  demoFlow.conversations = [];
  demoFlow.messages = {};
  demoFlow.notifications = [];
}

/* ======================================================
   API (EXPORTS)
====================================================== */

export function isDemoMode() { return true; }
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

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

// Chats
export function getDemoConversations() { return demoFlow.conversations || []; }
export function getDemoAlerts() { return demoFlow.alerts || []; }

// Alert getters
export function getDemoAlert(alertId) { return getAlert(alertId); }
export function getDemoAlertById(alertId) { return getAlert(alertId); }
export function getDemoAlertByID(alertId) { return getAlert(alertId); }

// Chat
export function getDemoConversation(conversationId) { return getConversation(conversationId); }
export function getDemoConversationById(conversationId) { return getConversation(conversationId); }

export function getDemoMessages(conversationId) {
  return [];
}

export function sendDemoMessage() {
  notify();
}

// Notifications
export function getDemoNotifications() { return demoFlow.notifications || []; }

export function markDemoRead() { notify(); }
export function markDemoNotificationRead() { notify(); }
export function markDemoNotificationReadLegacy() { notify(); }
export function markAllDemoRead() { notify(); }

/* ======================================================
   CONVERSACIÓN ↔ ALERTA
====================================================== */

export function ensureConversationForAlert() { return null; }
export function ensureConversationForAlertId() { return null; }
export function ensureInitialWaitMeMessage() { return null; }

/* ======================================================
   ACCIONES
====================================================== */

export function applyDemoAction() { notify(); }

/* ======================================================
   RESERVAR
====================================================== */

export function reserveDemoAlert() { return null; }

export function setDemoMode() { return true; }

/* ======================================================
   COMPONENTE
====================================================== */

export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow();
    toast({ title: 'Modo Demo Activo', description: 'App vacía.' });
  }, []);
  return null;
}