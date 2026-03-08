/**
 * Demo Flow Manager. Orquestador ligero.
 * Re-exporta todo para compatibilidad con imports existentes.
 */

import { demoFlow, getAlert, getConversation, pushMessage } from '@/hooks/demo/useDemoFlowState';
import { notify, subscribeDemoFlow, subscribeToDemoFlow } from '@/hooks/demo/useDemoFlowSync';
import { startDemoFlow, stopDemoFlow } from '@/hooks/demo/useDemoFlowTimers';
import {
  ensureConversationForAlert,
  applyDemoAction,
  reserveDemoAlert,
  ensureInitialWaitMeMessage,
  addDemoAlert,
  addIncomingWaitMeConversation,
  markDemoRead,
  markAllDemoRead,
} from '@/hooks/demo/useDemoFlowActions';

export { demoFlow };

export function isDemoMode() {
  try {
    if (typeof window === 'undefined') return false;
    const qs = new URLSearchParams(window.location.search);
    return qs.get('demo') === '1';
  } catch {
    return false;
  }
}

export function getDemoState() {
  return demoFlow;
}

export { startDemoFlow, stopDemoFlow, subscribeDemoFlow, subscribeToDemoFlow };

export function getDemoConversations() {
  return demoFlow.conversations || [];
}

export function getDemoAlerts() {
  return demoFlow.alerts || [];
}

export function getDemoAlert(alertId) {
  return getAlert(alertId);
}

export function getDemoAlertById(alertId) {
  return getAlert(alertId);
}

export function getDemoAlertByID(alertId) {
  return getAlert(alertId);
}

export function getDemoConversation(conversationId) {
  return getConversation(conversationId);
}

export function getDemoConversationById(conversationId) {
  return getConversation(conversationId);
}

export function getDemoMessages(conversationId) {
  return demoFlow.messages && demoFlow.messages[conversationId]
    ? demoFlow.messages[conversationId]
    : [];
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getConversation(conversationId);
  if (!conv) return;

  if (isMine) {
    pushMessage(conversationId, {
      mine: true,
      senderName: demoFlow.me.name,
      senderPhoto: demoFlow.me.photo,
      text: clean,
      attachments,
    });
  } else {
    pushMessage(conversationId, {
      mine: false,
      senderName: conv.participant2_name,
      senderPhoto: conv.participant2_photo,
      text: clean,
      attachments,
    });
  }

  notify();
}

export function getDemoNotifications() {
  return demoFlow.notifications || [];
}

export function markDemoNotificationRead(notificationId) {
  return markDemoRead(notificationId);
}

export function markDemoNotificationReadLegacy(notificationId) {
  return markDemoRead(notificationId);
}

export function ensureConversationForAlertId(alertId) {
  const conv = ensureConversationForAlert(alertId);
  return conv?.id || null;
}

export function setDemoMode() {
  return true;
}

export {
  ensureConversationForAlert,
  addDemoAlert,
  addIncomingWaitMeConversation,
  ensureInitialWaitMeMessage,
  applyDemoAction,
  reserveDemoAlert,
  markDemoRead,
  markAllDemoRead,
};

export default function DemoFlowManager() {
  return null;
}
