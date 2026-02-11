import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO CENTRAL ÚNICO (compatibilidad máxima)
   Objetivo: que NINGUNA pantalla "rompa" por imports antiguos.
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) {
  try { fn?.(); } catch {}
}

function notify() {
  listeners.forEach((l) => safeCall(l));
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function normalizeStatus(s) {
  return String(s || '').trim().toLowerCase();
}

function statusToTitle(status) {
  const s = normalizeStatus(status);
  if (s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending') return 'ME LO PIENSO';
  if (s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada') return 'PRÓRROGA';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelada') return 'CANCELADA';
  if (s === 'completed' || s === 'completada') return 'COMPLETADA';
  if (s === 'reserved' || s === 'activa') return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}

/* ======================================================
   ESTADO DEMO (estructura estable)
====================================================== */

const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },

  conversations: [
    {
      id: 'mock_te_reservo_1',
      participant1_id: 'me',
      participant2_id: 'marco',
      participant1_name: 'Tú',
      participant2_name: 'Marco',
      participant1_photo: null,
      participant2_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      alert_id: 'alert_te_reservo_1',
      last_message_text: 'Perfecto, voy llegando en 5 min',
      last_message_at: Date.now() - 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    },
    {
      id: 'mock_reservaste_1',
      participant1_id: 'me',
      participant2_id: 'sofia',
      participant1_name: 'Tú',
      participant2_name: 'Sofía',
      participant1_photo: null,
      participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      alert_id: 'alert_reservaste_1',
      last_message_text: 'Te espero aquí 😊',
      last_message_at: Date.now() - 30_000,
      unread_count_p1: 1,
      unread_count_p2: 0
    }
  ],

  // messages[conversationId] = [{ id, mine, senderName, senderPhoto, text, attachments?, ts }]
  messages: {
    mock_te_reservo_1: [
      { id: 'm1', mine: false, senderName: 'Marco', senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', text: '¿Sigues ahí?', ts: Date.now() - 120_000 },
      { id: 'm2', mine: true, senderName: 'Tú', senderPhoto: null, text: 'Sí, estoy aquí esperando.', ts: Date.now() - 90_000 },
      { id: 'm3', mine: false, senderName: 'Marco', senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', text: 'Perfecto, voy llegando en 5 min', ts: Date.now() - 60_000 }
    ],
    mock_reservaste_1: [
      { id: 'm4', mine: false, senderName: 'Sofía', senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'Ey! te he enviado un WaitMe!', ts: Date.now() - 150_000 },
      { id: 'm5', mine: true, senderName: 'Tú', senderPhoto: null, text: 'Genial! Voy para allá', ts: Date.now() - 120_000 },
      { id: 'm6', mine: false, senderName: 'Sofía', senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'Te espero aquí 😊', ts: Date.now() - 60_000 }
    ]
  },

  alerts: [
    {
      id: 'alert_reservaste_1',
      user_id: 'sofia',
      user_name: 'Sofía',
      user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      car_brand: 'Renault',
      car_model: 'Clio',
      car_plate: '7733 MNP',
      car_color: 'rojo',
      price: 6,
      address: 'Calle Uría, 33, Oviedo',
      latitude: 43.362776,
      longitude: -5.84589,
      allow_phone_calls: true,
      phone: '+34677889900',
      reserved_by_id: 'me',
      reserved_by_name: 'Tú',
      reserved_by_photo: null,
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'reserved'
    },
    {
      id: 'alert_te_reservo_1',
      user_id: 'me',
      user_name: 'Tú',
      user_photo: null,
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_plate: '1234 ABC',
      car_color: 'azul',
      price: 4,
      address: 'Calle Campoamor, 15, Oviedo',
      latitude: 43.357815,
      longitude: -5.84979,
      allow_phone_calls: true,
      phone: null,
      reserved_by_id: 'marco',
      reserved_by_name: 'Marco',
      reserved_by_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'reserved'
    }
  ],

  notifications: [
    {
      id: 'noti_1',
      type: 'status_update',
      title: 'ACTIVA',
      text: 'Sofía te ha enviado un WaitMe.',
      conversationId: 'mock_reservaste_1',
      alertId: 'alert_reservaste_1',
      createdAt: Date.now() - 5 * 60 * 1000,
      read: false
    }
  ]
};

/* ======================================================
   HELPERS INTERNOS
====================================================== */

function getConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

function getAlert(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

function ensureMessagesArray(conversationId) {
  if (!demoFlow.messages) demoFlow.messages = {};
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  return demoFlow.messages[conversationId];
}

function pushSystemMessage(conversationId, text, senderName, senderPhoto) {
  const arr = ensureMessagesArray(conversationId);
  const msg = {
    id: genId('msg'),
    mine: false,
    senderName: senderName || 'Usuario',
    senderPhoto: senderPhoto || null,
    text: String(text || '').trim(),
    ts: Date.now()
  };
  if (!msg.text) return null;
  arr.push(msg);

  const conv = getConversation(conversationId);
  if (conv) {
    conv.last_message_text = msg.text;
    conv.last_message_at = msg.ts;
    conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }
  return msg;
}

/* ======================================================
   API EXPORTADA (compatibilidad total)
====================================================== */

// IMPORTANTÍSIMO: export único del objeto
export { demoFlow };

// start/subscribe/getState
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

// alias legacy
export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

export function getDemoState() {
  return demoFlow;
}

// conversations
export function getDemoConversations() {
  return demoFlow.conversations || [];
}

export function getDemoConversation(conversationId) {
  return getConversation(conversationId);
}

// alias legacy
export function getDemoConversationById(conversationId) {
  return getConversation(conversationId);
}

// messages
export function getDemoMessages(conversationId) {
  return (demoFlow.messages && demoFlow.messages[conversationId]) ? demoFlow.messages[conversationId] : [];
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getConversation(conversationId);
  if (!conv) return;

  const msg = {
    id: genId('msg'),
    mine: !!isMine,
    senderName: isMine ? 'Tú' : (conv.participant2_name || 'Usuario'),
    senderPhoto: isMine ? null : (conv.participant2_photo || null),
    text: clean,
    attachments,
    ts: Date.now()
  };

  const arr = ensureMessagesArray(conversationId);
  arr.push(msg);

  conv.last_message_text = clean;
  conv.last_message_at = msg.ts;

  if (!isMine) {
    conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }

  notify();
}

// alerts
export function getDemoAlerts() {
  return demoFlow.alerts || [];
}

export function getDemoAlertById(alertId) {
  return getAlert(alertId);
}

// notifications
export function getDemoNotifications() {
  return demoFlow.notifications || [];
}

// ✅ lo que te está rompiendo ahora: EXPORTS LEGACY
export function markDemoRead(notificationId) {
  const n = (demoFlow.notifications || []).find((x) => x.id === notificationId);
  if (n) n.read = true;
  notify();
}

// alias legacy
export function markDemoNotificationRead(notificationId) {
  return markDemoRead(notificationId);
}

// alias legacy que también te salió
export function markDemoNotificationReadLegacy(notificationId) {
  return markDemoRead(notificationId);
}

export function markAllDemoRead() {
  (demoFlow.notifications || []).forEach((n) => (n.read = true));
  notify();
}

export function clearDemoNotifications() {
  demoFlow.notifications = [];
  notify();
}

export function addDemoNotification(notification) {
  if (!notification?.id) return;
  demoFlow.notifications = [notification, ...(demoFlow.notifications || [])];
  notify();
}

export function removeDemoNotification(notificationId) {
  demoFlow.notifications = (demoFlow.notifications || []).filter((n) => n.id !== notificationId);
  notify();
}

/* ======================================================
   CONVERSATION CREATOR (exports legacy)
====================================================== */

// Lo han pedido con estos nombres distintos:
export function ensureConversationForAlert(alertId) {
  const alert = getAlert(alertId);
  if (!alert) return null;

  const existing = (demoFlow.conversations || []).find((c) => c.alert_id === alert.id);
  if (existing) return existing.id;

  const participant2_id = alert.user_id === 'me' ? alert.reserved_by_id : alert.user_id;
  const participant2_name = alert.user_id === 'me' ? alert.reserved_by_name : alert.user_name;
  const participant2_photo = alert.user_id === 'me' ? alert.reserved_by_photo : alert.user_photo;

  const conversation = {
    id: genId('conv'),
    participant1_id: 'me',
    participant2_id: participant2_id || 'user',
    participant1_name: 'Tú',
    participant2_name: participant2_name || 'Usuario',
    participant1_photo: null,
    participant2_photo: participant2_photo || null,
    alert_id: alert.id,
    last_message_text: 'Ey! te he enviado un WaitMe!',
    last_message_at: Date.now(),
    unread_count_p1: 1,
    unread_count_p2: 0
  };

  demoFlow.conversations = [conversation, ...(demoFlow.conversations || [])];

  // crea mensaje inicial
  ensureMessagesArray(conversation.id);
  pushSystemMessage(conversation.id, 'Ey! te he enviado un WaitMe!', conversation.participant2_name, conversation.participant2_photo);

  notify();
  return conversation.id;
}

// alias que te salió: ensureConversationForAlert (con otro nombre)
export function ensureConversationForAlertId(alertId) {
  return ensureConversationForAlert(alertId);
}

// te salió también: ensureInitialWaitMeMessage
export function ensureInitialWaitMeMessage(conversationId) {
  const conv = getConversation(conversationId);
  if (!conv) return null;

  const arr = ensureMessagesArray(conversationId);
  const already = arr.some((m) => String(m?.text || '').toLowerCase().includes('waitme'));
  if (already) return null;

  const msg = pushSystemMessage(conversationId, 'Ey! te he enviado un WaitMe!', conv.participant2_name, conv.participant2_photo);
  notify();
  return msg?.id || null;
}

/* ======================================================
   ACCIÓN UNIFICADA
====================================================== */

export function applyDemoAction({ conversationId, alertId, action }) {
  const a = normalizeStatus(action);

  const alert = alertId ? getAlert(alertId) : null;
  if (alert) alert.status = a;

  const convId = conversationId || (alertId ? ensureConversationForAlert(alertId) : null);

  const title = statusToTitle(a);
  const noti = {
    id: genId('noti'),
    type: 'status_update',
    title,
    text: 'Estado actualizado.',
    conversationId: convId,
    alertId,
    createdAt: Date.now(),
    read: false
  };

  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];

  if (convId) {
    const conv = getConversation(convId);
    const who = conv?.participant2_name || 'Usuario';
    const photo = conv?.participant2_photo || null;

    let msgText = '';
    if (title === 'ME LO PIENSO') msgText = 'Me lo pienso…';
    else if (title === 'PRÓRROGA') msgText = 'He pagado una prórroga.';
    else if (title === 'CANCELADA') msgText = 'He cancelado la operación.';
    else if (title === 'COMPLETADA') msgText = 'Operación completada ✅';
    else if (title === 'ACTIVA') msgText = 'Operación activa.';
    else msgText = 'Actualización de estado.';

    pushSystemMessage(convId, msgText, who, photo);
  }

  notify();
  return noti.id;
}

/* ======================================================
   FLAGS (compatibilidad)
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

    // no limpiamos timer: Base44 recarga mucho
  }, []);

  return null;
}