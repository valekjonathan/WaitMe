// src/components/DemoFlowManager.jsx
// MODO VACÍO TOTAL – COMPATIBLE CON TODOS LOS IMPORTS ANTIGUOS

// Flags
export const isDemoMode = () => false;

// Datos (vacíos)
export const getDemoAlerts = () => [];
export const getDemoChats = () => [];
export const getDemoNotifications = () => [];
export const getDemoUsers = () => [];
export const getDemoMessages = () => [];

// Acciones (no hacen nada)
export const startDemoFlow = () => {};
export const stopDemoFlow = () => {};
export const subscribeDemoFlow = () => () => {};
export const unsubscribeDemoFlow = () => {};
export const resetDemoFlow = () => {};

// Alias por si algún archivo usa otros nombres
export const getDemoChatMessages = () => [];
export const sendDemoMessage = () => null;
export const markDemoNotificationAsRead = () => null;

export default function DemoFlowManager() {
  return null;
}