import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationManager({ user }) {

  // 🚫 Safari iOS NO soporta Notification API
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  const [permission, setPermission] = useState(
    Notification.permission ?? 'default'
  );

  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);

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
    if (!notifications.length || permission !== 'granted') return;

    const latest = notifications[0];
    if (latest.id === lastNotificationId) return;

    setLastNotificationId(latest.id);

    new Notification('WaitMe!', {
      body: 'Tienes una nueva notificación'
    });
  }, [notifications, permission, lastNotificationId]);

  useEffect(() => {
    if (!messages.length || permission !== 'granted') return;

    const latest = messages[0];
    if (latest.id === lastMessageId) return;

    setLastMessageId(latest.id);

    new Notification('💬 Nuevo mensaje', {
      body: latest.message
    });
  }, [messages, permission, lastMessageId]);

  return null;
}