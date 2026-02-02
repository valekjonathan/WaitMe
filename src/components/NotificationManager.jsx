import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationManager({ user }) {
  const supportsNotifications = useMemo(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  // ⚠️ En iPhone Safari "Notification" puede NO existir → no romper nunca
  const [permission, setPermission] = useState(() => {
    if (!supportsNotifications) return 'denied';
    try {
      return window.Notification.permission || 'default';
    } catch {
      return 'denied';
    }
  });

  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);

  // ❌ Importante: NO pedir permisos al cargar.
  // iOS exige gesto del usuario, y además si no existe Notification rompería.
  // Si algún día quieres pedir permisos, hazlo desde un botón/ajuste con onClick.
  useEffect(() => {
    if (!supportsNotifications) return;
    try {
      setPermission(window.Notification.permission || 'default');
    } catch {
      setPermission('denied');
    }
  }, [supportsNotifications]);

  const canNotify = supportsNotifications && permission === 'granted';

  // Notificaciones nuevas (solo si se puede notificar)
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () =>
      base44.entities.Notification.filter({
        recipient_email: user?.email,
        read: false
      }),
    enabled: !!user?.email && canNotify,
    staleTime: 15000,
    refetchInterval: 15000
  });

  // Mensajes nuevos (solo si se puede notificar)
  const { data: messages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: () =>
      base44.entities.ChatMessage.filter({
        receiver_id: user?.email,
        read: false
      }),
    enabled: !!user?.email && canNotify,
    staleTime: 15000,
    refetchInterval: 15000
  });

  useEffect(() => {
    if (!canNotify) return;
    if (!notifications?.length) return;

    const latest = notifications[0];
    if (!latest?.id) return;
    if (lastNotificationId === latest.id) return;

    setLastNotificationId(latest.id);

    // Preferencias del usuario
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
      default:
        body = 'Tienes una nueva notificación';
        break;
    }

    try {
      new window.Notification(title, {
        body,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png'
      });
    } catch {
      // si iOS lo bloquea, no rompemos nada
    }
  }, [canNotify, notifications, lastNotificationId, user]);

  useEffect(() => {
    if (!canNotify) return;
    if (!messages?.length) return;

    const latest = messages[0];
    if (!latest?.id) return;
    if (lastMessageId === latest.id) return;

    setLastMessageId(latest.id);

    try {
      new window.Notification('💬 Nuevo mensaje', {
        body: `${latest.sender_name}: ${latest.message}`,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png'
      });
    } catch {
      // no rompemos nada
    }
  }, [canNotify, messages, lastMessageId]);

  return null;
}