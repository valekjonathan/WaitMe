import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

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
    { id: 'u1', name: 'Sofía García', photo: 'https://randomuser.me/api/portraits/women/68.jpg', car_brand: 'Renault', car_model: 'Clio', car_color: 'rojo', car_plate: '7733 MNP', phone: '+34677889901', vehicle_type: 'car' },
    { id: 'u2', name: 'Marco López', photo: 'https://randomuser.me/api/portraits/men/12.jpg', car_brand: 'BMW', car_model: 'Serie 1', car_color: 'gris', car_plate: '8890 LTR', phone: '+34677889902', vehicle_type: 'car' },
    { id: 'u3', name: 'Laura Fernández', photo: 'https://randomuser.me/api/portraits/women/44.jpg', car_brand: 'Mercedes', car_model: 'Clase A', car_color: 'negro', car_plate: '7788 RTY', phone: '+34677889903', vehicle_type: 'car' },
    { id: 'u4', name: 'Carlos Ruiz', photo: 'https://randomuser.me/api/portraits/men/55.jpg', car_brand: 'Seat', car_model: 'León', car_color: 'azul', car_plate: '4321 PQR', phone: '+34677889904', vehicle_type: 'car' },
    { id: 'u5', name: 'Elena Martín', photo: 'https://randomuser.me/api/portraits/women/25.jpg', car_brand: 'Mini', car_model: 'Cooper', car_color: 'blanco', car_plate: '5567 ZXC', phone: '+34677889905', vehicle_type: 'car' },
    { id: 'u6', name: 'Daniel Torres', photo: 'https://randomuser.me/api/portraits/men/41.jpg', car_brand: 'Audi', car_model: 'A3', car_color: 'gris', car_plate: '2145 KHB', phone: '+34677889906', vehicle_type: 'car' },
    { id: 'u7', name: 'Paula Sánchez', photo: 'https://randomuser.me/api/portraits/women/12.jpg', car_brand: 'Toyota', car_model: 'Yaris', car_color: 'verde', car_plate: '9001 LKD', phone: '+34677889907', vehicle_type: 'car' },
    { id: 'u8', name: 'Iván Moreno', photo: 'https://randomuser.me/api/portraits/men/18.jpg', car_brand: 'Volkswagen', car_model: 'Golf', car_color: 'azul', car_plate: '3022 MJC', phone: '+34677889908', vehicle_type: 'car' },
    { id: 'u9', name: 'Nerea Jiménez', photo: 'https://randomuser.me/api/portraits/women/37.jpg', car_brand: 'Kia', car_model: 'Rio', car_color: 'rojo', car_plate: '6100 HJP', phone: '+34677889909', vehicle_type: 'car' },
    { id: 'u10', name: 'Hugo Ramírez', photo: 'https://randomuser.me/api/portraits/men/77.jpg', car_brand: 'Peugeot', car_model: '208', car_color: 'amarillo', car_plate: '4509 LST', phone: '+34677889910', vehicle_type: 'car' }
  ];
}

function seedAlerts() {
  demoFlow.alerts = [];

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);

  const defs = [
    { userId: 'u1', status: 'active', price: 3, address: 'Calle Uría, 45, Oviedo', available_in_minutes: 5, created: now - 10000 },
    { userId: 'u2', status: 'active', price: 4, address: 'Calle Campoamor, 12, Oviedo', available_in_minutes: 3, created: now - 20000 },
    { userId: 'u3', status: 'active', price: 6, address: 'Plaza de la Escandalera, 3, Oviedo', available_in_minutes: 7, created: now - 30000 },
    { userId: 'u4', status: 'active', price: 5, address: 'Calle Rosal, 8, Oviedo', available_in_minutes: 4, created: now - 40000 },
    { userId: 'u5', status: 'active', price: 7, address: 'Calle Cervantes, 22, Oviedo', available_in_minutes: 6, created: now - 50000 },

    { userId: 'u6', status: 'reserved', price: 4, address: 'Calle Jovellanos, 15, Oviedo', available_in_minutes: 2, created: oneDayAgo },
    { userId: 'u7', status: 'thinking', price: 3, address: 'Calle San Francisco, 7, Oviedo', available_in_minutes: 8, created: oneDayAgo },
    { userId: 'u8', status: 'extended', price: 5, address: 'Calle Toreno, 19, Oviedo', available_in_minutes: 1, created: twoDaysAgo },
    { userId: 'u9', status: 'cancelled', price: 4, address: 'Calle Fruela, 31, Oviedo', available_in_minutes: 9, created: twoDaysAgo },
    { userId: 'u10', status: 'completed', price: 6, address: 'Calle Independencia, 5, Oviedo', available_in_minutes: 0, created: threeDaysAgo },

    { userId: 'u1', status: 'completed', price: 5, address: 'Avenida de Galicia, 18, Oviedo', available_in_minutes: 0, created: threeDaysAgo },
    { userId: 'u2', status: 'cancelled', price: 3, address: 'Calle Marqués de Santa Cruz, 10, Oviedo', available_in_minutes: 0, created: threeDaysAgo },
    { userId: 'u3', status: 'reserved', price: 4, address: 'Calle Melquíades Álvarez, 25, Oviedo', available_in_minutes: 5, created: oneDayAgo },
    { userId: 'u4', status: 'active', price: 6, address: 'Calle Argüelles, 9, Oviedo', available_in_minutes: 10, created: now - 60000 },
    { userId: 'u5', status: 'thinking', price: 5, address: 'Calle Quintana, 14, Oviedo', available_in_minutes: 7, created: oneDayAgo }
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
      vehicle_type: u?.vehicle_type || 'car',
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

      target_time: d.created + (d.available_in_minutes * 60 * 1000),
      created_date: new Date(d.created).toISOString(),
      status: d.status
    });
  });
}

function seedConversationsAndMessages() {
  demoFlow.conversations = [];
  demoFlow.messages = {};

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);

  const linked = demoFlow.alerts.filter((a) => normalize(a.status) !== 'active');

  linked.forEach((a, idx) => {
    const other = pickUser(a.user_id);
    const convId = `conv_${a.id}_me`;

    a.reserved_by_id = 'me';
    a.reserved_by_name = demoFlow.me.name;
    a.reserved_by_photo = demoFlow.me.photo;

    const baseTime = idx === 0 ? now - 5_000 : 
                     idx === 1 ? oneDayAgo : 
                     idx === 2 ? twoDaysAgo : threeDaysAgo;

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
      last_message_at: baseTime,
      unread_count_p1: idx < 3 ? 1 : 0,
      unread_count_p2: 0
    };

    demoFlow.conversations.push(conv);
    ensureMessagesArray(convId);

    pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Ey! te he enviado un WaitMe!' });
    pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Perfecto, lo tengo. Te leo por aquí.' });

    const st = normalize(a.status);
    if (st === 'thinking') {
      pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Me lo estoy pensando… ahora te digo.' });
      pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Vale, sin problema! Avísame cuando decidas.' });
    }
    if (st === 'extended') {
      pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Necesito 5 minutos más, te pido prórroga.' });
      pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Aceptado. He pagado la prórroga de 1€.' });
    }
    if (st === 'cancelled') {
      pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Lo siento, no puedo ahora mismo.' });
      pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Ok, cancelo la operación. Gracias!' });
    }
    if (st === 'completed') {
      pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Ya estoy saliendo del parking.' });
      pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Perfecto, estoy llegando!' });
      pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Operación completada ✅ Gracias!' });
    }
    if (st === 'reserved') {
      pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Aceptado! Nos vemos en el parking.' });
      pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Genial! Voy para allá.' });
    }
  });

  demoFlow.conversations.sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
}

function seedNotifications() {
  demoFlow.notifications = [];

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

  const allReserved = demoFlow.alerts.filter((a) => normalize(a.status) === 'reserved');
  const allThinking = demoFlow.alerts.filter((a) => normalize(a.status) === 'thinking');
  const allExtended = demoFlow.alerts.filter((a) => normalize(a.status) === 'extended');
  const allCancelled = demoFlow.alerts.filter((a) => normalize(a.status) === 'cancelled');
  const allCompleted = demoFlow.alerts.filter((a) => normalize(a.status) === 'completed');

  allReserved.forEach((a) => {
    const convId = `conv_${a.id}_me`;
    addNotification({ type: 'incoming_waitme', title: 'ACTIVA', text: `${a.user_name} aceptó tu WaitMe.`, conversationId: convId, alertId: a.id, read: false });
    addNotification({ type: 'reservation_accepted', title: 'RESERVA ACEPTADA', text: `${a.user_name} aceptó la reserva.`, conversationId: convId, alertId: a.id, read: false });
  });

  allThinking.forEach((a) => {
    const convId = `conv_${a.id}_me`;
    addNotification({ type: 'status_update', title: 'ME LO PIENSO', text: `${a.user_name} se lo está pensando.`, conversationId: convId, alertId: a.id, read: false });
  });

  allExtended.forEach((a) => {
    const convId = `conv_${a.id}_me`;
    addNotification({ type: 'prorroga_request', title: 'PRÓRROGA SOLICITADA', text: `${a.user_name} pidió prórroga (+1€).`, conversationId: convId, alertId: a.id, read: false });
    addNotification({ type: 'prorroga_accepted', title: 'PRÓRROGA ACEPTADA', text: `Prórroga aceptada. +5 minutos.`, conversationId: convId, alertId: a.id, read: true });
  });

  allCancelled.forEach((a) => {
    const convId = `conv_${a.id}_me`;
    addNotification({ type: 'cancellation', title: 'CANCELACIÓN', text: `${a.user_name} canceló la operación.`, conversationId: convId, alertId: a.id, read: true });
  });

  allCompleted.forEach((a) => {
    const convId = `conv_${a.id}_me`;
    addNotification({ type: 'payment_completed', title: 'PAGO COMPLETADO', text: `Pago confirmado (${a.price}€). Operación completada.`, conversationId: convId, alertId: a.id, read: true });
    addNotification({ type: 'buyer_nearby', title: 'COMPRADOR CERCA', text: `El comprador llegó al parking.`, conversationId: convId, alertId: a.id, read: true });
  });

  demoFlow.notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    startDemoFlow();
    toast({ title: 'Modo Demo Activo', description: 'La app tiene vida simulada.' });
    // no limpiamos timer: Base44 recarga mucho
  }, []);
  return null;
}