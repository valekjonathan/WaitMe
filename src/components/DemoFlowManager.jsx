import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

/* ======================================================
   DEMO FLOW CENTRAL ÚNICO Y DEFINITIVO
   Sin exports faltantes.
   Sin dependencias rotas.
   Totalmente sincronizado.
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

function genId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

function statusToTitle(status) {
  const s = normalize(status);
  if (s === "thinking") return "ME LO PIENSO";
  if (s === "extended") return "PRÓRROGA";
  if (s === "cancelled") return "CANCELADA";
  if (s === "expired") return "AGOTADA";
  if (s === "rejected") return "RECHAZADA";
  if (s === "completed") return "COMPLETADA";
  if (s === "reserved" || s === "active") return "ACTIVA";
  return "ACTUALIZACIÓN";
}

const BASE_LAT = 43.3623;
const BASE_LNG = -5.8489;

function rnd(min, max) { return Math.random() * (max - min) + min; }
function nearLat() { return BASE_LAT + rnd(-0.0045, 0.0045); }
function nearLng() { return BASE_LNG + rnd(-0.0060, 0.0060); }

export const demoFlow = {
  me: { id: "me", name: "Tú", photo: null },
  users: [],
  alerts: [],
  conversations: [],
  messages: {},
  notifications: []
};

function getConversation(id) {
  return demoFlow.conversations.find(c => c.id === id) || null;
}

function getAlert(id) {
  return demoFlow.alerts.find(a => a.id === id) || null;
}

function ensureMessagesArray(id) {
  if (!demoFlow.messages[id]) demoFlow.messages[id] = [];
  return demoFlow.messages[id];
}

function pushMessage(conversationId, { mine, senderName, senderPhoto, text }) {
  const arr = ensureMessagesArray(conversationId);

  const msg = {
    id: genId("msg"),
    mine,
    senderName,
    senderPhoto,
    text,
    ts: Date.now()
  };

  arr.push(msg);

  const conv = getConversation(conversationId);
  if (conv) {
    conv.last_message_text = text;
    conv.last_message_at = msg.ts;
  }

  return msg;
}

function addNotification(n) {
  demoFlow.notifications.unshift({
    id: genId("noti"),
    createdAt: Date.now(),
    read: false,
    ...n
  });
}

/* ======================================================
   SEED
====================================================== */

function buildUsers() {
  demoFlow.users = Array.from({ length: 10 }).map((_, i) => ({
    id: `u${i + 1}`,
    name: ["Sofía","Marco","Laura","Carlos","Elena","Dani","Paula","Iván","Nerea","Hugo"][i],
    photo: `https://randomuser.me/api/portraits/${i % 2 === 0 ? "women" : "men"}/${20 + i}.jpg`,
    car_brand: "Seat",
    car_model: "León",
    car_color: "gris",
    car_plate: `${1000 + i} ABC`,
    phone: `+3460000000${i}`
  }));
}

function seedAlerts() {
  demoFlow.alerts = demoFlow.users.map((u, i) => ({
    id: `alert_${i}`,
    user_id: u.id,
    user_name: u.name,
    user_photo: u.photo,
    car_brand: u.car_brand,
    car_model: u.car_model,
    car_color: u.car_color,
    car_plate: u.car_plate,
    latitude: nearLat(),
    longitude: nearLng(),
    price: 3 + i,
    address: "Oviedo Centro",
    status: i < 5 ? "active" : "reserved"
  }));
}

function seedConversations() {
  demoFlow.conversations = [];
  demoFlow.messages = {};

  demoFlow.alerts.slice(5).forEach(a => {
    const convId = `conv_${a.id}`;
    demoFlow.conversations.push({
      id: convId,
      participant1_id: "me",
      participant2_id: a.user_id,
      participant2_name: a.user_name,
      participant2_photo: a.user_photo,
      alert_id: a.id,
      last_message_text: "",
      last_message_at: Date.now()
    });

    pushMessage(convId, {
      mine: true,
      senderName: "Tú",
      senderPhoto: null,
      text: "Ey! te he enviado un WaitMe!"
    });
  });
}

function seedNotifications() {
  demoFlow.notifications = [];

  demoFlow.alerts.slice(5).forEach(a => {
    addNotification({
      type: "incoming_waitme",
      title: "ACTIVA",
      text: `${a.user_name} te ha enviado un WaitMe.`,
      alertId: a.id,
      conversationId: `conv_${a.id}`
    });
  });
}

function resetDemo() {
  buildUsers();
  seedAlerts();
  seedConversations();
  seedNotifications();
}

/* ======================================================
   API EXPORTS
====================================================== */

export function isDemoMode() { return true; }
export function getDemoState() { return demoFlow; }

export function startDemoFlow() {
  if (started) return;
  started = true;
  resetDemo();
  tickTimer = setInterval(() => notify(), 1000);
  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDemoAlerts() { return demoFlow.alerts; }
export function getDemoAlert(alertId) { return getAlert(alertId); }
export function getDemoAlertById(alertId) { return getAlert(alertId); }

export function getDemoConversations() { return demoFlow.conversations; }
export function getDemoConversation(id) { return getConversation(id); }
export function getDemoConversationById(id) { return getConversation(id); }

export function getDemoMessages(id) {
  return demoFlow.messages[id] || [];
}

export function sendDemoMessage(conversationId, text) {
  const conv = getConversation(conversationId);
  if (!conv) return;
  pushMessage(conversationId, {
    mine: true,
    senderName: "Tú",
    senderPhoto: null,
    text
  });
  notify();
}

export function getDemoNotifications() {
  return demoFlow.notifications;
}

export function markDemoNotificationRead(id) {
  const n = demoFlow.notifications.find(n => n.id === id);
  if (n) n.read = true;
  notify();
}

export function markAllDemoRead() {
  demoFlow.notifications.forEach(n => n.read = true);
  notify();
}

export function ensureConversationForAlert(alertId) {
  return getConversation(`conv_${alertId}`);
}

export function ensureInitialWaitMeMessage() {
  return true;
}

export function applyDemoAction() {
  return true;
}

export function reserveDemoAlert(alertId) {
  const conv = ensureConversationForAlert(alertId);
  return conv?.id || null;
}

export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow();
    toast({
      title: "Modo Demo Activo",
      description: "La app tiene vida simulada."
    });
  }, []);
  return null;
}