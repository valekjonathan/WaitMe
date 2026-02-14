// ================================
// FILE: src/components/DemoFlowManager.jsx
// ================================

/* ======================================================
   DEMO CENTRAL ÚNICO (EN MEMORIA)
   - App VACÍA por defecto (sin usuarios / tarjetas / chats / notis)
   - Mantiene una API coherente para Home / History / Chats / Chat / Notifications
   - Sincroniza acciones: crear alerta -> reservar -> chat -> notificaciones
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

/* ======================================================
   ESTADO DEMO (ÚNICA FUENTE DE VERDAD)
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

function addNotification({ type, title, text, conversationId, alertId, read = false, fromName = null, fromPhoto = null }) {
  const noti = {
    id: genId('noti'),
    type: type || 'status_update',
    title: title || 'ACTUALIZACIÓN',
    text: text || 'Actualización.',
    conversationId: conversationId || null,
    alertId: alertId || null,
    createdAt: Date.now(),
    read: !!read,
    fromName: fromName || null,
    fromPhoto: fromPhoto || null
  };

  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];
  return noti;
}

/* ======================================================
   RESET (APP VACÍA)
====================================================== */

export function resetDemoEmpty() {
  demoFlow.users = [];
  demoFlow.alerts = [];
  demoFlow.conversations = [];
  demoFlow.messages = {};
  demoFlow.notifications = [];
  notify();
}

/* ======================================================
   API BÁSICA (EXPORTS)
====================================================== */

// ✅ mantenemos DEMO activado para que NO se muestre nada de la base real
export function isDemoMode() { return true; }
export function setDemoMode() { return true; }

export function getDemoState() { return demoFlow; }

export function startDemoFlow() {
  if (started) return;
  started = true;

  resetDemoEmpty();

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

// Home/History
export function getDemoAlerts() { return demoFlow.alerts || []; }

// Alert getters (legacy + nuevos)
export function getDemoAlert(alertId) { return getAlert(alertId); }
export function getDemoAlertById(alertId) { return getAlert(alertId); }
export function getDemoAlertByID(alertId) { return getAlert(alertId); }

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
   CRUD ALERTAS (DEMO / LOCAL)
====================================================== */

export function createDemoAlert(data) {
  const mins = Number(data?.available_in_minutes ?? data?.availableInMinutes ?? 0);
  const now = Date.now();
  const waitUntil = new Date(now + Math.max(0, mins) * 60 * 1000).toISOString();

  const alert = {
    id: genId('alert'),
    is_demo: true,
    status: 'active',
    created_date: new Date(now).toISOString(),
    wait_until: waitUntil,

    // propietario (local)
    user_id: 'me',
    user_name: demoFlow.me.name,
    user_photo: demoFlow.me.photo,

    // datos
    latitude: data?.latitude ?? null,
    longitude: data?.longitude ?? null,
    address: data?.address ?? '',
    price: Number(data?.price) || 0,
    available_in_minutes: mins,

    car_brand: data?.car_brand || '',
    car_model: data?.car_model || '',
    car_color: data?.car_color || '',
    car_plate: data?.car_plate || '',

    phone: data?.phone || null,
    allow_phone_calls: data?.allow_phone_calls ?? true,

    reserved_by_id: null,
    reserved_by_name: null,
    reserved_by_photo: null
  };

  demoFlow.alerts = [alert, ...(demoFlow.alerts || [])];
  notify();
  return alert;
}

export function updateDemoAlert(alertId, patch = {}) {
  if (!alertId) return null;
  const idx = (demoFlow.alerts || []).findIndex((a) => a?.id === alertId);
  if (idx < 0) return null;
  const prev = demoFlow.alerts[idx];
  const next = { ...prev, ...patch };
  demoFlow.alerts = demoFlow.alerts.map((a) => (a?.id === alertId ? next : a));
  notify();
  return next;
}

export function deleteDemoAlert(alertId) {
  if (!alertId) return false;
  const before = (demoFlow.alerts || []).length;
  demoFlow.alerts = (demoFlow.alerts || []).filter((a) => a?.id !== alertId);
  demoFlow.conversations = (demoFlow.conversations || []).filter((c) => c?.alert_id !== alertId);

  if (demoFlow.messages) {
    Object.keys(demoFlow.messages).forEach((k) => {
      if (String(k).includes(String(alertId))) delete demoFlow.messages[k];
    });
  }

  demoFlow.notifications = (demoFlow.notifications || []).filter((n) => n?.alertId !== alertId && n?.alert_id !== alertId);
  notify();
  return (demoFlow.alerts || []).length !== before;
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
    read: false,
    fromName: conv?.participant2_name || null,
    fromPhoto: conv?.participant2_photo || null
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
    text: `Has enviado un WaitMe a ${alert.user_name || 'Usuario'}.`,
    conversationId: conv?.id,
    alertId,
    read: false,
    fromName: alert.user_name || null,
    fromPhoto: alert.user_photo || null
  });

  notify();
  return conv?.id || null;
}
