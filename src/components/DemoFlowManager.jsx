import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/* =========================================================
   DEMO CENTRALIZADO (fuente única)
   - CHATS: pinta tarjetas desde conversations + alerts
   - CHAT: pinta mensajes desde messages
   - NOTIFICACIONES: pinta notificaciones desde notifications
   Todo se sincroniza aquí.
========================================================= */

let started = false;
let tickTimer = null;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // no-op
    }
  });
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// =========================================================
// Estado DEMO (estructura estable)
// =========================================================

const demoFlow = {
  me: {
    id: 'me',
    name: 'Tú',
    photo: null
  },

  users: {
    marco: {
      id: 'marco',
      name: 'Marco',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    },
    sofia: {
      id: 'sofia',
      name: 'Sofía',
      photo: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    laura: {
      id: 'laura',
      name: 'Laura',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
    },
    carlos: {
      id: 'carlos',
      name: 'Carlos',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
    },
    ana: {
      id: 'ana',
      name: 'Ana',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    pablo: {
      id: 'pablo',
      name: 'Pablo',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg'
    }
  },

  // Conversaciones (formato cercano al real para minimizar cambios)
  conversations: [
    {
      id: 'mock_reservaste_1',
      participant1_id: 'me',
      participant1_name: 'Tú',
      participant1_photo: null,
      participant2_id: 'sofia',
      participant2_name: 'Sofía',
      participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      alert_id: 'alert_reservaste_1',
      last_message_text: 'Te espero aquí 😊',
      last_message_at: Date.now() - 60_000,
      unread_count_p1: 1,
      unread_count_p2: 0
    },
    {
      id: 'mock_te_reservo_1',
      participant1_id: 'me',
      participant1_name: 'Tú',
      participant1_photo: null,
      participant2_id: 'marco',
      participant2_name: 'Marco',
      participant2_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      alert_id: 'alert_te_reservo_1',
      last_message_text: 'Perfecto, voy llegando en 5 min',
      last_message_at: Date.now() - 120_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    },
    {
      id: 'mock_reservaste_2',
      participant1_id: 'me',
      participant1_name: 'Tú',
      participant1_photo: null,
      participant2_id: 'laura',
      participant2_name: 'Laura',
      participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      alert_id: 'alert_reservaste_2',
      last_message_text: 'Genial, aguanto un poco más',
      last_message_at: Date.now() - 10 * 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    },
    {
      id: 'mock_te_reservo_2',
      participant1_id: 'me',
      participant1_name: 'Tú',
      participant1_photo: null,
      participant2_id: 'carlos',
      participant2_name: 'Carlos',
      participant2_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      alert_id: 'alert_te_reservo_2',
      last_message_text: 'Hola, estoy cerca',
      last_message_at: Date.now() - 15 * 60_000,
      unread_count_p1: 2,
      unread_count_p2: 0
    },
    {
      id: 'mock_completada_1',
      participant1_id: 'me',
      participant1_name: 'Tú',
      participant1_photo: null,
      participant2_id: 'ana',
      participant2_name: 'Ana',
      participant2_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      alert_id: 'alert_completada_1',
      last_message_text: 'Operación completada ✅',
      last_message_at: Date.now() - 22 * 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    },
    {
      id: 'mock_cancelada_1',
      participant1_id: 'me',
      participant1_name: 'Tú',
      participant1_photo: null,
      participant2_id: 'pablo',
      participant2_name: 'Pablo',
      participant2_photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      alert_id: 'alert_cancelada_1',
      last_message_text: 'Operación cancelada ❌',
      last_message_at: Date.now() - 48 * 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    }
  ],

  // Mensajes por conversación
  messages: {
    mock_reservaste_1: [
      {
        id: 'm1',
        mine: false,
        senderName: 'Sofía',
        senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Ey! te he enviado un WaitMe!',
        ts: Date.now() - 4 * 60_000
      },
      {
        id: 'm2',
        mine: false,
        senderName: 'Sofía',
        senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Hola! Ya estoy saliendo del parking',
        ts: Date.now() - 3 * 60_000
      },
      {
        id: 'm3',
        mine: true,
        senderName: 'Tú',
        senderPhoto: null,
        text: 'Genial! Voy para allá',
        ts: Date.now() - 2 * 60_000
      },
      {
        id: 'm4',
        mine: false,
        senderName: 'Sofía',
        senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Te espero aquí 😊',
        ts: Date.now() - 60_000
      }
    ],
    mock_te_reservo_1: [
      {
        id: 'm5',
        mine: false,
        senderName: 'Marco',
        senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        text: 'Ey! te he enviado un WaitMe!',
        ts: Date.now() - 5 * 60_000
      },
      {
        id: 'm6',
        mine: false,
        senderName: 'Marco',
        senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        text: '¿Sigues ahí?',
        ts: Date.now() - 2 * 60_000
      },
      {
        id: 'm7',
        mine: true,
        senderName: 'Tú',
        senderPhoto: null,
        text: 'Sí, estoy aquí esperando.',
        ts: Date.now() - 90_000
      },
      {
        id: 'm8',
        mine: false,
        senderName: 'Marco',
        senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        text: 'Perfecto, voy llegando en 5 min',
        ts: Date.now() - 60_000
      }
    ],
    mock_reservaste_2: [
      {
        id: 'm9',
        mine: false,
        senderName: 'Laura',
        senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        text: 'Ey! te he enviado un WaitMe!',
        ts: Date.now() - 15 * 60_000
      },
      {
        id: 'm10',
        mine: false,
        senderName: 'Laura',
        senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        text: 'Estoy en el coche blanco',
        ts: Date.now() - 10 * 60_000
      },
      {
        id: 'm11',
        mine: true,
        senderName: 'Tú',
        senderPhoto: null,
        text: 'Vale, te veo!',
        ts: Date.now() - 9 * 60_000
      },
      {
        id: 'm12',
        mine: false,
        senderName: 'Laura',
        senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        text: 'Genial, aguanto un poco más',
        ts: Date.now() - 8 * 60_000
      }
    ],
    mock_te_reservo_2: [
      {
        id: 'm13',
        mine: false,
        senderName: 'Carlos',
        senderPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        text: 'Ey! te he enviado un WaitMe!',
        ts: Date.now() - 20 * 60_000
      },
      {
        id: 'm14',
        mine: false,
        senderName: 'Carlos',
        senderPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        text: 'Hola, estoy cerca',
        ts: Date.now() - 15 * 60_000
      },
      {
        id: 'm15',
        mine: true,
        senderName: 'Tú',
        senderPhoto: null,
        text: 'Ok, estoy en el Seat azul',
        ts: Date.now() - 14 * 60_000
      }
    ]
  },

  // Alertas: fuente de estados (reserved/thinking/extended/cancelled/completed)
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
      reserved_by_latitude: 43.35954,
      reserved_by_longitude: -5.85234,
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'reserved',
      created_date: new Date(Date.now() - 60_000).toISOString()
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
      reserved_by_latitude: 43.36621,
      reserved_by_longitude: -5.84312,
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'reserved',
      created_date: new Date(Date.now() - 2 * 60_000).toISOString()
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
      reserved_by_latitude: 43.3598,
      reserved_by_longitude: -5.8491,
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'thinking',
      created_date: new Date(Date.now() - 10 * 60_000).toISOString()
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
      reserved_by_latitude: 43.3665,
      reserved_by_longitude: -5.8439,
      target_time: Date.now() + 10 * 60 * 1000,
      status: 'extended',
      created_date: new Date(Date.now() - 15 * 60_000).toISOString()
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
      reserved_by_latitude: 43.3621,
      reserved_by_longitude: -5.8482,
      target_time: Date.now() - 5 * 60 * 1000,
      status: 'completed',
      created_date: new Date(Date.now() - 22 * 60_000).toISOString()
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
      reserved_by_latitude: 43.3632,
      reserved_by_longitude: -5.8479,
      target_time: Date.now() - 2 * 60 * 1000,
      status: 'cancelled',
      created_date: new Date(Date.now() - 48 * 60_000).toISOString()
    }
  ],

  // Notificaciones (las “push” de demo)
  notifications: [
    {
      id: 'noti_1',
      type: 'incoming_waitme',
      title: 'WAITME',
      text: 'Sofía te ha enviado un WaitMe!',
      conversationId: 'mock_reservaste_1',
      alertId: 'alert_reservaste_1',
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

// =========================================================
// API pública (Base44 importa por nombre)
// =========================================================

export function isDemoMode() {
  return true;
}

export function setDemoMode() {
  return true;
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Alias para compatibilidad con imports que ya intentaste
export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

export function getDemoState() {
  return demoFlow;
}

export function getDemoConversations() {
  return demoFlow.conversations || [];
}

export function getDemoConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

export function getDemoMessages(conversationId) {
  return demoFlow.messages?.[conversationId] || [];
}

export function getDemoAlerts() {
  return demoFlow.alerts || [];
}

export function getDemoAlertById(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

export function getDemoNotifications() {
  return demoFlow.notifications || [];
}

export function markDemoNotificationRead(notificationId) {
  const idx = (demoFlow.notifications || []).findIndex((n) => n.id === notificationId);
  if (idx === -1) return;
  demoFlow.notifications[idx] = { ...demoFlow.notifications[idx], read: true };
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

export function setDemoAlertStatus(alertId, status) {
  const idx = (demoFlow.alerts || []).findIndex((a) => a.id === alertId);
  if (idx === -1) return null;
  demoFlow.alerts[idx] = { ...demoFlow.alerts[idx], status };
  notify();
  return demoFlow.alerts[idx];
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getDemoConversation(conversationId);
  const otherName = conv?.participant2_name || 'Usuario';
  const otherPhoto = conv?.participant2_photo || null;

  const msg = {
    id: genId('msg'),
    mine: !!isMine,
    senderName: isMine ? demoFlow.me.name : otherName,
    senderPhoto: isMine ? demoFlow.me.photo : otherPhoto,
    text: clean,
    attachments,
    ts: Date.now()
  };

  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  demoFlow.messages[conversationId].push(msg);

  if (conv) {
    conv.last_message_text = clean;
    conv.last_message_at = msg.ts;
    // simulamos “no leído” cuando escribe el otro
    if (!isMine) conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }

  notify();
}

function statusToTitle(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'thinking' || s === 'me_lo_pienso' || s === 'pending') return 'ME LO PIENSO';
  if (s === 'extended' || s === 'prorroga' || s === 'prórroga') return 'PRÓRROGA';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelada') return 'CANCELADA';
  if (s === 'completed' || s === 'completada') return 'COMPLETADA';
  if (s === 'reserved') return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}

function actionToChatLine(action) {
  const t = statusToTitle(action);
  if (t === 'ACTIVA') return 'Operación activa.';
  if (t === 'ME LO PIENSO') return 'Se lo está pensando…';
  if (t === 'PRÓRROGA') return 'Prórroga aplicada ⏱️';
  if (t === 'CANCELADA') return 'Operación cancelada ❌';
  if (t === 'COMPLETADA') return 'Operación completada ✅';
  return 'Estado actualizado.';
}

// Acción unificada: usarla desde NOTIFICACIONES / CHATS / CHAT
export function applyDemoAction({ conversationId, alertId, action }) {
  if (!conversationId && alertId) {
    // si no llega el conv, lo buscamos por alert_id
    const c = (demoFlow.conversations || []).find((x) => x.alert_id === alertId);
    conversationId = c?.id;
  }

  if (alertId) setDemoAlertStatus(alertId, action);

  const title = statusToTitle(action);
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
  addDemoNotification(noti);

  if (conversationId) {
    // Inyectamos una línea “de actividad” visible en Chat
    sendDemoMessage(conversationId, actionToChatLine(action), null, false);
  }

  return noti.id;
}

// Crea una “push” entrante (nuevo WaitMe) y la sincroniza
export function createDemoIncomingWaitMe() {
  const pool = ['sofia', 'marco', 'laura', 'carlos'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const u = demoFlow.users[pick];
  if (!u) return null;

  const conversationId = genId('conv');
  const alertId = genId('alert');

  const conv = {
    id: conversationId,
    participant1_id: 'me',
    participant1_name: 'Tú',
    participant1_photo: null,
    participant2_id: u.id,
    participant2_name: u.name,
    participant2_photo: u.photo,
    alert_id: alertId,
    last_message_text: 'Ey! te he enviado un WaitMe!',
    last_message_at: Date.now(),
    unread_count_p1: 1,
    unread_count_p2: 0
  };

  const alert = {
    id: alertId,
    user_id: u.id,
    user_name: u.name,
    user_photo: u.photo,
    car_brand: 'Seat',
    car_model: 'Ibiza',
    car_plate: `${Math.floor(1000 + Math.random() * 8999)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    )}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    car_color: 'gris',
    price: Math.floor(3 + Math.random() * 6),
    address: 'Oviedo',
    latitude: 43.362776,
    longitude: -5.84589,
    allow_phone_calls: true,
    phone: '+34600000000',
    reserved_by_id: 'me',
    reserved_by_name: 'Tú',
    reserved_by_photo: null,
    target_time: Date.now() + 10 * 60 * 1000,
    status: 'reserved',
    created_date: new Date().toISOString()
  };

  demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];
  demoFlow.alerts = [alert, ...(demoFlow.alerts || [])];
  demoFlow.messages[conversationId] = [
    {
      id: genId('msg'),
      mine: false,
      senderName: u.name,
      senderPhoto: u.photo,
      text: 'Ey! te he enviado un WaitMe!',
      ts: Date.now()
    }
  ];

  const noti = {
    id: genId('noti'),
    type: 'incoming_waitme',
    title: 'WAITME',
    text: `${u.name} te ha enviado un WaitMe!`,
    conversationId,
    alertId,
    createdAt: Date.now(),
    read: false
  };
  addDemoNotification(noti);

  notify();
  return { conversationId, alertId, notificationId: noti.id };
}

export function startDemoFlow() {
  if (started) return;
  started = true;

  // “Vida”: cada 30s entra algo si hay pocas notis sin leer
  tickTimer = setInterval(() => {
    const unread = (demoFlow.notifications || []).filter((n) => !n.read).length;
    if (unread < 3) {
      const r = createDemoIncomingWaitMe();
      if (r) {
        toast({
          title: 'Nuevo WaitMe',
          description: 'Tienes una nueva notificación.'
        });
      }
    }
  }, 30_000);

  notify();
}

// =========================================================
// Componente (montar una vez en App/Layout)
// =========================================================

export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow();
  }, []);

  return null;
}
