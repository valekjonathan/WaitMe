import { useEffect, useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'

export default function NotificationManager({ user }) {
  // ✅ PROTECCIÓN CRÍTICA PARA iOS
  const isNotificationSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    typeof Notification.permission === 'string'

  const [permission, setPermission] = useState(
    isNotificationSupported ? Notification.permission : 'denied'
  )

  const [lastNotificationId, setLastNotificationId] = useState(null)
  const [lastMessageId, setLastMessageId] = useState(null)

  // Solicitar permisos SOLO si existe la API
  useEffect(() => {
    if (!isNotificationSupported) return

    if (permission === 'default') {
      Notification.requestPermission().then(setPermission)
    }
  }, [permission, isNotificationSupported])

  // Notificaciones
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () =>
      base44.entities.Notification.filter({
        recipient_email: user?.email,
        read: false
      }),
    enabled: !!user?.email && permission === 'granted'
  })

  // Mensajes
  const { data: messages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: () =>
      base44.entities.ChatMessage.filter({
        receiver_id: user?.email,
        read: false
      }),
    enabled: !!user?.email && permission === 'granted'
  })

  // Mostrar notificaciones
  useEffect(() => {
    if (!isNotificationSupported) return
    if (permission !== 'granted') return
    if (!notifications.length) return

    const latest = notifications[0]
    if (latest.id === lastNotificationId) return

    setLastNotificationId(latest.id)

    new Notification('WaitMe!', {
      body: 'Tienes una nueva notificación',
      icon:
        'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692e2149be20ccc53d68b913/d2ae993d3_WaitMe.png'
    })
  }, [notifications, permission, lastNotificationId, isNotificationSupported])

  // Mostrar mensajes
  useEffect(() => {
    if (!isNotificationSupported) return
    if (permission !== 'granted') return
    if (!messages.length) return

    const latest = messages[0]
    if (latest.id === lastMessageId) return

    setLastMessageId(latest.id)

    new Notification('💬 Nuevo mensaje', {
      body: latest.message
    })
  }, [messages, permission, lastMessageId, isNotificationSupported])

  return null
}