import { useEffect } from 'react';

/* ======================================================
   DEMO CENTRAL ÚNICO (VACÍO + COMPAT)
   - Deja la app sin datos demo (sin tarjetas / sin usuarios)
   - Mantiene TODOS los exports que el proyecto espera
   - No cambia nada visual, solo evita errores de imports
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) {
  try {
    fn?.();
  } catch {}
}
function notify() {
  listeners.forEach((l) => safeCall(l));
}

/** Estado demo en memoria (exportado por compat) */
export const demoFlow = {
  alerts: [],
  conversations: [],
  messagesByConversationId: {},
  notifications: []
};

// ======================
// API pública (compat)
// ======================
export function isDemoMode() {
  // demo siempre disponible, pero vacío.
  return true;
}

export function startDemoFlow() {
  if (started) return;
  started = true;

  // tick "suave" para que pantallas que dependen de subscribe no se queden colgadas
  tickTimer = setInterval(() => notify(), 1500);
}

export function stopDemoFlow() {
  started = false;
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}

export function resetDemoFlow() {
  demoFlow.alerts = [];
  demoFlow.conversations = [];
  demoFlow.messagesByConversationId = {};
  demoFlow.notifications = [];
  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ---------- Alerts ----------
export function getDemoAlerts() {
  return demoFlow.alerts || [];
}

export function getDemoAlertById(alertId) {
  return (demoFlow.alerts || []).find((a) => String(a?.id) === String(alertId)) || null;
}

// ---------- Conversations / Messages ----------
export function getDemoConversations() {
  return demoFlow.conversations || [];
}

export function getDemoConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => String(c?.id) === String(conversationId)) || null;
}

export function ensureConversationForAlert(alertId, otherUserId) {
  const id = `conv_${String(alertId)}_${String(otherUserId || 'demo')}`;
  let conv = getDemoConversation(id);

  if (!conv) {
    conv = {
      id,
      alert_id: alertId,
      other_user_id: otherUserId || 'demo',
      last_message: '',
      unread_count: 0,
      updated_date: new Date().toISOString()
    };
    demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];
    demoFlow.messagesByConversationId[id] = demoFlow.messagesByConversationId[id] || [];
  }

  return conv;
}

export function getDemoMessages(conversationId) {
  return demoFlow.messagesByConversationId?.[conversationId] || [];
}

export function sendDemoMessage(conversationId, message) {
  // message puede venir como string o objeto
  const msgObj =
    typeof message === 'string'
      ? { id: `m_${Date.now()}`, message, created_date: new Date().toISOString(), sender_id: 'me' }
      : {
          id: message?.id || `m_${Date.now()}`,
          created_date: message?.created_date || new Date().toISOString(),
          ...message
        };

  demoFlow.messagesByConversationId[conversationId] =
    demoFlow.messagesByConversationId[conversationId] || [];

  demoFlow.messagesByConversationId[conversationId].push(msgObj);

  // actualizar conversación si existe
  const conv = getDemoConversation(conversationId);
  if (conv) {
    conv.last_message = msgObj.message || msgObj.text || '';
    conv.updated_date = msgObj.created_date;
  }

  notify();
  return msgObj;
}

export function ensureInitialWaitMeMessage(conversationId) {
  const msgs = getDemoMessages(conversationId);
  if (msgs.length > 0) return;

  sendDemoMessage(conversationId, {
    sender_id: 'waitme',
    sender_name: 'WaitMe!',
    message: 'Chat iniciado.',
    read: true
  });
}

export function markDemoRead(conversationId) {
  const msgs = getDemoMessages(conversationId).map((m) => ({ ...m, read: true }));
  demoFlow.messagesByConversationId[conversationId] = msgs;

  const conv = getDemoConversation(conversationId);
  if (conv) conv.unread_count = 0;

  notify();
}

export function applyDemoAction() {
  // En modo vacío no hacemos nada.
  return;
}

// ---------- Notifications ----------
export function getDemoNotifications() {
  return demoFlow.notifications || [];
}

export function markDemoNotificationRead(notificationId) {
  demoFlow.notifications = (demoFlow.notifications || []).map((n) =>
    String(n?.id) === String(notificationId) ? { ...n, read: true } : n
  );
  notify();
}

// ======================
// Hook (por si algún sitio lo usa)
// ======================
export function useDemoFlow() {
  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => {});
    return () => unsub?.();
  }, []);
}
