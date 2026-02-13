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
  if (['thinking','me_lo_pienso','me lo pienso','pending'].includes(s)) return 'ME LO PIENSO';
  if (['extended','prorroga','prórroga','prorrogada'].includes(s)) return 'PRÓRROGA';
  if (['cancelled','canceled','cancelada'].includes(s)) return 'CANCELADA';
  if (['expired','expirada','agotada'].includes(s)) return 'AGOTADA';
  if (['rejected','rechazada'].includes(s)) return 'RECHAZADA';
  if (['completed','completada'].includes(s)) return 'COMPLETADA';
  if (['reserved','activa','active'].includes(s)) return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}

const BASE_LAT = 43.3623;
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
  conversations: [],
  messages: {},
  notifications: []
};

/* ======================================================
   HELPERS
====================================================== */

function getConversation(id) {
  return demoFlow.conversations.find((c) => c.id === id) || null;
}

function getAlert(id) {
  return demoFlow.alerts.find((a) => a.id === id) || null;
}

function ensureMessagesArray(id) {
  if (!demoFlow.messages[id]) demoFlow.messages[id] = [];
  return demoFlow.messages[id];
}

function pushMessage(conversationId, { mine, senderName, senderPhoto, text }) {
  const clean = String(text || '').trim();
  if (!clean) return;

  const arr = ensureMessagesArray(conversationId);

  const msg = {
    id: genId('msg'),
    mine: !!mine,
    senderName,
    senderPhoto,
    text: clean,
    ts: Date.now()
  };

  arr.push(msg);

  const conv = getConversation(conversationId);
  if (conv) {
    conv.last_message_text = clean;
    conv.last_message_at = msg.ts;
    if (!mine) {
      conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
    }
  }
}

function addNotification({ type, title, text, conversationId, alertId, read = false }) {
  const n = {
    id: genId('noti'),
    type: type || 'status_update',
    title: title || 'ACTUALIZACIÓN',
    text: text || '',
    conversationId: conversationId || null,
    alertId: alertId || null,
    createdAt: Date.now(),
    read
  };
  demoFlow.notifications = [n, ...demoFlow.notifications];
  return n;
}

/* ======================================================
   SEED
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

function buildAlerts() {
  demoFlow.alerts = demoFlow.users.map((u, i) => ({
    id: `alert_${i + 1}`,
    user_id: u.id,
    user_name: u.name,
    user_photo: u.photo,
    car_brand: u.car_brand,
    car_model: u.car_model,
    car_color: u.car_color,
    car_plate: u.car_plate,
    price: 3 + i,
    available_in_minutes: 5,
    latitude: nearLat(),
    longitude: nearLng(),
    address: `Calle Demo ${i + 1}, Oviedo`,
    status: 'active',
    reserved_by_id: null
  }));
}

function buildConversations() {
  demoFlow.conversations = [];
  demoFlow.messages = {};
}

function buildNotifications() {
  demoFlow.notifications = [];
}

function resetDemo() {
  buildUsers();
  buildAlerts();
  buildConversations();
  buildNotifications();
}

/* ======================================================
   EXPORTS API
====================================================== */

export function isDemoMode() { return true; }
export function setDemoMode() { return true; }
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

export function getDemoAlerts() { return demoFlow.alerts; }
export function getDemoAlert(id) { return getAlert(id); }
export function getDemoAlertById(id) { return getAlert(id); }
export function getDemoAlertByID(id) { return getAlert(id); }

export function getDemoConversations() { return demoFlow.conversations; }
export function getDemoConversation(id) { return getConversation(id); }
export function getDemoConversationById(id) { return getConversation(id); }

export function getDemoMessages(id) {
  return demoFlow.messages[id] || [];
}

export function getDemoNotifications() {
  return demoFlow.notifications;
}

export function markDemoRead(id) {
  const n = demoFlow.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  notify();
}

export function markDemoNotificationRead(id) {
  return markDemoRead(id);
}

export function markAllDemoRead() {
  demoFlow.notifications.forEach((n) => (n.read = true));
  notify();
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