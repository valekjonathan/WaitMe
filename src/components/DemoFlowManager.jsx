import { useEffect } from 'react'

/* ======================================================
   DEMO FLOW MANAGER — MODO VACÍO TOTAL
   Compatible con CUALQUIER export anterior
====================================================== */

const emptyArray = []
const emptyNull = null

/* ======================================================
   PROXY UNIVERSAL
   Cualquier función exportada devuelve vacío
====================================================== */

const handler = {
  get: () => () => emptyArray
}

const universal = new Proxy({}, handler)

/* ======================================================
   EXPORT DEFAULT (WRAPPER)
====================================================== */

export default function DemoFlowManager({ children }) {
  useEffect(() => {}, [])
  return children
}

/* ======================================================
   EXPORTAMOS TODO LO POSIBLE
====================================================== */

export const demoFlow = universal

// Proxy para cualquier import nombrado
export const {
  getDemoUsers,
  getDemoAlerts,
  getDemoChats,
  getDemoMessages,
  getDemoConversations,
  getDemoConversation,
  getDemoNotifications,
  getDemoHistory,
  createDemoAlert,
  removeDemoAlert,
  sendDemoMessage,
  markNotificationRead,
  markDemoRead,
  markAsRead,
  subscribeDemoFlow,
  startDemoFlow,
  stopDemoFlow,
  isDemoMode
} = universal