import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO STATE CENTRALIZADO
====================================================== */

let started = false;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => l());
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/* ======================================================
   SUSCRIPCIÓN
====================================================== */

export function subscribeToDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function startDemoFlow() {
  if (started) return;
  started = true;
  notify();
}

export function getDemoState() {
  return demoState;
}

/* ======================================================
   ESTADO
====================================================== */

const demoState = {
  conversations: [],
  messages: {},
  alerts: [],
  notifications: []
};

/* ======================================================
   CONVERSACIONES
====================================================== */

export function getDemoConversations() {
  return demoState.conversations;
}

export function getDemoConversation(conversationId) {
  return demoState.conversations.find(c => c.id === conversationId) || null;
}

/* ======================================================
   MENSAJES
====================================================== */

export function getDemoMessages(conversationId) {
  return demoState.messages[conversationId] || [];
}

export function sendDemoMessage({ conversationId, text, isMine = true }) {
  if (!conversationId || !text) return;

  if (!demoState.messages[conversationId]) {
    demoState.messages[conversationId] = [];
  }

  demoState.messages[conversationId].push({
    id: genId('msg'),
    mine: isMine,
    text,
    ts: Date.now()
  });

  notify();
}

/* ======================================================
   ALERTAS
====================================================== */

export function getDemoAlerts() {
  return demoState.alerts;
}

export function getDemoAlertById(alertId) {
  return demoState.alerts.find(a => a.id === alertId) || null;
}

export function setDemoAlertStatus(alertId, status) {
  const alert = getDemoAlertById(alertId);
  if (!alert) return null;
  alert.status = status;
  notify();
  return alert;
}

/* ======================================================
   NOTIFICACIONES
====================================================== */

export function getDemoNotifications() {
  return demoState.notifications;
}

export function addDemoNotification(notification) {
  if (!notification?.id) return;
  demoState.notifications.unshift(notification);
  notify();
}

export function markDemoNotificationRead(notificationId) {
  const n = demoState.notifications.find(n => n.id === notificationId);
  if (!n) return;
  n.read = true;
  notify();
}

export function clearDemoNotifications() {
  demoState.notifications = [];
  notify();
}

export function markDemoRead(conversationId) {
  notify();
}

/* ======================================================
   ACCIONES
====================================================== */

export function applyDemoAction({ conversationId, alertId, action }) {
  if (alertId) setDemoAlertStatus(alertId, action);

  demoState.notifications.unshift({
    id: genId('noti'),
    type: 'status_update',
    title: action?.toUpperCase() || 'ACTUALIZACIÓN',
    text: 'Estado actualizado.',
    conversationId,
    alertId,
    createdAt: Date.now(),
    read: false
  });

  notify();
}

/* ======================================================
   FLAGS
====================================================== */

export function isDemoMode() {
  return true;
}

export function setDemoMode() {
  return true;
}

/* ======================================================
   EXPORT GLOBAL
====================================================== */

export const demoFlow = {
  start: startDemoFlow,
  getState: getDemoState,
  getConversations: getDemoConversations,
  getConversation: getDemoConversation,
  getMessages: getDemoMessages,
  getAlerts: getDemoAlerts,
  getAlertById: getDemoAlertById,
  getNotifications: getDemoNotifications,
  subscribe: subscribeToDemoFlow,
  isDemoMode,
  markRead: markDemoRead
};

/* ======================================================
   COMPONENTE
====================================================== */

export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow();

    toast({
      title: 'Modo Demo Activo',
      description: 'La app tiene vida simulada.'
    });
  }, []);

  return null;
}