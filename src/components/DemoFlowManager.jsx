import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

let state = {
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

export function demoFlow() {
  return state;
}

export function getDemoState() {
  return state;
}

export default function DemoFlowManager() {
  useEffect(() => {
    toast({
      title: 'Pago completado',
      description: 'Has ganado 2.01€'
    });
  }, []);

  return null;
}
