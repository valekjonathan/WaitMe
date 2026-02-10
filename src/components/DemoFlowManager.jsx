import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * ESTADO DEMO CENTRAL
 * Base44 importa funciones concretas.
 * TODAS deben existir o rompe el preview.
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
      role: 'seller',
      irEnabled: false
    },
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
    conv_marco: [{ from: 'Marco', text: '¿Sigues ahí?' }],
    conv_sofia: [{ from: 'Sofía', text: 'Voy para allá' }]
  },
  notifications: [
    {
      id: 'n1',
      type: 'reservation_request',
      user: 'Marco',
      conversationId: 'conv_marco'
    },
    {
      id: 'n2',
      type: 'payment_completed',
      user: 'Sofía',
      conversationId: 'conv_sofia'
    }
  ]
};

// === EXPORTS QUE BASE44 ESPERA ===
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

// === COMPONENTE ===
export default function DemoFlowManager() {
  useEffect(() => {
    toast({
      title: 'Pago completado',
      description: 'Has ganado 2.01€'
    });
  }, []);

  return null;
}
