// ======================
// DEMO FLOW MANAGER
// Sistema de notificaciones y conversaciones en memoria para modo demo
// ======================

import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

let state = {
  conversations: [],
  messages: {},
  users: {},
  actionableNotifications: [],
  lastNotificationTime: Date.now()
};

const listeners = new Set();

// Usuarios demo
const DEMO_USERS = {
  sofia: {
    id: 'demo_sofia',
    name: 'Sofía',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  marco: {
    id: 'demo_marco',
    name: 'Marco',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  },
  laura: {
    id: 'demo_laura',
    name: 'Laura',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
  },
  carlos: {
    id: 'demo_carlos',
    name: 'Carlos',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
  },
  ana: {
    id: 'demo_ana',
    name: 'Ana',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  lucia: {
    id: 'demo_lucia',
    name: 'Lucía',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg'
  }
};

// Mensajes predefinidos
const DEMO_MESSAGES = [
  '¡Hola! 👋',
  'Ya voy de camino',
  '¿Sigues ahí?',
  'Perfecto, gracias!',
  'Llego en 5 minutos',
  'Estoy cerca',
  '¿Dónde exactamente?',
  'Genial, te veo pronto',
  'Muchas gracias! 😊',
  'De nada, buen día!'
];

// Inicializar estado demo
export function startDemoFlow() {
  const now = Date.now();
  
  state.users = DEMO_USERS;
  
  // Crear conversación demo con Sofía
  state.conversations = [
    {
      id: 'conv_sofia',
      otherUserId: 'demo_sofia',
      other_name: 'Sofía',
      other_photo: DEMO_USERS.sofia.photo,
      lastMessageText: 'Perfecto, voy llegando',
      lastMessageAt: now - 60000,
      unreadCount: 2
    }
  ];

  // Mensajes iniciales
  state.messages = {
    conv_sofia: [
      {
        id: 'msg1',
        senderId: 'demo_sofia',
        senderName: 'Sofía',
        senderPhoto: DEMO_USERS.sofia.photo,
        text: '¡Hola! He visto tu alerta 🚗',
        ts: now - 300000,
        mine: false,
        kind: 'text'
      },
      {
        id: 'msg2',
        senderId: 'demo_sofia',
        senderName: 'Sofía',
        senderPhoto: DEMO_USERS.sofia.photo,
        text: '¿Sigues disponible?',
        ts: now - 240000,
        mine: false,
        kind: 'text'
      },
      {
        id: 'msg3',
        senderId: 'you',
        senderName: 'Tú',
        senderPhoto: null,
        text: 'Sí, aquí estoy',
        ts: now - 180000,
        mine: true,
        kind: 'text'
      },
      {
        id: 'msg4',
        senderId: 'demo_sofia',
        senderName: 'Sofía',
        senderPhoto: DEMO_USERS.sofia.photo,
        text: 'Perfecto, voy llegando',
        ts: now - 60000,
        mine: false,
        kind: 'text'
      }
    ]
  };

  notifyListeners();
}

// Suscribirse a cambios
export function subscribeDemoFlow(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Notificar cambios
function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb(state);
    } catch (e) {
      console.error('Error en listener:', e);
    }
  });
}

// Obtener conversación
export function getDemoConversation(conversationId) {
  return state.conversations.find(c => c.id === conversationId) || null;
}

// Obtener mensajes
export function getDemoMessages(conversationId) {
  return state.messages[conversationId] || [];
}

// Marcar como leído
export function markDemoRead(conversationId) {
  const conv = state.conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.unreadCount = 0;
    notifyListeners();
  }
}

// Enviar mensaje
export function sendDemoMessage(conversationId, text, attachments = []) {
  const now = Date.now();
  
  if (!state.messages[conversationId]) {
    state.messages[conversationId] = [];
  }

  // Mensaje del usuario
  const userMsg = {
    id: `msg_${now}`,
    senderId: 'you',
    senderName: 'Tú',
    senderPhoto: null,
    text,
    ts: now,
    mine: true,
    kind: 'text',
    attachments
  };

  state.messages[conversationId].push(userMsg);

  // Actualizar conversación
  const conv = state.conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.lastMessageText = text;
    conv.lastMessageAt = now;
  }

  // Respuesta automática después de 2 segundos
  setTimeout(() => {
    const otherUser = state.users[conv?.otherUserId];
    if (!otherUser) return;

    const responseText = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
    const responseMsg = {
      id: `msg_${Date.now()}`,
      senderId: otherUser.id,
      senderName: otherUser.name,
      senderPhoto: otherUser.photo,
      text: responseText,
      ts: Date.now(),
      mine: false,
      kind: 'text'
    };

    state.messages[conversationId].push(responseMsg);
    
    if (conv) {
      conv.lastMessageText = responseText;
      conv.lastMessageAt = Date.now();
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }

    notifyListeners();
  }, 2000);

  notifyListeners();
}

// Crear notificación (cuando se cierra un toast)
export function createDemoNotification(data) {
  const now = Date.now();
  
  const notification = {
    id: `notif_${now}`,
    type: data.type || 'reservation_request',
    sender_id: data.sender_id || 'demo_sofia',
    sender_name: data.sender_name || 'Sofía',
    sender_photo: data.sender_photo || DEMO_USERS.sofia.photo,
    recipient_id: 'you',
    alert_id: data.alert_id || `alert_${now}`,
    amount: data.amount || 5,
    status: 'pending',
    read: false,
    created_date: new Date(now).toISOString(),
    alert: data.alert || {
      id: `alert_${now}`,
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_color: 'azul',
      car_plate: '1234ABC',
      available_in_minutes: 10,
      allow_phone_calls: true,
      phone: '+34612345678',
      address: 'Calle Uría'
    }
  };

  state.actionableNotifications.unshift(notification);
  
  // Crear/actualizar conversación
  const existingConv = state.conversations.find(c => c.otherUserId === notification.sender_id);
  if (!existingConv) {
    const newConv = {
      id: `conv_${notification.sender_id}`,
      otherUserId: notification.sender_id,
      other_name: notification.sender_name,
      other_photo: notification.sender_photo,
      lastMessageText: `Ey! Te he enviado un WaitMe!`,
      lastMessageAt: now,
      unreadCount: 1
    };
    state.conversations.push(newConv);
    
    // Mensaje inicial
    state.messages[newConv.id] = [
      {
        id: `msg_${now}`,
        senderId: notification.sender_id,
        senderName: notification.sender_name,
        senderPhoto: notification.sender_photo,
        text: `Ey! Te he enviado un WaitMe!`,
        ts: now,
        mine: false,
        kind: 'text'
      }
    ];
  }

  notifyListeners();
  return notification;
}

// Generar notificación aleatoria cada X segundos
let notificationInterval = null;

export function startAutoNotifications(intervalMs = 20000) {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  notificationInterval = setInterval(() => {
    const users = Object.values(DEMO_USERS);
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    const types = ['reservation_request', 'reservation_accepted', 'buyer_nearby', 'payment_completed'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const amounts = [3, 4, 5, 6, 7];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];

    const notificationData = {
      type: randomType,
      sender_id: randomUser.id,
      sender_name: randomUser.name,
      sender_photo: randomUser.photo,
      amount: randomAmount
    };

    // Mostrar toast
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('waitme:demoToast', {
        detail: {
          title: getToastTitle(randomType, randomUser.name),
          description: getToastDescription(randomType, randomAmount),
          notificationData
        }
      });
      window.dispatchEvent(event);
    }
  }, intervalMs);
}

export function stopAutoNotifications() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

function getToastTitle(type, name) {
  switch (type) {
    case 'reservation_request':
      return `${name} quiere un WaitMe!`;
    case 'reservation_accepted':
      return `${name} aceptó tu WaitMe!`;
    case 'buyer_nearby':
      return `${name} está cerca`;
    case 'payment_completed':
      return 'Pago completado';
    default:
      return 'Nueva notificación';
  }
}

function getToastDescription(type, amount) {
  switch (type) {
    case 'reservation_request':
      return `Quiere pagar ${amount}€ por tu plaza`;
    case 'reservation_accepted':
      return 'Revisa la ubicación y dirígete allí';
    case 'buyer_nearby':
      return 'El pago se liberará cuando estéis a 10 metros';
    case 'payment_completed':
      return `Has ganado ${(amount * 0.67).toFixed(2)}€`;
    default:
      return '';
  }
}

// Estado singleton
export const demoFlow = {
  getState: () => state,
  subscribe: subscribeDemoFlow,
  createNotification: createDemoNotification,
  startAutoNotifications,
  stopAutoNotifications
};

// Auto-inicializar
if (typeof window !== 'undefined') {
  startDemoFlow();
}

// Componente que gestiona el ciclo de vida
export default function DemoFlowManager() {
  useEffect(() => {
    startAutoNotifications(20000);

    const onToastClosed = (e) => {
      const data = e?.detail || {};
      createDemoNotification(data);
    };

    window.addEventListener('waitme:toastClosed', onToastClosed);
    
    return () => {
      window.removeEventListener('waitme:toastClosed', onToastClosed);
      stopAutoNotifications();
    };
  }, []);

  return null;
}