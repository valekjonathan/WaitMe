import { useEffect } from 'react'

/* ======================================================
   DEMO FLOW MANAGER — MODO VACÍO ABSOLUTO
   Compatible con CUALQUIER export anterior
   No rompe imports
   Datos completamente vacíos
====================================================== */

const emptyArray = []
const emptyObject = {}
const emptyNull = null

/* ======================================================
   PROXY UNIVERSAL
   Cualquier función que se llame devuelve vacío
====================================================== */

const universalHandler = {
  get: () => () => emptyArray
}

export const demoFlow = new Proxy({}, universalHandler)

/* ======================================================
   EXPORTS EXPLÍCITOS MÁS COMUNES
====================================================== */

export const getDemoUsers = () => emptyArray
export const getDemoAlerts = () => emptyArray
export const getDemoChats = () => emptyArray
export const getDemoMessages = () => emptyArray
export const getDemoConversations = () => emptyArray
export const getDemoConversation = () => emptyNull
export const getDemoNotifications = () => emptyArray
export const getDemoHistory = () => emptyArray

export const createDemoAlert = () => emptyNull
export const removeDemoAlert = () => emptyNull
export const sendDemoMessage = () => emptyNull
export const markNotificationRead = () => emptyNull

export const isDemoMode = () => true
export const stopDemoFlow = () => {}
export const subscribeDemoFlow = () => () => {}
export const startDemoFlow = () => {}

/* ======================================================
   WRAPPER
====================================================== */

export default function DemoFlowManager({ children }) {
  useEffect(() => {}, [])
  return children
}