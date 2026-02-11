import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO CENTRAL ÚNICO (fuente única)
   - CHATS: tarjetas desde conversations (+ relación con alerts)
   - CHAT: mensajes desde messages
   - NOTIFICACIONES: tarjetas desde notifications
   Todo se sincroniza aquí.
====================================================== */

// ----------------------
// Runtime / listeners
// ----------------------
let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) {
  try {
    fn?.();
  } catch {
    // no-op
  }
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

// ----------------------
// Estado DEMO (ÚNICO)
// ----------------------
const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },

  // Conversaciones:
  // id, participant1_id, participant2_id, participant1_name, participant2_name,
  // participant1_photo, participant2_photo, alert_id,
  // last_message_text, last_message_at, unread_count_p1, unread_count_p2
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
    },
    {
      id: 'mock_reservaste_2',
      participant1_id: 'me',
      participant2_id: 'laura',
      participant1_name: 'Tú',
      participant2_name: 'Laura',
      participant1_photo: null,
      participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      alert_id: 'alert_reservaste_2',
      last_message_text: 'Genial, aguanto un poco más',
      last_message_at: Date.now() - 550_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    },
    {
      id: 'mock_te_reservo_2',
      participant1_id: 'me',
      participant2_id: 'carlos',
      participant1_name: 'Tú',
      participant2_name: 'Carlos',
      participant1_photo: null,
      participant2_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      alert_id: 'alert_te_reservo_2',
      last_message_text: 'Hola, estoy cerca',
      last_message_at: Date.now() - 900_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    }
  ],

  // messages[conversationId] = [{ id, mine, senderName, senderPhoto, text, attachments?, ts }]
  messages: {
    mock_te_reservo_1: [
      {
        id: 'm1',
        mine: false,
        senderName: 'Marco',
        senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        text: '¿Sigues ahí?',
        ts: Date.now() - 120_000
      },
      { id: 'm2', mine: true, senderName: 'Tú', senderPhoto: null, text: 'Sí, estoy aquí esperando.', ts: Date.now() - 90_000 },
      {
        id: 'm3',
        mine: false,
        senderName: 'Marco',
        senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        text: 'Perfecto, voy llegando en 5 min',
        ts: Date.now() - 60_000
      }
    ],
    mock_reservaste_1: [
      {
        id: 'm4',
        mine: false,
        senderName: 'Sofía',
        senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Ey! te he enviado un WaitMe!',
        ts: Date.now() - 150_000
      },
      { id: 'm5', mine: true, senderName: 'Tú', senderPhoto: null, text: 'Genial! Voy para allá', ts: Date.now() - 120_000 },
      {
        id: 'm6',
        mine: false,
        senderName: 'Sofía',
        senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Te espero aquí 😊',
        ts: Date.now() - 60_000
      }
    ],
    mock_reservaste_2: [
      {
        id: 'm8',
        mine: false,
        senderName: 'Laura',
        senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        text: 'Estoy en el coche blanco',
        ts: Date.now() - 600_000
      },
      { id: 'm9', mine: true, senderName: 'Tú', senderPhoto: null, text: 'Vale, te veo!', ts: Date.now() - 580_000 },
      {
        id: 'm10',
        mine: false,
        senderName: 'Laura',
        senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        text: 'Genial, aguanto un poco más',
        ts: Date.now() - 550_000
      }
    ],
    mock_te_reservo_2: [
      {
        id: 'm11',
        mine: false,
        senderName: 'Carlos',
        senderPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        text: 'Hola, estoy cerca',
        ts: Date.now() - 900_000
      },
      { id: 'm12', mine: true, senderName: 'Tú', senderPhoto: null, text: 'Ok, estoy en el Seat azul', ts: Date.now() - 880_000 }
    ]
  },

  // ALERTAS (fuente única)
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
    },
    {
      id: 'alert_reservaste_2',
      user_id: 'laura',
      user_name: 'Laura',
      user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      car_brand: 'Opel',
      car_model: 'Corsa',
      car_plate: '9812 GHJ',
      car_color: 'blanco',
      price: 4,
      address: 'Calle San Francisco, 12, Oviedo',
      latitude: 43.36191,
      longitude: -5.84672,
      allow_phone_calls: true,
      phone: '+34612345678',
      reserved_by_id: 'me',
      reserved_by_name: 'Tú',
      reserved_by_photo: null,
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'thinking'
    },
    {
      id: 'alert_te_reservo_2',
      user_id: 'me',
      user_name: 'Tú',
      user_photo: null,
      car_brand: 'Toyota',
      car_model: 'Yaris',
      car_plate: '5678 DEF',
      car_color: 'gris',
      price: 5,
      address: 'Calle Pelayo, 19, Oviedo',
      latitude: 43.35992,
      longitude: -5.8504,
      allow_phone_calls: true,
      phone: null,
      reserved_by_id: 'carlos',
      reserved_by_name: 'Carlos',
      reserved_by_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'extended'
    }
  ],

  // NOTIFICACIONES
  notifications: [
    {
      id: 'noti_1',
      type: 'status_update',
      title: 'ME LO PIENSO',
      text: 'Laura se lo está pensando.',
      conversationId: 'mock_reservaste_2',
      alertId: 'alert_reservaste_2',
      createdAt: Date.now() - 5 * 60 * 1000,
      read: false
    },
    {
      id: 'noti_2',
      type: 'status_update',
      title: 'PRÓRROGA',
      text: 'Carlos ha pagado una prórroga.',
      conversationId: 'mock_te_reservo_2',
      alertId: 'alert_te_reservo_2',
      createdAt: Date.now() - 12 * 60 * 1000,
      read: false
    }
  ]
};

// ======================================================
// EXPORTS que Base44 (y tus pantallas) importan POR NOMBRE
// ======================================================
export { demoFlow };

// ----------------------
// Start / Subscribe
// ----------------------
export function startDemoFlow() {
  if (started) return;
  started = true;

  if (!tickTimer) {
    tickTimer = setInterval(() => {
      // Mantiene “vida” y refresca queries/estado
      notify();
    }, 1000);
  }

  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Alias (por compatibilidad con imports antiguos)
export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

// ----------------------
// Getters base
// ----------------------
export function getDemoState() {
  return demoFlow;
}

export function getDemoConversations() {
  return demoFlow.conversations || [];
}

export function getDemoConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

// Alias que algunas pantallas usan
export function getDemoConversationById(conversationId) {
  return getDemoConversation(conversationId);
}

export function getDemoMessages(conversationId) {
  return demoFlow.messages?.[conversationId] ? demoFlow.messages[conversationId] : [];
}

// ----------------------
// Mensajería
// ----------------------
export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getDemoConversation(conversationId);
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

  if (!demoFlow.messages) demoFlow.messages = {};
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  demoFlow.messages[conversationId].push(msg);

  // Actualiza tarjeta en CHATS
  conv.last_message_text = clean;
  conv.last_message_at = msg.ts;

  // Unread para mí si escribe el otro
  if (!isMine) {
    conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }

  notify();
}

// Alias por si algún sitio lo llama así
export function sendDemoMessageToConversation(conversationId, text, attachments = null, isMine = true) {
  return sendDemoMessage(conversationId, text, attachments, isMine);
}

// ----------------------
// Alerts
// ----------------------
export function getDemoAlerts() {
  return demoFlow.alerts || [];
}

export function getDemoAlertById(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

// ----------------------
// Notifications
// ----------------------
export function getDemoNotifications() {
  return demoFlow.notifications || [];
}

export function markDemoRead(notificationId) {
  const idx = (demoFlow.notifications || []).findIndex((n) => n.id === notificationId);
  if (idx === -1) return;
  demoFlow.notifications[idx] = { ...demoFlow.notifications[idx], read: true };
  notify();
}

// Alias que te está fallando en Base44
export function markDemoNotificationRead(notificationId) {
  return markDemoRead(notificationId);
}

// Alias (por si algún import usa este nombre)
export function markDemoNotificationAsRead(notificationId) {
  return markDemoRead(notificationId);
}

// Alias MUY probable (te salió en error antes)
export function markDemoNotificationReadById(notificationId) {
  return markDemoRead(notificationId);
}

// Alias EXACTO del error: "markDemoNotificationRead"
export function markDemoNotificationReadSafe(notificationId) {
  return markDemoRead(notificationId);
}

// Alias EXACTO del error que te salió: "markDemoNotificationRead"
export function markDemoNotificationReadCompat(notificationId) {
  return markDemoRead(notificationId);
}

// Export con el nombre EXACTO que te pidió Base44 en el popup:
export function markDemoNotificationRead_(notificationId) {
  return markDemoRead(notificationId);
}

// Y el que te salió en screenshot: markDemoNotificationRead (sin sufijos)
export { markDemoRead as markDemoNotificationRead };

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

// ======================================================
// SINCRONIZACIÓN ENTRE NOTIFICACIONES → CHATS → CHAT
// ======================================================

function buildConversationFromAlert(alert) {
  const otherId = alert.user_id === 'me' ? alert.reserved_by_id : alert.user_id;
  const otherName = alert.user_id === 'me' ? alert.reserved_by_name : alert.user_name;
  const otherPhoto = alert.user_id === 'me' ? alert.reserved_by_photo : alert.user_photo;

  return {
    id: genId('conv'),
    participant1_id: 'me',
    participant2_id: otherId || 'user',
    participant1_name: 'Tú',
    participant2_name: otherName || 'Usuario',
    participant1_photo: null,
    participant2_photo: otherPhoto || null,
    alert_id: alert.id,
    last_message_text: 'Ey! te he enviado un WaitMe!',
    last_message_at: Date.now(),
    unread_count_p1: 1,
    unread_count_p2: 0
  };
}

/**
 * ensureConversationForAlert(alertId)
 * - Si no existe conversación asociada a esa alerta: la crea
 * - Devuelve conversationId (compatibilidad máxima)
 */
export function ensureConversationForAlert(alertId) {
  const alert = getDemoAlertById(alertId);
  if (!alert) return null;

  const existing = (demoFlow.conversations || []).find((c) => c.alert_id === alert.id);
  if (existing) return existing.id;

  const conv = buildConversationFromAlert(alert);
  demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];

  if (!demoFlow.messages) demoFlow.messages = {};
  demoFlow.messages[conv.id] = demoFlow.messages[conv.id] || [];

  // Asegura mensaje inicial
  ensureInitialWaitMeMessage(conv.id);

  notify();
  return conv.id;
}

/**
 * ensureConversationForAlertId(alertId)
 * Alias por si alguna pantalla usa ese nombre
 */
export function ensureConversationForAlertId(alertId) {
  return ensureConversationForAlert(alertId);
}

/**
 * ensureConversationForAlert (versión que devuelve objeto)
 * (por si en algún sitio esperan la conversación completa)
 */
export function ensureConversationForAlertObject(alertId) {
  const id = ensureConversationForAlert(alertId);
  return id ? getDemoConversation(id) : null;
}

/**
 * ensureInitialWaitMeMessage(conversationId)
 * - Si el chat está vacío, mete el “Ey! te he enviado un WaitMe!”
 * - Export EXACTO para arreglar tu error actual
 */
export function ensureInitialWaitMeMessage(conversationId) {
  if (!conversationId) return null;

  const conv = getDemoConversation(conversationId);
  if (!conv) return null;

  if (!demoFlow.messages) demoFlow.messages = {};
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];

  const hasAny = demoFlow.messages[conversationId].length > 0;
  if (hasAny) return conversationId;

  const msg = {
    id: genId('msg'),
    mine: false,
    senderName: conv.participant2_name || 'Usuario',
    senderPhoto: conv.participant2_photo || null,
    text: 'Ey! te he enviado un WaitMe!',
    ts: Date.now()
  };

  demoFlow.messages[conversationId].push(msg);

  conv.last_message_text = msg.text;
  conv.last_message_at = msg.ts;
  conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);

  notify();
  return conversationId;
}

// Alias que te salió también: ensureConversationForAlert
export { ensureConversationForAlert as ensureConversationForAlertCompat };

// ======================================================
// ACCIÓN UNIFICADA (para botones aceptar/rechazar/me lo pienso)
// ======================================================
export function applyDemoAction(payload = {}) {
  // Soportamos ambas firmas:
  // 1) { conversationId, alertId, action }
  // 2) { alertId, action } (crea conversación si falta)
  const conversationIdFromPayload = payload.conversationId || null;
  const alertId = payload.alertId || null;
  const action = payload.action || payload.status || payload.type || '';

  const a = normalizeStatus(action);
  const title = statusToTitle(a);

  // 1) Cambia estado alerta
  if (alertId) {
    const alert = getDemoAlertById(alertId);
    if (alert) alert.status = a;
  }

  // 2) Asegura conversación
  let conversationId = conversationIdFromPayload;
  if (!conversationId && alertId) {
    conversationId = ensureConversationForAlert(alertId);
  }

  // 3) Mete notificación (para pantalla NOTIFICACIONES)
  const noti = {
    id: genId('noti'),
    type: 'status_update',
    title,
    text: 'Estado actualizado.',
    conversationId: conversationId || null,
    alertId: alertId || null,
    createdAt: Date.now(),
    read: false
  };
  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];

  // 4) Mete mensaje en CHAT + actualiza tarjeta de CHATS
  if (conversationId) {
    // Asegura chat con mensaje inicial si estaba vacío
    ensureInitialWaitMeMessage(conversationId);

    let msgText = '';
    if (title === 'ME LO PIENSO') msgText = 'Me lo pienso…';
    else if (title === 'PRÓRROGA') msgText = 'He pagado una prórroga.';
    else if (title === 'CANCELADA') msgText = 'He cancelado la operación.';
    else if (title === 'COMPLETADA') msgText = 'Operación completada ✅';
    else if (title === 'ACTIVA') msgText = 'Operación activa.';
    else msgText = 'Actualización de estado.';

    // “Mensaje del otro” para que se vea vida
    sendDemoMessage(conversationId, msgText, null, false);
  }

  notify();
  return noti.id;
}

// ======================================================
// FLAGS (compatibilidad)
// ======================================================
export function isDemoMode() {
  return true;
}

export function setDemoMode() {
  return true;
}

// ======================================================
// COMPONENTE (solo arranca el demo)
// ======================================================
export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow();

    toast({
      title: 'Modo Demo Activo',
      description: 'La app tiene vida simulada.'
    });

    return () => {
      // no limpiamos timer: Base44 recarga mucho
    };
  }, []);

  return null;
}