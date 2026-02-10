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
  conversations: [
    // "Te reservo:" -> seller (IR apagado para ti)
    {
      id: 'conv_marco',
      otherUser: {
        id: 'marco',
        name: 'Marco',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      role: 'seller',
      irEnabled: false
    },
    // "Reservaste a:" -> buyer (IR encendido para ti)
    {
      id: 'conv_sofia',
      otherUser: {
        id: 'sofia',
        name: 'Sofía',
        photo: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      role: 'buyer',
      irEnabled: true
    }
  ],
  messages: {
    conv_marco: [
      { id: 'm1', from: 'Marco', text: '¿Sigues ahí?', createdAt: Date.now() - 120000 },
      { id: 'm2', from: 'Tú', text: 'Sí, dime.', createdAt: Date.now() - 90000 }
    ],
    conv_sofia: [
      { id: 'm3', from: 'Sofía', text: 'Voy para allá.', createdAt: Date.now() - 60000 },
      { id: 'm4', from: 'Tú', text: 'Perfecto, avísame al llegar.', createdAt: Date.now() - 30000 }
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
