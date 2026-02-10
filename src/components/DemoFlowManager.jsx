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
  notifications: [
    {
      id: 'n1',
      type: 'reservation_request',
      user: 'Marco',
      conversationId: 'conv_marco',
      read: false,
      createdAt: Date.now() - 180000
    },
    {
      id: 'n2',
      type: 'payment_completed',
      user: 'Sofía',
      conversationId: 'conv_sofia',
      read: false,
      createdAt: Date.now() - 150000
    }
  ]
};

function emit() {
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

function genId(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// ====== EXPORTS QUE BASE44/tu app ESTÁ PIDIENDO ======
export function demoFlow() {
  return demoState;
}

export function startDemoFlow() {
  if (started) return;
  started = true;
  // Estado demo ya precargado. Emit inicial por si alguien se suscribe después.
  emit();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDemoState() {
  return demoState;
}

export function getDemoConversation(conversationId) {
  return demoState.conversations.find((c) => c.id === conversationId) || null;
}

export function getDemoMessages(conversationId) {
  return demoState.messages[conversationId] || [];
}

export function getDemoNotifications() {
  return demoState.notifications;
}

export function markDemoRead(notificationId) {
  const n = demoState.notifications.find((x) => x.id === notificationId);
  if (n) n.read = true;
  emit();
}

/**
 * La pantalla Chat llama a esto al enviar un mensaje.
 * Debe añadirlo al hilo y refrescar la UI.
 */
export function sendDemoMessage(conversationId, text, attachments = []) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const msg = {
    id: genId('msg'),
    from: 'Tú',
    text: clean,
    attachments,
    createdAt: Date.now()
  };

  if (!demoState.messages[conversationId]) demoState.messages[conversationId] = [];
  demoState.messages[conversationId].push(msg);

  // Para que Chats tenga "last_message_text" visible en tarjetas (si tu UI lo usa)
  const conv = demoState.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.last_message_text = clean;
    conv.last_message_at = msg.createdAt;
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