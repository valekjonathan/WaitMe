import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO CENTRAL ÚNICO
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => {
    try { l?.(); } catch {}
  });
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function normalizeStatus(s) {
  return String(s || '').trim().toLowerCase();
}

function statusToTitle(status) {
  const s = normalizeStatus(status);
  if (s === 'thinking') return 'ME LO PIENSO';
  if (s === 'extended') return 'PRÓRROGA';
  if (s === 'cancelled') return 'CANCELADA';
  if (s === 'completed') return 'COMPLETADA';
  if (s === 'reserved') return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}

/* ======================================================
   ESTADO DEMO
====================================================== */

const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },
  conversations: [],
  messages: {},
  alerts: [],
  notifications: []
};

export { demoFlow };

/* ======================================================
   START / SUBSCRIBE
====================================================== */

export function startDemoFlow() {
  if (started) return;
  started = true;

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

/* ======================================================
   GETTERS
====================================================== */

export function getDemoState() {
  return demoFlow;
}

export function getDemoConversations() {
  return demoFlow.conversations;
}

export function getDemoConversation(conversationId) {
  return demoFlow.conversations.find(c => c.id === conversationId) || null;
}

export function getDemoConversationById(conversationId) {
  return getDemoConversation(conversationId);
}

export function getDemoMessages(conversationId) {
  return demoFlow.messages[conversationId] || [];
}

export function getDemoAlerts() {
  return demoFlow.alerts;
}

export function getDemoAlertById(alertId) {
  return demoFlow.alerts.find(a => a.id === alertId) || null;
}

export function getDemoNotifications() {
  return demoFlow.notifications;
}

/* ======================================================
   MENSAJES
====================================================== */

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  if (!conversationId || !text?.trim()) return;

  const conv = getDemoConversation(conversationId);
  if (!conv) return;

  const msg = {
    id: genId('msg'),
    mine: isMine,
    senderName: isMine ? 'Tú' : conv.participant2_name,
    senderPhoto: isMine ? null : conv.participant2_photo,
    text,
    attachments,
    ts: Date.now()
  };

  if (!demoFlow.messages[conversationId]) {
    demoFlow.messages[conversationId] = [];
  }

  demoFlow.messages[conversationId].push(msg);

  conv.last_message_text = text;
  conv.last_message_at = msg.ts;

  notify();
}

/* ======================================================
   NOTIFICACIONES
====================================================== */

export function markDemoNotificationRead(notificationId) {
  const n = demoFlow.notifications.find(n => n.id === notificationId);
  if (n) n.read = true;
  notify();
}

export function markAllDemoRead() {
  demoFlow.notifications.forEach(n => n.read = true);
  notify();
}

export function clearDemoNotifications() {
  demoFlow.notifications = [];
  notify();
}

export function removeDemoNotification(notificationId) {
  demoFlow.notifications =
    demoFlow.notifications.filter(n => n.id !== notificationId);
  notify();
}

export function addDemoNotification(notification) {
  if (!notification?.id) return;
  demoFlow.notifications.unshift(notification);
  notify();
}

/* ======================================================
   SINCRONIZACIÓN ALERTA → CHAT
====================================================== */

export function ensureConversationForAlert(alertId) {
  const alert = getDemoAlertById(alertId);
  if (!alert) return null;

  const existing = demoFlow.conversations.find(c => c.alert_id === alert.id);
  if (existing) return existing.id;

  const conversation = {
    id: genId('conv'),
    participant1_id: 'me',
    participant2_id: alert.user_id === 'me'
      ? alert.reserved_by_id
      : alert.user_id,
    participant1_name: 'Tú',
    participant2_name: alert.user_id === 'me'
      ? alert.reserved_by_name
      : alert.user_name,
    participant1_photo: null,
    participant2_photo: alert.user_id === 'me'
      ? alert.reserved_by_photo
      : alert.user_photo,
    alert_id: alert.id,
    last_message_text: 'Ey! te he enviado un WaitMe!',
    last_message_at: Date.now(),
    unread_count_p1: 1,
    unread_count_p2: 0
  };

  demoFlow.conversations.unshift(conversation);

  demoFlow.messages[conversation.id] = [{
    id: genId('msg'),
    mine: false,
    senderName: conversation.participant2_name,
    senderPhoto: conversation.participant2_photo,
    text: 'Ey! te he enviado un WaitMe!',
    ts: Date.now()
  }];

  notify();
  return conversation.id;
}

export function ensureInitialWaitMeMessage(conversationId) {
  const conv = getDemoConversation(conversationId);
  if (!conv) return;

  if (!demoFlow.messages[conversationId]) {
    demoFlow.messages[conversationId] = [];
  }

  if (demoFlow.messages[conversationId].length === 0) {
    sendDemoMessage(conversationId, 'Ey! te he enviado un WaitMe!', null, false);
  }
}

/* ======================================================
   ACCIÓN UNIFICADA
====================================================== */

export function applyDemoAction({ alertId, action }) {
  const alert = getDemoAlertById(alertId);
  if (!alert) return null;

  const status = normalizeStatus(action);
  alert.status = status;

  const title = statusToTitle(status);
  const conversationId = ensureConversationForAlert(alertId);

  const noti = {
    id: genId('noti'),
    type: 'status_update',
    title,
    text: `${alert.user_name} actualizó el estado.`,
    conversationId,
    alertId,
    createdAt: Date.now(),
    read: false
  };

  demoFlow.notifications.unshift(noti);

  sendDemoMessage(conversationId, `Estado cambiado a ${title}`, null, false);

  notify();
  return noti.id;
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