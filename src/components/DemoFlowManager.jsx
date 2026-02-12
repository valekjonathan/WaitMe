import { useEffect } from 'react'

/* ======================================================
   DEMO FLOW MANAGER — MODO VACÍO TOTAL
   Estructura intacta
   Todos los exports conservados
   Datos = vacío
====================================================== */

let listeners = new Set()

let state = {
  users: [],
  alerts: [],
  chats: [],
  conversations: [],
  notifications: [],
  history: []
}

/* =========================
   SUBSCRIBE
========================= */

export function subscribeDemoFlow(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function emit() {
  listeners.forEach(cb => {
    try { cb(state) } catch (e) {}
  })
}

/* =========================
   START
========================= */

export function startDemoFlow() {
  emit()
}

/* =========================
   GETTERS
========================= */

export function getDemoUsers() {
  return []
}

export function getDemoAlerts() {
  return []
}

export function getDemoChats() {
  return []
}

export function getDemoConversations() {
  return []
}

export function getDemoNotifications() {
  return []
}

export function getDemoHistory() {
  return []
}

/* =========================
   ACTIONS VACÍAS
========================= */

export function createDemoAlert() { return null }
export function removeDemoAlert() { return null }
export function sendDemoMessage() { return null }
export function markNotificationRead() { return null }

/* =========================
   STOP
========================= */

export function stopDemoFlow() {
  listeners.clear()
}

/* =========================
   MODO DEMO
========================= */

export function isDemoMode() {
  return true
}

/* =========================
   WRAPPER COMPONENT
========================= */

export default function DemoFlowManager({ children }) {
  useEffect(() => {
    startDemoFlow()
  }, [])

  return children
}