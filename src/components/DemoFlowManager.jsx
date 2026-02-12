import { useEffect } from 'react'

/* ======================================================
   DEMO FLOW MANAGER — VACÍO TOTAL
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
   OBJETO DEMOFLOW
========================= */

export const demoFlow = {
  getUsers: () => [],
  getAlerts: () => [],
  getChats: () => [],
  getConversations: () => [],
  getConversation: () => null,
  getNotifications: () => [],
  getHistory: () => [],
  createAlert: () => null,
  removeAlert: () => null,
  sendMessage: () => null,
  markNotificationRead: () => null
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

export function getDemoUsers() { return [] }
export function getDemoAlerts() { return [] }
export function getDemoChats() { return [] }
export function getDemoConversations() { return [] }
export function getDemoConversation() { return null }
export function getDemoNotifications() { return [] }
export function getDemoHistory() { return [] }

/* =========================
   STOP
========================= */

export function stopDemoFlow() {
  listeners.clear()
}

export function isDemoMode() {
  return true
}

/* =========================
   WRAPPER
========================= */

export default function DemoFlowManager({ children }) {
  useEffect(() => {
    startDemoFlow()
  }, [])

  return children
}