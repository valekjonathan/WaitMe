import { useEffect } from 'react'
import { toast } from '@/components/ui/use-toast'

/* ======================================================
   DEMO CENTRAL ÚNICO – EXPORTA TODO LO QUE TU APP PIDE
====================================================== */

let started = false
const listeners = new Set()

function notify() {
  listeners.forEach(l => l())
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

/* ======================================================
   ESTADO DEMO
====================================================== */

const demoState = {
  conversations: [],
  messages: {},
  alerts: [],
  notifications: []
}

/* ======================================================
   CORE
====================================================== */

export function startDemoFlow() {
  if (started) return
  started = true
  notify()
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb)
}

export function getDemoState() {
  return demoState
}

/* ======================================================
   CONVERSACIONES
====================================================== */

export function getDemoConversations() {
  return demoState.conversations
}

export function getDemoConversation(id) {
  return demoState.conversations.find(c => c.id === id) || null
}

/* ======================================================
   MENSAJES
====================================================== */

export function getDemoMessages(conversationId) {
  return demoState.messages[conversationId] || []
}

export function sendDemoMessage({ conversationId, text, isMine = true }) {
  const clean = String(text || '').trim()
  if (!conversationId || !clean) return

  if (!demoState.messages[conversationId]) {
    demoState.messages[conversationId] = []
  }

  const msg = {
    id: genId('msg'),
    mine: isMine,
    senderName: isMine ? 'Tú' : 'Usuario',
    senderPhoto: null,
    text: clean,
    ts: Date.now()
  }

  demoState.messages[conversationId].push(msg)
  notify()
}

/* ======================================================
   ALERTAS
====================================================== */

export function getDemoAlerts() {
  return demoState.alerts
}

export function getDemoAlertById(id) {
  return demoState.alerts.find(a => a.id === id) || null
}

export function setDemoAlertStatus(id, status) {
  const alert = demoState.alerts.find(a => a.id === id)
  if (!alert) return
  alert.status = status
  notify()
}

/* ======================================================
   NOTIFICACIONES
====================================================== */

export function getDemoNotifications() {
  return demoState.notifications
}

export function markDemoNotificationRead(id) {
  const n = demoState.notifications.find(n => n.id === id)
  if (!n) return
  n.read = true
  notify()
}

export function markDemoRead(conversationId) {
  notify()
}

export function clearDemoNotifications() {
  demoState.notifications = []
  notify()
}

export function addDemoNotification(notification) {
  if (!notification?.id) return
  demoState.notifications.unshift(notification)
  notify()
}

/* ======================================================
   FLAGS
====================================================== */

export function isDemoMode() {
  return true
}

export function setDemoMode() {
  return true
}

/* ======================================================
   OBJETO GLOBAL (POR SI TU APP LO USA)
====================================================== */

export const demoFlow = {
  start: startDemoFlow,
  getState: getDemoState,
  getConversations: getDemoConversations,
  getConversation: getDemoConversation,
  getMessages: getDemoMessages,
  getAlerts: getDemoAlerts,
  getAlertById: getDemoAlertById,
  getNotifications: getDemoNotifications,
  subscribe: subscribeDemoFlow,
  subscribeDemoFlow,
  subscribeToDemoFlow,
  markRead: markDemoRead,
  markDemoRead,
  isDemoMode
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function DemoFlowManager() {
  useEffect(() => {
    startDemoFlow()

    toast({
      title: 'Modo Demo Activo',
      description: 'Sistema demo cargado correctamente.'
    })
  }, [])

  return null
}