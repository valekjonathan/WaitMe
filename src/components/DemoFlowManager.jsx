import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO CENTRAL ÚNICO (ESTABLE Y SINCRONIZADO)
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalize(s) {
  return String(s || '').trim().toLowerCase();
}

/* ======================================================
   ESTADO GLOBAL DEMO
====================================================== */

export const demoFlow = {
  me: { id: 'me', name: 'Jonathan Álvarez', photo: null },
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

function ensureMessages(id) {
  if (!demoFlow.messages[id]) demoFlow.messages[id] = [];
  return demoFlow.messages[id];
}

function pushMessage(convId, { mine, senderName, senderPhoto, text }) {
  if (!text) return;

  const arr = ensureMessages(convId);

  const msg = {
    id: genId('msg'),
    mine: !!mine,
    senderName,
    senderPhoto,
    text,
    ts: Date.now()
  };

  arr.push(msg);

  const conv = getConversation(convId);
  if (conv) {
    conv.last_message_text = msg.text;
    conv.last_message_at = msg.ts;
  }
}

function addNotification(data) {
  demoFlow.notifications.unshift({
    id: genId('noti'),
    createdAt: Date.now(),
    read: false,
    ...data
  });
}

/* ======================================================
   SEED
====================================================== */

function buildUsers() {
  demoFlow.users = Array.from({ length: 10 }).map((_, i) => ({
    id: `u${i + 1}`,
    name: ['Sofía','Marco','Laura','Carlos','Elena','Daniel','Paula','Iván','Nerea','Hugo'][i],
    photo: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 10}.jpg`,
    car_brand: 'Seat',
    car_model: 'León',
    car_color: 'negro',
    car_plate: `${1000 + i} MNP`,
    vehicle_type: 'car',
    phone: '+34600000000'
  }));
}

function buildAlerts() {
  demoFlow.alerts = [];

  const statuses = [
    'active','reserved','thinking','extended',
    'cancelled','completed','expired','rejected'
  ];

  demoFlow.users.forEach((u, i) => {
    demoFlow.alerts.push({
      id: `alert_${i + 1}`,
      user_id: u.id,
      user_name: u.name,
      user_photo: u.photo,
      car_brand: u.car_brand,
      car_model: u.car_model,
      car_color: u.car_color,
      car_plate: u.car_plate,
      vehicle_type: 'car',
      price: 3 + i,
      address: `Calle Demo ${i + 1}, Oviedo`,
      status: statuses[i % statuses.length],
      reserved_by_id: 'me',
      reserved_by_name: demoFlow.me.name,
      reserved_by_photo: null
    });
  });
}

function buildConversations() {
  demoFlow.conversations = [];
  demoFlow.messages = {};

  demoFlow.users.forEach((u, i) => {
    const convId = `conv_${u.id}_me`;

    demoFlow.conversations.push({
      id: convId,
      participant1_id: 'me',
      participant2_id: u.id,
      participant1_name: demoFlow.me.name,
      participant2_name: u.name,
      participant1_photo: null,
      participant2_photo: u.photo,
      alert_id: `alert_${i + 1}`,
      last_message_text: '',
      last_message_at: Date.now(),
      unread_count_p1: 0,
      unread_count_p2: 0
    });

    pushMessage(convId, {
      mine: false,
      senderName: u.name,
      senderPhoto: u.photo,
      text: 'Hola! Te he enviado un WaitMe.'
    });

    pushMessage(convId, {
      mine: true,
      senderName: demoFlow.me.name,
      senderPhoto: null,
      text: 'Perfecto, voy para allá.'
    });
  });
}

function buildNotifications() {
  demoFlow.notifications = [];

  demoFlow.alerts.forEach((a) => {
    addNotification({
      type: 'status_update',
      title: a.status.toUpperCase(),
      text: `Estado: ${a.status}`,
      alertId: a.id
    });
  });
}

function resetDemo() {
  buildUsers();
  buildAlerts();
  buildConversations();
  buildNotifications();
}

/* ======================================================
   EXPORTS API (COMPATIBLE CON TODA TU APP)
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
      description: 'Simulación cargada correctamente.'
    });
  }, []);

  return null;
}