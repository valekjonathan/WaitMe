import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationManager({ user }) {
  // 🔒 PROTECCIÓN CRÍTICA PARA SAFARI iOS
  const isNotificationSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    typeof Notification.permission === 'string';

  if (!isNotificationSupported) {
    // iPhone → no rompe la app
    return null;
  }

  const [permission, setPermission] = useState(Notification.permission);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);

  // Solicitar permisos
  useEffect(() => {
    if (permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, [permission]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () =>
      base44.entities.Notification.filter({
        recipient_email: user?.email,
        read: false
      }),
    enabled: !!user?.email && permission === 'granted'
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: () =>
      base44.entities.ChatMessage.filter({
        receiver_id: user?.email,
        read: false
      }),
    enabled: !!user?.email && permission === 'granted'
  });

  useEffect(() => {
    if (notifications.length === 0 || permission !== 'granted') return;

    const latest = notifications[0];
    if (lastNotificationId === latest.id) return;

    setLastNotificationId(latest.id);
    if (user?.notifications_enabled === false) return;

    let title = 'WaitMe!';
    let body = '';

    switch (latest.type) {
      case 'reservation_request':
        title = '🚗 Nueva solicitud de reserva';
        body = `${latest.sender_name} quiere reservar tu plaza por ${latest.amount}€`;
        break;
      case 'reservation_accepted':
        title = '✅ Reserva aceptada';
        body = `${latest.sender_name} ha aceptado tu solicitud`;
        break;
      case 'reservation_rejected':
        title = '❌ Reserva rechazada';
        body = `${latest.sender_name} ha rechazado tu solicitud`;
        break;
      case 'buyer_nearby':
        title = '📍 El comprador está cerca';
        body = `${latest.sender_name} está llegando`;
        break;
      case 'payment_completed':
        title = '💰 Pago completado';
        body = `Has recibido ${latest.amount}€`;
        break;
      default:
        return;
    }

    new Notification(title, { body });
  }, [notifications, permission, lastNotificationId, user]);

  useEffect(() => {
    if (messages.length === 0 || permission !== 'granted') return;

    const latest = messages[0];
    if (lastMessageId === latest.id) return;

    setLastMessageId(latest.id);

    new Notification('💬 Nuevo mensaje', {
      body: `${latest.sender_name}: ${latest.message}`
    });
  }, [messages, permission, lastMessageId]);

  return null;
}