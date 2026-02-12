import { useEffect } from 'react'

/* ======================================================
   DEMO FLOW MANAGER — MODO VACÍO TOTAL
   - Sin usuarios
   - Sin alerts
   - Sin chats
   - Sin notificaciones
   - Sin historial
   - Estructura intacta
====================================================== */

let listeners = new Set()

let state = {
  users: [],
  alerts: [],
  chats: [],
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

export function getDemoNotifications() {
  return []
}

export function getDemoHistory() {
  return []
}

/* =========================
   ACTIONS VACÍAS
========================= */

export function createDemoAlert() {
  return null
}

export function removeDemoAlert() {
  return null
}

export function sendDemoMessage() {
  return null
}

export function markNotificationRead() {
  return null
}

/* =========================
   STOP
========================= */

export function stopDemoFlow() {
  listeners.clear()
}

/* =========================
   MODO DEMO ACTIVO
========================= */

export function isDemoMode() {
  return true
}

/* =========================
   COMPONENTE WRAPPER
========================= */

export default function DemoFlowManager({ children }) {
  useEffect(() => {
    startDemoFlow()
  }, [])

  return children
}