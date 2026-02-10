import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * ESTADO DEMO CENTRAL
 * Base44 está importando varias funciones por nombre desde este módulo.
 * Para que NO vuelva a romper el preview, exportamos todas las que Base44 está pidiendo.
 */
const demoState = {
  conversations: [
    {
      id: 'conv_marco',
      otherUser: {
        id: 'marco',
        name: 'Marco',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      role: 'seller', // "te reservo" => IR apagado para ti
      irEnabled: false
    },
    {
      id: 'conv_sofia',
      otherUser: {
        id: 'sofia',
        name: 'Sofía',
        photo: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      role: 'buyer', // "reservaste a" => IR encendido para ti
      irEnabled: true
    }
  ],
  messages: {
    conv_marco: [
      { id: 'm1', from: 'Marco', text: '¿Sigues ahí?' },
      { id: 'm2', from: 'Tú', text: 'Sí, dime.' }
    ],
    conv_sofia: [
      { id: 'm3', from: 'Sofía', text: 'Voy para allá.' },
      { id: 'm4', from: 'Tú', text: 'Perfecto, avísame al llegar.' }
    ]
  },
  notifications: [
    {
      id: 'n1',
      type: 'reservation_request',
      user: 'Marco',
      conversationId: 'conv_marco',
      read: false
    },
    {
      id: 'n2',
      type: 'payment_completed',
      user: 'Sofía',
      conversationId: 'conv_sofia',
      read: false
    }
  ]
};

// ====== HELPERS INTERNOS ======
function removeNotification(id) {
  demoState.notifications = demoState.notifications.filter(n => n.id !== id);
}

function markRead(id) {
  const n = demoState.notifications.find(x => x.id === id);
  if (n) n.read = true;
}

// ====== EXPORTS QUE BASE44 PUEDE PEDIR (blindado) ======
export function demoFlow() {
  return demoState;
}

export function getDemoState() {
  return demoState;
}

export function getDemoConversation(conversationId) {
  return demoState.conversations.find(c => c.id === conversationId) || null;
}

export function getDemoMessages(conversationId) {
  return demoState.messages[conversationId] || [];
}

export function getDemoNotifications() {
  return demoState.notifications;
}

// NUEVO: Base44 lo está pidiendo
export function markDemoRead(notificationId) {
  // Marcar como leído (y opcionalmente quitarlo si quieres “vaciar”)
  markRead(notificationId);
}

// Extras defensivos (por si Base44 pide más, no rompen nada)
export function markAllDemoRead() {
  demoState.notifications.forEach(n => (n.read = true));
}

export function clearDemoNotifications() {
  demoState.notifications = [];
}

export function addDemoNotification(notification) {
  if (!notification?.id) return;
  demoState.notifications = [notification, ...demoState.notifications];
}

export function removeDemoNotification(notificationId) {
  removeNotification(notificationId);
}

export function isDemoMode() {
  return true;
}

export function setDemoMode() {
  // demo siempre ON (no-op)
  return true;
}

// ====== COMPONENTE ======
export default function DemoFlowManager() {
  useEffect(() => {
    toast({
      title: 'Pago completado',
      description: 'Has ganado 2.01€'
    });
  }, []);

  return null;
}
