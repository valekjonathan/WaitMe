import { useEffect } from 'react';

/* ======================================================
   DEMO FLOW (UNA SEMANA DE ACTIVIDAD) — SINCRONIZADO
   - Chats, Notificaciones, Alertas, Reservas, Mapa (10 coches)
   - NO toca visual: solo datos y lógica
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

const BASE_LAT = 43.3623;   // Oviedo aprox
const BASE_LNG = -5.8489;

function rnd(min, max) { return Math.random() * (max - min) + min; }
function nearLat() { return BASE_LAT + rnd(-0.0045, 0.0045); }
function nearLng() { return BASE_LNG + rnd(-0.0060, 0.0060); }

export const demoFlow = {
  me: { id: 'me', name: 'Jonathan', photo: null },

  // 10 usuarios
  users: [],

  // Alertas del usuario (Tus alertas / Tus reservas) + historial
  alerts: [],

  // Alertas “mercado” para el mapa (10 coches alrededor)
  marketAlerts: [],

  // Chats (lista) y mensajes
  conversations: [],
  messages: {},

  // Notificaciones
  notifications: []
};

/* ======================================================
   DEMO MODE
====================================================== */

export function isDemoMode() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('demo') === 'false') return false;
    // En preview queremos SIEMPRE demo vivo.
    return true;
  } catch {
    return true;
  }
}

export function getDemoState() { return demoFlow; }

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// alias legacy
export function subscribeToDemoFlow(cb) { return subscribeDemoFlow(cb); }

/* ======================================================
   SEED: 10 usuarios + 7 días de actividad
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

function pickUser(userId) {
  return (demoFlow.users || []).find((u) => u.id === userId) || null;
}

function seedMarketAlerts() {
  // 10 coches alrededor (buscador)
  demoFlow.marketAlerts = (demoFlow.users || []).map((u, idx) => ({
    id: `m_${u.id}`,
    user_id: u.id,
    user_name: u.name,
    user_photo: u.photo,
    latitude: nearLat(),
    longitude: nearLng(),
    address: idx % 2 === 0 ? 'Oviedo' : 'Calle Campoamor, Oviedo',
    price: 3 + (idx % 6),
    available_in_minutes: 5 + (idx % 8) * 5,
    vehicle_type: idx % 3 === 0 ? 'van' : (idx % 3 === 1 ? 'suv' : 'car'),
    car_color: u.car_color || 'gris',
    status: 'active',
    created_date: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString()
  }));
}

function addConversationForAlert(alertId, otherUserId, lastAt) {
  const other = pickUser(otherUserId);
  const id = `conv_${alertId}_${otherUserId}`;
  demoFlow.conversations.push({
    id,
    alertId,
    otherUserId,
    otherName: other?.name || 'Usuario',
    otherPhoto: other?.photo || null,
    last_message_at: lastAt,
    unread: 0
  });
  demoFlow.messages[id] = [];
  return id;
}

function pushMessage(conversationId, { mine, text, at, senderName, senderPhoto }) {
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  demoFlow.messages[conversationId].push({
    id: genId('msg'),
    mine: !!mine,
    text: text || '',
    created_at: at || Date.now(),
    senderName: senderName || (mine ? demoFlow.me.name : 'Usuario'),
    senderPhoto: senderPhoto || null
  });
  const conv = demoFlow.conversations.find((c) => c.id === conversationId);
  if (conv) conv.last_message_at = at || Date.now();
}

function addNotification(n) {
  demoFlow.notifications.unshift({
    id: genId('noti'),
    created_at: Date.now(),
    read: false,
    ...n
  });
}

function seedWeekAlertsChatsNotifications() {
  const now = Date.now();
  // estados posibles que ya usas en UI
  const statuses = [
    { st: 'reserved', u: 'u2', daysAgo: 0, price: 3 },
    { st: 'thinking', u: 'u3', daysAgo: 1, price: 4 },
    { st: 'extended', u: 'u4', daysAgo: 2, price: 5 },
    { st: 'cancelled', u: 'u5', daysAgo: 3, price: 6 },
    { st: 'expired', u: 'u6', daysAgo: 4, price: 7 },
    { st: 'rejected', u: 'u7', daysAgo: 5, price: 8 },
    { st: 'completed', u: 'u8', daysAgo: 6, price: 9 }
  ];

  // Tu alerta activa actual (sin usuario todavía)
  const activeCreated = now - 10 * 60 * 1000;
  demoFlow.alerts = [{
    id: 'a_active_me',
    user_id: 'me',
    user_name: demoFlow.me.name,
    user_photo: demoFlow.me.photo,
    latitude: BASE_LAT,
    longitude: BASE_LNG,
    address: 'Calle Campoamor, Oviedo',
    price: 3,
    available_in_minutes: 5,
    wait_until: new Date(now + 5 * 60 * 1000).toISOString(),
    created_date: new Date(activeCreated).toISOString(),
    created_from: 'parked_here',
    status: 'active'
  }];

  // Historial semana (finalizadas / reservas)
  statuses.forEach((s, idx) => {
    const other = pickUser(s.u);
    const createdAt = now - s.daysAgo * 24 * 3600 * 1000 - (idx + 1) * 30 * 60 * 1000;
    const alertId = `a_${s.st}_${s.u}`;
    demoFlow.alerts.push({
      id: alertId,
      user_id: 'me',
      user_name: demoFlow.me.name,
      user_photo: demoFlow.me.photo,
      latitude: BASE_LAT,
      longitude: BASE_LNG,
      address: idx % 2 === 0 ? 'Calle Melquíades Álvarez, Oviedo' : 'Calle Uría, Oviedo',
      price: s.price,
      available_in_minutes: 10 + idx * 5,
      wait_until: new Date(createdAt + (10 + idx * 5) * 60 * 1000).toISOString(),
      created_date: new Date(createdAt).toISOString(),
      created_from: 'parked_here',
      status: s.st,
      other_user_id: other?.id,
      other_user_name: other?.name,
      other_user_photo: other?.photo,
      other_user_phone: other?.phone,
      other_car_brand: other?.car_brand,
      other_car_model: other?.car_model,
      other_car_color: other?.car_color,
      other_car_plate: other?.car_plate,
      distance_km: Number((rnd(0.2, 3.8)).toFixed(1))
    });

    const convId = addConversationForAlert(alertId, other?.id, createdAt + 5 * 60 * 1000);
    // Mensajes variados
    pushMessage(convId, { mine: true, senderName: demoFlow.me.name, text: 'Estoy listo cuando quieras.', at: createdAt + 2 * 60 * 1000 });
    pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Voy de camino 🚗', at: createdAt + 5 * 60 * 1000 });
    if (s.st === 'thinking') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Dame 1 minuto que lo miro…', at: createdAt + 8 * 60 * 1000 });
    if (s.st === 'extended') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: '¿Puedes darme prórroga? (+1€)', at: createdAt + 9 * 60 * 1000 });
    if (s.st === 'rejected') pushMessage(convId, { mine: true, senderName: demoFlow.me.name, text: 'No me cuadra, lo siento.', at: createdAt + 10 * 60 * 1000 });
    if (s.st === 'cancelled') pushMessage(convId, { mine: true, senderName: demoFlow.me.name, text: 'Cancelo la operación.', at: createdAt + 10 * 60 * 1000 });
    if (s.st === 'completed') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Operación completada ✅', at: createdAt + 12 * 60 * 1000 });

    // Notificaciones variadas
    if (s.st === 'reserved') addNotification({ type: 'reservation_accepted', title: 'RESERVA', text: `${other?.name} reservó tu WaitMe.`, fromName: other?.name, fromPhoto: other?.photo, alertId });
    if (s.st === 'thinking') addNotification({ type: 'status_update', title: 'ME LO PIENSO', text: `${other?.name} se lo está pensando.`, fromName: other?.name, fromPhoto: other?.photo, alertId });
    if (s.st === 'extended') addNotification({ type: 'prorroga_request', title: 'PRÓRROGA SOLICITADA', text: `${other?.name} pide prórroga (+1€).`, fromName: other?.name, fromPhoto: other?.photo, alertId });
    if (s.st === 'expired') addNotification({ type: 'time_expired', title: 'AGOTADA', text: `El tiempo expiró.`, alertId });
    if (s.st === 'rejected') addNotification({ type: 'reservation_rejected', title: 'RECHAZADA', text: `Rechazaste una solicitud.`, alertId });
    if (s.st === 'completed') addNotification({ type: 'payment_completed', title: 'PAGO COMPLETADO', text: `Pago confirmado (${s.price}€).`, alertId, read: true });
    if (s.st === 'cancelled') addNotification({ type: 'cancellation', title: 'CANCELACIÓN', text: `Operación cancelada.`, alertId, read: true });
  });

  // Ordena chats por última actividad
  demoFlow.conversations.sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
}

function seedAll() {
  buildUsers();
  seedMarketAlerts();
  seedWeekAlertsChatsNotifications();
}

/* ======================================================
   START
====================================================== */

export function startDemoFlow() {
  if (started) return;
  started = true;

  // Seed persistente (para que parezca “una semana”)
  try {
    const key = 'waitme_demo_seed_v1';
    const saved = window.localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(demoFlow, parsed);
    } else {
      seedAll();
      window.localStorage.setItem(key, JSON.stringify(demoFlow));
    }
  } catch {
    seedAll();
  }

  // tick suave para timers UI
  // Si hay alerta activa, simula 1 solicitud entrante en 60s (solo una vez)
  try {
    const already = (demoFlow.notifications || []).some((n) => n?.type === 'incoming_waitme');
    const active = (demoFlow.alerts || []).find((a) => String(a?.status || '').toLowerCase() === 'active');
    if (!already && active) scheduleIncomingWaitMeRequest(active.id, 60000);
  } catch {}

  tickTimer = window.setInterval(() => notify(), 1000);
  notify();
}

/* ======================================================
   GETTERS
====================================================== */

export function getDemoConversations() { return demoFlow.conversations || []; }
export function getDemoAlerts() { return demoFlow.alerts || []; }
export function getDemoMarketAlerts() { return demoFlow.marketAlerts || []; }

export function getDemoConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

export function getDemoAlertById(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}
export function getDemoAlert(alertId) { return getDemoAlertById(alertId); }
// alias
export function getDemoAlertByID(alertId) { return getDemoAlertById(alertId); }

export function getDemoMessages(conversationId) {
  return demoFlow.messages?.[conversationId] || [];
}

export function getDemoNotifications() { return demoFlow.notifications || []; }

export function markDemoNotificationRead(notificationId) {
  const n = (demoFlow.notifications || []).find((x) => x.id === notificationId);
  if (n) n.read = true;
  persist();
  notify();
}

export function markDemoRead(notificationId) { return markDemoNotificationRead(notificationId); }

function persist() {
  try { window.localStorage.setItem('waitme_demo_seed_v1', JSON.stringify(demoFlow)); } catch {}
}

/* ======================================================
   NOTIFICACIÓN “PUSH” (si el navegador lo permite)
====================================================== */

function triggerLocalPush(title, body) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
      return;
    }
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification(title, { body });
      });
    }
  } catch {}
}

/* ======================================================
   SOLICITUD ENTRANTE (a los 60s de crear alerta)
====================================================== */


export function upsertDemoAlertFromReal(realAlert) {
  try {
    if (!realAlert) return;
    startDemoFlow();
    const id = String(realAlert.id || '');
    if (!id) return;

    const alerts = (demoFlow.alerts || (demoFlow.alerts = []));
    const existing = alerts.find((a) => String(a.id) === id);

    const mapped = {
      ...(existing || {}),
      id,
      status: realAlert.status || existing?.status || 'active',
      address: realAlert.address || existing?.address || realAlert.street || 'Oviedo',
      price: typeof realAlert.price !== 'undefined' ? realAlert.price : (existing?.price ?? 3),
      created_date: realAlert.created_date || realAlert.createdAt || existing?.created_date || new Date().toISOString(),
      wait_until: realAlert.wait_until || existing?.wait_until,
      expires_at: realAlert.expires_at || existing?.expires_at,
      user_id: realAlert.user_id || existing?.user_id,
      user_email: realAlert.user_email || existing?.user_email,
      vehicle_type: realAlert.vehicle_type || existing?.vehicle_type,
      latitude: typeof realAlert.latitude !== 'undefined' ? realAlert.latitude : existing?.latitude,
      longitude: typeof realAlert.longitude !== 'undefined' ? realAlert.longitude : existing?.longitude
    };

    if (existing) {
      Object.assign(existing, mapped);
    } else {
      alerts.unshift(mapped);
    }

    persist();
    notify();
  } catch {}
}

export function scheduleIncomingWaitMeRequest(alertId, delayMs = 60000) {
  startDemoFlow();
  window.setTimeout(() => {
    const alert = getDemoAlertById(alertId);
    if (!alert) return;

    // Elige un usuario “random” de los 10
    const other = demoFlow.users[Math.floor(Math.random() * demoFlow.users.length)];
    const otherName = other?.name || 'Usuario';

    // Rellena datos del otro en la alerta activa (pero sin aceptar todavía)
    alert.other_user_id = other?.id;
    alert.other_user_name = otherName;
    alert.other_user_photo = other?.photo;
    alert.other_user_phone = other?.phone;
    alert.other_car_brand = other?.car_brand;
    alert.other_car_model = other?.car_model;
    alert.other_car_color = other?.car_color;
    alert.other_car_plate = other?.car_plate;
    alert.distance_km = Number((rnd(0.2, 3.5)).toFixed(1));

    addNotification({
      type: 'incoming_waitme',
      title: 'ACTIVA',
      text: `${otherName} quiere un WaitMe!`,
      fromName: otherName,
      fromPhoto: other?.photo,
      alertId: alert.id
    });

    triggerLocalPush('WaitMe!', `${otherName} quiere un WaitMe!`);
    persist();
    notify();
  }, delayMs);
}

/* ======================================================
   CHAT helpers (usa Notifications.jsx)
====================================================== */

export function ensureConversationForAlert(alertId, hint = null) {
  startDemoFlow();
  const existing = (demoFlow.conversations || []).find((c) => c.alertId === alertId);
  if (existing) return existing;

  const alert = getDemoAlertById(alertId);
  const otherId = alert?.other_user_id || (hint?.otherUserId || 'u1');
  const other = pickUser(otherId) || demoFlow.users[0];

  const convId = addConversationForAlert(alertId, other?.id, Date.now());
  const conv = getDemoConversation(convId);

  // mete mensaje inicial
  if (hint?.fromName) {
    alert.other_user_name = hint.fromName;
  }

  persist();
  notify();
  return conv;
}

export function ensureConversationForAlertId(alertId) { return ensureConversationForAlert(alertId); }

export function ensureInitialWaitMeMessage(conversationId) {
  if (!conversationId) return;
  const msgs = getDemoMessages(conversationId);
  if (msgs.length > 0) return;

  const conv = getDemoConversation(conversationId);
  const other = pickUser(conv?.otherUserId);

  pushMessage(conversationId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Hola! Quiero hacerte un WaitMe!', at: Date.now() });
  persist();
  notify();
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  if (!conversationId) return;
  const conv = getDemoConversation(conversationId);
  const other = pickUser(conv?.otherUserId);
  pushMessage(conversationId, { mine: !!isMine, senderName: isMine ? demoFlow.me.name : other?.name, senderPhoto: isMine ? demoFlow.me.photo : other?.photo, text, at: Date.now() });
  persist();
  notify();
}

/* ======================================================
   ACCIONES (Aceptar / Rechazar)
====================================================== */

export function applyDemoAction({ conversationId, alertId, action }) {
  const alert = getDemoAlertById(alertId);
  if (!alert) return;

  const otherName = alert.other_user_name || 'Usuario';

  if (action === 'accept') {
    alert.status = 'reserved';
    addNotification({
      type: 'reservation_accepted',
      title: 'RESERVA ACEPTADA',
      text: `Has aceptado a ${otherName}.`,
      fromName: otherName,
      fromPhoto: alert.other_user_photo,
      alertId: alert.id,
      read: true
    });
    triggerLocalPush('WaitMe!', `Has aceptado a ${otherName}.`);

    // mensaje al chat
    if (conversationId) {
      ensureInitialWaitMeMessage(conversationId);
      pushMessage(conversationId, { mine: true, senderName: demoFlow.me.name, text: 'Aceptado. Ven antes de que acabe el tiempo.', at: Date.now() });
    }
  }

  if (action === 'reject') {
    alert.status = 'rejected';
    addNotification({
      type: 'reservation_rejected',
      title: 'RECHAZADA',
      text: `Has rechazado a ${otherName}.`,
      fromName: otherName,
      fromPhoto: alert.other_user_photo,
      alertId: alert.id,
      read: true
    });
    triggerLocalPush('WaitMe!', `Has rechazado a ${otherName}.`);
    if (conversationId) {
      ensureInitialWaitMeMessage(conversationId);
      pushMessage(conversationId, { mine: true, senderName: demoFlow.me.name, text: 'Rechazado.', at: Date.now() });
    }
  }

  persist();
  notify();
}

/* ======================================================
   React helper (opcional)
====================================================== */

export function DemoFlowManager() {
  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    return () => {
      if (tickTimer) window.clearInterval(tickTimer);
      tickTimer = null;
    };
  }, []);
  return null;
}

export default DemoFlowManager;
