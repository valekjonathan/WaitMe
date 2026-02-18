import { useEffect } from 'react';

/* ======================================================
   DEMO CENTRAL ÚNICO (LIMPIO + SINCRONIZADO)
   - Unifica datos para Home / History / Chats / Chat / Notifications
   - Mantiene la app “viva” siempre
   - Compatibilidad: exports legacy + aliases
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalize(s) { return String(s || '').trim().toLowerCase(); }

function statusToTitle(status) {
  const s = normalize(status);
  if (s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending') return 'ME LO PIENSO';
  if (s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada') return 'PRÓRROGA';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelada') return 'CANCELADA';
  if (s === 'expired' || s === 'expirada' || s === 'agotada') return 'AGOTADA';
  if (s === 'rejected' || s === 'rechazada') return 'RECHAZADA';
  if (s === 'completed' || s === 'completada') return 'COMPLETADA';
  if (s === 'reserved' || s === 'activa' || s === 'active') return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}

const BASE_LAT = 43.3623;   // Oviedo aprox
const BASE_LNG = -5.8489;

function rnd(min, max) { return Math.random() * (max - min) + min; }
function nearLat() { return BASE_LAT + rnd(-0.0045, 0.0045); }
function nearLng() { return BASE_LNG + rnd(-0.0060, 0.0060); }

/* ======================================================
   ESTADO DEMO (ÚNICA FUENTE DE VERDAD)
====================================================== */

export const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },

  users: [],
  alerts: [],

  // lista para Chats
  conversations: [],

  // messages[conversationId] = []
  messages: {},

  // lista para Notifications
  notifications: []
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

function pushMessage(conversationId, { mine, senderName, senderPhoto, text, attachments = null }) {
  const arr = ensureMessagesArray(conversationId);

  const msg = {
    id: genId('msg'),
    mine: !!mine,
    senderName: senderName || (mine ? demoFlow.me.name : 'Usuario'),
    senderPhoto: senderPhoto || null,
    text: String(text || '').trim(),
    attachments,
    ts: Date.now()
  };

  if (!msg.text) return null;

  arr.push(msg);

  const conv = getConversation(conversationId);
  if (conv) {
    conv.last_message_text = msg.text;
    conv.last_message_at = msg.ts;
    if (!msg.mine) conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }

  return msg;
}

function addNotification({ type, title, text, conversationId, alertId, read = false }) {
  const noti = {
    id: genId('noti'),
    type: type || 'status_update',
    title: title || 'ACTUALIZACIÓN',
    text: text || 'Actualización.',
    conversationId: conversationId || null,
    alertId: alertId || null,
    createdAt: Date.now(),
    read: !!read
  };

  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];
  return noti;
}

function pickUser(userId) {
  return (demoFlow.users || []).find((u) => u.id === userId) || null;
}

/* ======================================================
   SEED (10 USUARIOS + ALERTAS + CONVERS + MENSAJES + NOTIS)
====================================================== */

function buildUsers() {
  demoFlow.users = [
    { id: 'u1', name: 'Sofía', photo: 'https://randomuser.me/api/portraits/women/68.jpg', car_brand: 'Renault', car_model: 'Clio', car_color: 'rojo', car_plate: '7733 MNP', phone: '+34677889901' },
    { id: 'u2', name: 'Marco', photo: 'https://randomuser.me/api/portraits/men/12.jpg', car_brand: 'BMW', car_model: 'Serie 1', car_color: 'gris', car_plate: '8890 LTR', phone: '+34677889902' },
    { id: 'u3', name: 'Laura', photo: 'https://randomuser.me/api/portraits/women/44.jpg', car_brand: 'Mercedes', car_model: 'Clase A', car_color: 'negro', car_plate: '7788 RTY', phone: '+34677889903' },
    { id: 'u4', name: 'Carlos', photo: 'https://randomuser.me/api/portraits/men/55.jpg', car_brand: 'Seat', car_model: 'León', car_color: 'azul', car_plate: '4321 PQR', phone: '+34677889904' },
    { id: 'u5', name: 'Elena', photo: 'https://randomuser.me/api/portraits/women/25.jpg', car_brand: 'Mini', car_model: 'Cooper', car_color: 'blanco', car_plate: '5567 ZXC', phone: '+34677889905' },
    { id: 'u6', name: 'Dani', photo: 'https://randomuser.me/api/portraits/men/41.jpg', car_brand: 'Audi', car_model: 'A3', car_color: 'gris', car_plate: '2145 KHB', phone: '+34677889906' },
    { id: 'u7', name: 'Paula', photo: 'https://randomuser.me/api/portraits/women/12.jpg', car_brand: 'Toyota', car_model: 'Yaris', car_color: 'verde', car_plate: '9001 LKD', phone: '+34677889907' },
    { id: 'u8', name: 'Iván', photo: 'https://randomuser.me/api/portraits/men/18.jpg', car_brand: 'Volkswagen', car_model: 'Golf', car_color: 'azul', car_plate: '3022 MJC', phone: '+34677889908' },
    { id: 'u9', name: 'Nerea', photo: 'https://randomuser.me/api/portraits/women/37.jpg', car_brand: 'Kia', car_model: 'Rio', car_color: 'rojo', car_plate: '6100 HJP', phone: '+34677889909' },
    { id: 'u10', name: 'Hugo', photo: 'https://randomuser.me/api/portraits/men/77.jpg', car_brand: 'Peugeot', car_model: '208', car_color: 'amarillo', car_plate: '4509 LST', phone: '+34677889910' }
  ];
}

function seedAlerts() {
  demoFlow.alerts = [];

  const defs = [
    { userId: 'u1', status: 'active', price: 3, address: 'Calle Uría, Oviedo', available_in_minutes: 5 },
    { userId: 'u2', status: 'active', price: 4, address: 'Calle Campoamor, Oviedo', available_in_minutes: 3 },
    { userId: 'u3', status: 'active', price: 6, address: 'Plaza de la Escandalera, Oviedo', available_in_minutes: 7 },
    { userId: 'u4', status: 'active', price: 5, address: 'Calle Rosal, Oviedo', available_in_minutes: 4 },
    { userId: 'u5', status: 'active', price: 7, address: 'Calle Cervantes, Oviedo', available_in_minutes: 6 },

    { userId: 'u6', status: 'reserved', price: 4, address: 'Calle Jovellanos, Oviedo', available_in_minutes: 2 },
    { userId: 'u7', status: 'thinking', price: 3, address: 'Calle San Francisco, Oviedo', available_in_minutes: 8 },
    { userId: 'u8', status: 'extended', price: 5, address: 'Calle Toreno, Oviedo', available_in_minutes: 1 },
    { userId: 'u9', status: 'cancelled', price: 4, address: 'Calle Fruela, Oviedo', available_in_minutes: 9 },
    { userId: 'u10', status: 'completed', price: 6, address: 'Calle Independencia, Oviedo', available_in_minutes: 0 }
  ];

  defs.forEach((d, i) => {
    const u = pickUser(d.userId);
    const id = `alert_${i + 1}`;

    demoFlow.alerts.push({
      id,
      is_demo: true,
      user_id: u?.id,
      user_name: u?.name,
      user_photo: u?.photo,
      car_brand: u?.car_brand,
      car_model: u?.car_model,
      car_color: u?.car_color,
      car_plate: u?.car_plate,
      price: d.price,
      available_in_minutes: d.available_in_minutes,
      latitude: nearLat(),
      longitude: nearLng(),
      address: d.address,
      allow_phone_calls: true,
      phone: u?.phone || null,

      reserved_by_id: null,
      reserved_by_name: null,
      reserved_by_photo: null,

      target_time: Date.now() + (10 * 60 * 1000),
      status: d.status
    });
  });
}

function seedConversationsAndMessages() {
  demoFlow.conversations = [];
  demoFlow.messages = {};

  const linked = demoFlow.alerts.filter((a) => normalize(a.status) !== 'active');

  linked.forEach((a) => {
    const other = pickUser(a.user_id);
    const convId = `conv_${a.id}_me`;

    a.reserved_by_id = 'me';
    a.reserved_by_name = demoFlow.me.name;
    a.reserved_by_photo = demoFlow.me.photo;

    const conv = {
      id: convId,

      participant1_id: 'me',
      participant2_id: other?.id,
      participant1_name: demoFlow.me.name,
      participant2_name: other?.name,
      participant1_photo: demoFlow.me.photo,
      participant2_photo: other?.photo,

      other_name: other?.name,
      other_photo: other?.photo,

      alert_id: a.id,

      last_message_text: '',
      last_message_at: Date.now() - 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    };

    demoFlow.conversations.push(conv);
    ensureMessagesArray(convId);

    pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Ey! te he enviado un WaitMe!' });
    pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Perfecto, lo tengo. Te leo por aquí.' });

    const st = normalize(a.status);
    if (st === 'thinking') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Me lo estoy pensando… ahora te digo.' });
    if (st === 'extended') pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'He pagado la prórroga.' });
    if (st === 'cancelled') pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Cancelo la operación.' });
    if (st === 'completed') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Operación completada ✅' });
  });

  demoFlow.conversations.sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
}

function seedNotifications() {
  demoFlow.notifications = [];

  const findBy = (st) => demoFlow.alerts.find((a) => normalize(a.status) === st);

  const aReserved = findBy('reserved');
  const aThinking = findBy('thinking');
  const aExtended = findBy('extended');
  const aCancelled = findBy('cancelled');
  const aCompleted = findBy('completed');

  const convReserved = aReserved ? `conv_${aReserved.id}_me` : null;
  const convThinking = aThinking ? `conv_${aThinking.id}_me` : null;
  const convExtended = aExtended ? `conv_${aExtended.id}_me` : null;
  const convCancelled = aCancelled ? `conv_${aCancelled.id}_me` : null;
  const convCompleted = aCompleted ? `conv_${aCompleted.id}_me` : null;

  if (aReserved) addNotification({ type: 'incoming_waitme', title: 'ACTIVA', text: `${aReserved.user_name} te ha enviado un WaitMe.`, conversationId: convReserved, alertId: aReserved.id, read: false });
  if (aThinking) addNotification({ type: 'status_update', title: 'ME LO PIENSO', text: `${aThinking.user_name} se lo está pensando.`, conversationId: convThinking, alertId: aThinking.id, read: false });
  if (aExtended) addNotification({ type: 'prorroga_request', title: 'PRÓRROGA SOLICITADA', text: `${aExtended.user_name} pide una prórroga (+1€).`, conversationId: convExtended, alertId: aExtended.id, read: false });
  if (aCompleted) addNotification({ type: 'payment_completed', title: 'PAGO COMPLETADO', text: `Pago confirmado (${aCompleted.price}€).`, conversationId: convCompleted, alertId: aCompleted.id, read: true });
  if (aCancelled) addNotification({ type: 'cancellation', title: 'CANCELACIÓN', text: `Operación cancelada.`, conversationId: convCancelled, alertId: aCancelled.id, read: true });

  if (aReserved) addNotification({ type: 'buyer_nearby', title: 'COMPRADOR CERCA', text: `El comprador está llegando.`, conversationId: convReserved, alertId: aReserved.id, read: false });
  if (aReserved) addNotification({ type: 'reservation_accepted', title: 'RESERVA ACEPTADA', text: `Reserva aceptada.`, conversationId: convReserved, alertId: aReserved.id, read: true });
  if (aReserved) addNotification({ type: 'reservation_rejected', title: 'RESERVA RECHAZADA', text: `Reserva rechazada.`, conversationId: convReserved, alertId: aReserved.id, read: true });
  if (aReserved) addNotification({ type: 'time_expired', title: 'TIEMPO AGOTADO', text: `Se agotó el tiempo.`, conversationId: convReserved, alertId: aReserved.id, read: true });
}

function resetDemo() {
  buildUsers();
  seedAlerts();
  seedConversationsAndMessages();
  seedNotifications();
}

/* ======================================================
   API (EXPORTS) - lo que usan tus pantallas
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

// alias legacy
export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

// Chats
export function getDemoConversations() { return demoFlow.conversations || []; }
export function getDemoAlerts() { return demoFlow.alerts || []; }

// Alert getters (legacy + nuevos)
export function getDemoAlert(alertId) { return getAlert(alertId); }
export function getDemoAlertById(alertId) { return getAlert(alertId); } // <- para que NO rompa
export function getDemoAlertByID(alertId) { return getAlert(alertId); } // <- alias extra

// Chat
export function getDemoConversation(conversationId) { return getConversation(conversationId); }
export function getDemoConversationById(conversationId) { return getConversation(conversationId); }

export function getDemoMessages(conversationId) {
  return (demoFlow.messages && demoFlow.messages[conversationId]) ? demoFlow.messages[conversationId] : [];
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getConversation(conversationId);
  if (!conv) return;

  if (isMine) {
    pushMessage(conversationId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: clean, attachments });
  } else {
    pushMessage(conversationId, { mine: false, senderName: conv.participant2_name, senderPhoto: conv.participant2_photo, text: clean, attachments });
  }

  notify();
}

// Notifications
export function getDemoNotifications() { return demoFlow.notifications || []; }

// ✅ EXPORTS LEGACY QUE TE ESTÁN PIDIENDO AHORA MISMO
export function markDemoRead(notificationId) {
  const n = (demoFlow.notifications || []).find((x) => x.id === notificationId);
  if (n) n.read = true;
  notify();
}

// alias legacy
export function markDemoNotificationRead(notificationId) { return markDemoRead(notificationId); }
export function markDemoNotificationReadLegacy(notificationId) { return markDemoRead(notificationId); }
export function markAllDemoRead() {
  (demoFlow.notifications || []).forEach((n) => (n.read = true));
  notify();
}

/* ======================================================
   CONVERSACIÓN ↔ ALERTA
====================================================== */

export function ensureConversationForAlert(alertId, hint = null) {
  if (!alertId) return null;

  const existing = (demoFlow.conversations || []).find((c) => c.alert_id === alertId);
  if (existing) return existing;

  const alert = getAlert(alertId);

  const otherName =
    hint?.fromName ||
    hint?.otherName ||
    alert?.user_name ||
    'Usuario';

  const otherPhoto =
    hint?.otherPhoto ||
    hint?.fromPhoto ||
    alert?.user_photo ||
    null;

  const convId = `conv_${alertId}_me`;

  const conv = {
    id: convId,
    participant1_id: 'me',
    participant2_id: alert?.user_id || genId('u'),
    participant1_name: demoFlow.me.name,
    participant2_name: otherName,
    participant1_photo: demoFlow.me.photo,
    participant2_photo: otherPhoto,

    other_name: otherName,
    other_photo: otherPhoto,

    alert_id: alertId,
    last_message_text: '',
    last_message_at: Date.now(),
    unread_count_p1: 0,
    unread_count_p2: 0
  };

  demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];
  ensureMessagesArray(convId);
  notify();
  return conv;
}

// legacy: si algún código espera ID string
export function ensureConversationForAlertId(alertId) {
  const conv = ensureConversationForAlert(alertId);
  return conv?.id || null;
}

export function ensureInitialWaitMeMessage(conversationId) {
  const conv = getConversation(conversationId);
  if (!conv) return null;

  const arr = ensureMessagesArray(conversationId);
  const already = arr.some((m) => String(m?.text || '').toLowerCase().includes('te he enviado un waitme'));
  if (already) return null;

  const msg = pushMessage(conversationId, {
    mine: true,
    senderName: demoFlow.me.name,
    senderPhoto: demoFlow.me.photo,
    text: 'Ey! te he enviado un WaitMe!'
  });

  notify();
  return msg?.id || null;
}

/* ======================================================
   ACCIONES (Notifications -> applyDemoAction)
====================================================== */

export function applyDemoAction({ conversationId, alertId, action }) {
  const a = normalize(action);
  const title = statusToTitle(a);

  const alert = alertId ? getAlert(alertId) : null;
  if (alert) alert.status = a;

  const conv = conversationId ? getConversation(conversationId) : (alertId ? ensureConversationForAlert(alertId) : null);
  const convId = conv?.id || null;

  addNotification({
    type: 'status_update',
    title,
    text: 'Estado actualizado.',
    conversationId: convId,
    alertId,
    read: false
  });

  if (convId) {
    let msgText = '';
    if (title === 'ME LO PIENSO') msgText = 'Me lo estoy pensando…';
    else if (title === 'PRÓRROGA') msgText = 'Pido una prórroga.';
    else if (title === 'CANCELADA') msgText = 'Cancelo la operación.';
    else if (title === 'RECHAZADA') msgText = 'Rechazo la operación.';
    else if (title === 'COMPLETADA') msgText = 'Operación completada ✅';
    else if (title === 'ACTIVA') msgText = 'Operación activa.';
    else msgText = 'Actualización de estado.';

    pushMessage(convId, {
      mine: false,
      senderName: conv?.participant2_name || 'Usuario',
      senderPhoto: conv?.participant2_photo || null,
      text: msgText
    });
  }

  notify();
}

/* ======================================================
   RESERVAR
====================================================== */

export function reserveDemoAlert(alertId) {
  const alert = getAlert(alertId);
  if (!alert) return null;
  if (normalize(alert.status) !== 'active') return null;

  alert.status = 'reserved';
  alert.reserved_by_id = 'me';
  alert.reserved_by_name = demoFlow.me.name;
  alert.reserved_by_photo = demoFlow.me.photo;

  const conv = ensureConversationForAlert(alertId, {
    fromName: alert.user_name,
    otherPhoto: alert.user_photo
  });

  ensureInitialWaitMeMessage(conv?.id);

  addNotification({
    type: 'status_update',
    title: 'ACTIVA',
    text: `Has enviado un WaitMe a ${alert.user_name}.`,
    conversationId: conv?.id,
    alertId,
    read: false
  });

  notify();
  return conv?.id || null;
}

// flags legacy
export function setDemoMode() { return true; }

/* ======================================================
   COMPONENTE
====================================================== */

export default function DemoFlowManager() {
  useEffect(() => {
    // Siempre activo: la app arranca con datos y se ve igual en Preview y en iPhone (PWA).
    startDemoFlow();
  }, []);
  return null;
}
