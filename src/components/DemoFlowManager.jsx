import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   SISTEMA DEMO CENTRALIZADO - BLINDADO
====================================================== */

let started = false;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => l());
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/* ======================================================
   SUSCRIPCIÓN
====================================================== */

export function subscribeToDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function startDemoFlow() {
  if (started) return;
  started = true;
  notify();
}

export function getDemoState() {
  return demoState;
}

/* ======================================================
   ESTADO DEMO
====================================================== */

const demoState = {
  conversations: [
    {
      id: 'mock_reservaste_1',
      other_name: 'Sofía',
      other_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      alert_id: 'alert_reservaste_1',
      last_message_text: 'Te espero aquí 😊',
      last_message_at: Date.now()
    }
  ],

  messages: {
    mock_reservaste_1: [
      {
        id: 'm1',
        mine: false,
        senderName: 'Sofía',
        senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Hola! Ya estoy saliendo del parking',
        ts: Date.now() - 60000
      }
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
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'reserved'
    }
  ],

  notifications: []
};

/* ======================================================
   CONVERSACIONES
====================================================== */

export function getDemoConversations() {
  return demoState.conversations;
}

export function getDemoConversation(conversationId) {
  return demoState.conversations.find(c => c.id === conversationId) || null;
}

/* ======================================================
   MENSAJES
====================================================== */

export function getDemoMessages(conversationId) {
  return demoState.messages[conversationId] || [];
}

export function sendDemoMessage({ conversationId, text, isMine = true }) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getDemoConversation(conversationId);

  const msg = {
    id: genId('msg'),
    mine: isMine,
    senderName: isMine ? 'Tú' : conv?.other_name || 'Usuario',
    senderPhoto: isMine ? null : conv?.other_photo || null,
    text: clean,
    ts: Date.now()
  };

  if (!demoState.messages[conversationId]) {
    demoState.messages[conversationId] = [];
  }

  demoState.messages[conversationId].push(msg);

  if (conv) {
    conv.last_message_text = clean;
    conv.last_message_at = msg.ts;
  }

  notify();
}

/* ======================================================
   ALERTAS
====================================================== */

export function getDemoAlerts() {
  return demoState.alerts;
}

export function getDemoAlertById(alertId) {
  return demoState.alerts.find(a => a.id === alertId) || null;
}

export function setDemoAlertStatus(alertId, status) {
  const alert = getDemoAlertById(alertId);
  if (!alert) return null;

  alert.status = status;
  notify();
  return alert;
}

/* ======================================================
   NOTIFICACIONES
====================================================== */

export function getDemoNotifications() {
  return demoState.notifications;
}

export function markDemoNotificationRead(notificationId) {
  const noti = demoState.notifications.find(n => n.id === notificationId);
  if (!noti) return;
  noti.read = true;
  notify();
}

export function addDemoNotification(notification) {
  if (!notification?.id) return;
  demoState.notifications.unshift(notification);
  notify();
}

export function clearDemoNotifications() {
  demoState.notifications = [];
  notify();
}

export function applyDemoAction({ conversationId, alertId, action }) {
  if (alertId) setDemoAlertStatus(alertId, action);

  const titleMap = {
    thinking: 'ME LO PIENSO',
    extended: 'PRÓRROGA',
    cancelled: 'CANCELADA',
    completed: 'COMPLETADA',
    reserved: 'ACTIVA'
  };

  demoState.notifications.unshift({
    id: genId('noti'),
    type: 'status_update',
    title: titleMap[action] || 'ACTUALIZACIÓN',
    text: 'Estado actualizado.',
    conversationId,
    alertId,
    createdAt: Date.now(),
    read: false
  });

  notify();
}

/* ======================================================
   FLAGS BASE44
====================================================== */

export function isDemoMode() {
  return true;
}

export function setDemoMode() {
  return true;
}

/* ======================================================
   EXPORT GLOBAL QUE BASE44 PUEDE PEDIR
====================================================== */

export const demoFlow = {
  start: startDemoFlow,
  getState: getDemoState,
  getConversations: getDemoConversations,
  getConversation: getDemoConversation,
  getMessages: getDemoMessages,
  getAlerts: getDemoAlerts,
  getAlertById: getDemoAlertById,
  getNotifications: getDemoNotifications,
  subscribe: subscribeToDemoFlow,
  isDemoMode
};

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