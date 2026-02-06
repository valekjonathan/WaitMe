import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationManager({ user }) {

  const [permission, setPermission] = useState(() => Notification.permission);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);

  // ---------------- PERMISOS ----------------

  useEffect(() => {
    if (typeof Notification === 'undefined') return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  // ---------------- NOTIFICACIONES ----------------

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    enabled: !!user?.email && permission === 'granted',

    queryFn: async () => {
      return base44.entities.Notification.filter(
        {
          recipient_email: user?.email,
          read: false
        },
        '-created_date'
      );
    },

    staleTime: 60000,
    gcTime: 5 * 60000,
    refetchInterval: 60000
  });

  // ---------------- MENSAJES ----------------

  const { data: messages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    enabled: !!user?.email && permission === 'granted',

    queryFn: async () => {
      return base44.entities.ChatMessage.filter(
        {
          receiver_id: user?.email,
          read: false
        },
        '-created_date'
      );
    },

    staleTime: 60000,
    gcTime: 5 * 60000,
    refetchInterval: 60000
  });

  // ---------------- NUEVAS NOTIFICACIONES ----------------

  useEffect(() => {
    if (!notifications.length || permission !== 'granted') return;

    const latest = notifications[0];
    if (lastNotificationId === latest.id) return;

    setLastNotificationId(latest.id);

    if (user?.notifications_enabled === false) return;

    const shouldNotify =
      (latest.type === 'reservation_request' && user?.notify_reservations !== false) ||
      (latest.type === 'reservation_accepted' && user?.notify_reservations !== false) ||
      (latest.type === 'reservation_rejected' && user?.notify_reservations !== false) ||
      (latest.type === 'buyer_nearby' && user?.notify_proximity !== false) ||
      (latest.type === 'payment_completed' && user?.notify_payments !== false);

    if (!shouldNotify) return;

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
        body = `${latest.sender_name} está llegando a tu ubicación`;
        break;

      case 'payment_completed':
        title = '💰 Pago completado';
        body = `Has recibido ${latest.amount}€`;
        break;
    }

    new Notification(title, {
      body,
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png',
      vibrate: [200, 100, 200]
    });

  }, [notifications, permission, lastNotificationId, user]);

  // ---------------- NUEVOS MENSAJES ----------------

  useEffect(() => {
    if (!messages.length || permission !== 'granted') return;

    const latest = messages[0];
    if (lastMessageId === latest.id) return;

    setLastMessageId(latest.id);

    new Notification('💬 Nuevo mensaje', {
      body: `${latest.sender_name}: ${latest.message}`,
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png',
      vibrate: [200, 100, 200]
    });

  }, [messages, permission, lastMessageId]);

  return null;
}