import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* ======================================================
   DEMO CENTRAL ÚNICO (fuente única)
   - CHATS: tarjetas desde conversations + alerts
   - CHAT: mensajes desde messages
   - NOTIFICACIONES: tarjetas desde notifications
   Todo se sincroniza aquí.
====================================================== */

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

/* ======================================================
   ESTADO DEMO (estructura estable)
====================================================== */

const demoFlow = {
  me: {
    id: 'me',
    name: 'Tú',
    photo: null
  },

  // Conversaciones deben tener:
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
    },
    {
      id: 'alert_completada_1',
      user_id: 'ana',
      user_name: 'Ana',
      user_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      car_brand: 'Peugeot',
      car_model: '208',
      car_plate: '4455 KLM',
      car_color: 'negro',
      price: 3,
      address: 'Calle Jovellanos, 8, Oviedo',
      latitude: 43.36321,
      longitude: -5.84511,
      allow_phone_calls: false,
      phone: null,
      reserved_by_id: 'me',
      reserved_by_name: 'Tú',
      reserved_by_photo: null,
      target_time: Date.now() - 5 * 60 * 1000,
      status: 'completed'
    },
    {
      id: 'alert_cancelada_1',
      user_id: 'pablo',
      user_name: 'Pablo',
      user_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      car_brand: 'Ford',
      car_model: 'Fiesta',
      car_plate: '1100 TUV',
      car_color: 'blanco',
      price: 4,
      address: 'Calle Rosal, 3, Oviedo',
      latitude: 43.36402,
      longitude: -5.8442,
      allow_phone_calls: true,
      phone: '+34600999888',
      reserved_by_id: 'me',
      reserved_by_name: 'Tú',
      reserved_by_photo: null,
      target_time: Date.now() - 2 * 60 * 1000,
      status: 'cancelled'
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
    },
    {
      id: 'noti_3',
      type: 'status_update',
      title: 'CANCELADA',
      text: 'Pablo canceló la operación.',
      conversationId: 'mock_reservaste_1',
      alertId: 'alert_cancelada_1',
      createdAt: Date.now() - 20 * 60 * 1000,
      read: true
    }
  ]
};

/* ======================================================
   API COMPATIBLE (lo que te está pidiendo Base44)
====================================================== */

// NUEVO: objeto demoFlow (Base44 lo importa por nombre)
export { demoFlow };

// start/subscribe/getState
export function startDemoFlow() {
  if (started) return;
  started = true;

  // reloj demo para que se “mueva” algo si lo necesitas
  if (!tickTimer) {
    tickTimer = setInterval(() => {
      notify();
    }, 1000);
  }

  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// alias antiguo (por si alguna pantalla lo usa)
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
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

// messages
export function getDemoMessages(conversationId) {
  return (demoFlow.messages && demoFlow.messages[conversationId]) ? demoFlow.messages[conversationId] : [];
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getDemoConversation(conversationId);

  const msg = {
    id: genId('msg'),
    mine: !!isMine,
    senderName: isMine ? 'Tú' : (conv?.participant2_name || conv?.other_name || 'Usuario'),
    senderPhoto: isMine ? null : (conv?.participant2_photo || conv?.other_photo || null),
    text: clean,
    attachments,
    ts: Date.now()
  };

  if (!demoFlow.messages) demoFlow.messages = {};
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  demoFlow.messages[conversationId].push(msg);

  // actualiza tarjeta en CHATS
  if (conv) {
    conv.last_message_text = clean;
    conv.last_message_at = msg.ts;

    // unread para mí: si escribe el otro, sumo
    if (!isMine) {
      conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
    }
  }

  notify();
}

// alerts
export function getDemoAlerts() {
  return demoFlow.alerts || [];
}

export function getDemoAlertById(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

// notifications
export function getDemoNotifications() {
  return demoFlow.notifications || [];
}

// marcar leído
export function markDemoRead(notificationId) {
  const idx = (demoFlow.notifications || []).findIndex((n) => n.id === notificationId);
  if (idx === -1) return;
  demoFlow.notifications[idx] = { ...demoFlow.notifications[idx], read: true };
  notify();
}

// alias por si lo llaman así
export function markDemoNotificationRead(notificationId) {
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

// acción unificada: cambia status + mete notificación + mete mensaje en chat
export function applyDemoAction({ conversationId, alertId, action }) {
  const a = normalizeStatus(action);

  // 1) cambia estado alerta
  if (alertId) {
    const alert = getDemoAlertById(alertId);
    if (alert) alert.status = a;
  }

  // 2) notificación
  const title = statusToTitle(a);
  const noti = {
    id: genId('noti'),
    type: 'status_update',
    title,
    text: 'Estado actualizado.',
    conversationId,
    alertId,
    createdAt: Date.now(),
    read: false
  };
  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];

  // 3) mensaje sincronizado en CHAT (para que “se vea la acción”)
  if (conversationId) {
    let msgText = '';
    if (title === 'ME LO PIENSO') msgText = 'Me lo pienso…';
    else if (title === 'PRÓRROGA') msgText = 'He pagado una prórroga.';
    else if (title === 'CANCELADA') msgText = 'He cancelado la operación.';
    else if (title === 'COMPLETADA') msgText = 'Operación completada ✅';
    else if (title === 'ACTIVA') msgText = 'Operación activa.';
    else msgText = 'Actualización de estado.';

    // mensaje del “sistema/otro” para que se vea vida
    sendDemoMessage(conversationId, msgText, null, false);
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

    return () => {
      // no limpiamos el timer aquí a propósito (Base44 recarga mucho)
    };
  }, []);

  return null;
}