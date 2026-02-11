import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * Base44 importa funciones por nombre desde este módulo.
 * Si falta UNA, el preview se rompe.
 * Aquí exportamos TODO lo que está pidiendo tu proyecto actual.
 */

let started = false;
const listeners = new Set();

const demoState = {
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
    }
  },
  conversations: [
    {
      id: 'mock_te_reservo_1',
      otherUserId: 'marco',
      other_name: 'Marco',
      other_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      role: 'seller',
      irEnabled: false
    },
    {
      id: 'mock_reservaste_1',
      otherUserId: 'sofia',
      other_name: 'Sofía',
      other_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      role: 'buyer',
      irEnabled: true
    },
    {
      id: 'mock_reservaste_2',
      otherUserId: 'laura',
      other_name: 'Laura',
      other_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      role: 'buyer',
      irEnabled: true
    },
    {
      id: 'mock_te_reservo_2',
      otherUserId: 'carlos',
      other_name: 'Carlos',
      other_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      role: 'seller',
      irEnabled: false
    }
  ],
  messages: {
    mock_te_reservo_1: [
      { id: 'm1', mine: false, senderName: 'Marco', senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', text: '¿Sigues ahí?', ts: Date.now() - 120000 },
      { id: 'm2', mine: true, senderName: 'Tú', text: 'Sí, estoy aquí esperando.', ts: Date.now() - 90000 },
      { id: 'm3', mine: false, senderName: 'Marco', senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', text: 'Perfecto, voy llegando en 5 min', ts: Date.now() - 60000 }
    ],
    mock_reservaste_1: [
      { id: 'm4', mine: false, senderName: 'Sofía', senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'Hola! Ya estoy saliendo del parking', ts: Date.now() - 150000 },
      { id: 'm5', mine: true, senderName: 'Tú', text: 'Genial! Voy para allá', ts: Date.now() - 120000 },
      { id: 'm6', mine: false, senderName: 'Sofía', senderPhoto: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'Te espero aquí 😊', ts: Date.now() - 60000 },
      { id: 'm7', mine: true, senderName: 'Tú', text: 'Perfecto, voy llegando', ts: Date.now() - 30000 }
    ],
    mock_reservaste_2: [
      { id: 'm8', mine: false, senderName: 'Laura', senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', text: 'Estoy en el coche blanco', ts: Date.now() - 600000 },
      { id: 'm9', mine: true, senderName: 'Tú', text: 'Vale, te veo!', ts: Date.now() - 580000 },
      { id: 'm10', mine: false, senderName: 'Laura', senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', text: 'Genial, aguanto un poco más', ts: Date.now() - 550000 }
    ],
    mock_te_reservo_2: [
      { id: 'm11', mine: false, senderName: 'Carlos', senderPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', text: 'Hola, estoy cerca', ts: Date.now() - 900000 },
      { id: 'm12', mine: true, senderName: 'Tú', text: 'Ok, estoy en el Seat azul', ts: Date.now() - 880000 }
    ]
  },
  alerts: [
    // ALERTAS (fuente única para CHATS / CHAT / NOTIFICACIONES en modo demo)
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
      reserved_by_latitude: 43.36621,
      reserved_by_longitude: -5.84312,
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
      reserved_by_latitude: 43.3598,
      reserved_by_longitude: -5.8491,
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
      reserved_by_latitude: 43.3665,
      reserved_by_longitude: -5.8439,
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
      reserved_by_latitude: 43.3621,
      reserved_by_longitude: -5.8482,
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
      reserved_by_latitude: 43.3632,
      reserved_by_longitude: -5.8479,
      target_time: Date.now() - 2 * 60 * 1000,
      status: 'cancelled'
    }
  ],

  notifications: [
    // NOTIFICACIONES sincronizadas con las alertas/conversaciones (modo demo)
    {
      id: 'noti_1',
      type: 'status_update',
      title: 'ME LO PIENSO',
      text: 'Lucía se lo está pensando.',
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
      conversationId: 'mock_rechazada_1',
      alertId: 'alert_cancelada_1',
      createdAt: Date.now() - 20 * 60 * 1000,
      read: true
    }
  ], isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = demoState.conversations.find((c) => c.id === conversationId);

  const msg = {
    id: genId('msg'),
    mine: isMine,
    senderName: isMine ? 'Tú' : (conv?.other_name || 'Usuario'),
    senderPhoto: isMine ? null : (conv?.other_photo || null),
    text: clean,
    attachments,
    ts: Date.now()
  };

  if (!demoState.messages[conversationId]) demoState.messages[conversationId] = [];
  demoState.messages[conversationId].push(msg);

  // Para que Chats tenga "last_message_text" visible en tarjetas (si tu UI lo usa)
  if (conv) {
    conv.last_message_text = clean;
    conv.last_message_at = msg.ts;
  }

  emit();
}

// ====== Extras defensivos (no rompen nada si Base44 los llama) ======
export function markAllDemoRead() {
  demoState.notifications.forEach((n) => (n.read = true));
  emit();
}
export function clearDemoNotifications() {
  demoState.notifications = [];
  emit();
}
export function addDemoNotification(notification) {
  if (!notification?.id) return;
  demoState.notifications = [notification, ...demoState.notifications];
  emit();
}
export function removeDemoNotification(notificationId) {
  demoState.notifications = demoState.notifications.filter((n) => n.id !== notificationId);
  emit();
}
export function isDemoMode() { return true; }
export function setDemoMode() { return true; }

// ====== COMPONENTE ======
export default function DemoFlowManager() {
  useEffect(() => {
    // Asegura demo vivo
    startDemoFlow();

    // Toast demo (cerrable). La X ya funciona por el fix de pointer-events.
    toast({
      title: 'Pago completado',
      description: 'Has ganado 2.01€'
    });
  }, []);

  return null;
}

// ======================
// Alerts helpers (modo demo) — fuente única para CHATS / CHAT / NOTIFICACIONES
// ======================
export function getDemoAlerts() {
  return demoState.alerts || [];
}

export function getDemoAlertById(alertId) {
  return (demoState.alerts || []).find((a) => a.id === alertId) || null;
}

export function setDemoAlertStatus(alertId, status) {
  const idx = (demoState.alerts || []).findIndex((a) => a.id === alertId);
  if (idx === -1) return null;
  demoState.alerts[idx] = { ...demoState.alerts[idx], status };
  notify();
  return demoState.alerts[idx];
}

export function markDemoNotificationRead(notificationId) {
  const idx = (demoState.notifications || []).findIndex((n) => n.id === notificationId);
  if (idx === -1) return;
  demoState.notifications[idx] = { ...demoState.notifications[idx], read: true };
  notify();
}

// Acción unificada para sincronizar estados desde cualquier pantalla
export function applyDemoAction({ conversationId, alertId, action }) {
  // action: 'thinking' | 'extended' | 'cancelled' | 'completed' | 'reserved'
  if (alertId) setDemoAlertStatus(alertId, action);

  const titleMap = {
    thinking: 'ME LO PIENSO',
    extended: 'PRÓRROGA',
    cancelled: 'CANCELADA',
    completed: 'COMPLETADA',
    reserved: 'ACTIVA'
  };

  const nId = `noti_${Date.now()}`;
  demoState.notifications = [
    {
      id: nId,
      type: 'status_update',
      title: titleMap[action] || 'ACTUALIZACIÓN',
      text: 'Estado actualizado.',
      conversationId,
      alertId,
      createdAt: Date.now(),
      read: false
    },
    ...(demoState.notifications || [])
  ];

  notify();
  return nId;
}
