/**
 * Acciones del demo flow.
 * @module hooks/demo/useDemoFlowActions
 */

import { genId, normalize, statusToTitle } from '@/lib/demo/demoFlowUtils';
import {
  demoFlow,
  getAlert,
  getConversation,
  ensureMessagesArray,
  pushMessage,
  addNotification,
  pickUser,
} from './useDemoFlowState';
import { notify } from './useDemoFlowSync';

export function ensureConversationForAlert(alertId, hint = null) {
  if (!alertId) return null;

  const existing = (demoFlow.conversations || []).find((c) => c.alert_id === alertId);
  if (existing) return existing;

  const alert = getAlert(alertId);
  const otherName = hint?.fromName || hint?.otherName || alert?.user_name || 'Usuario';
  const otherPhoto = hint?.otherPhoto || hint?.fromPhoto || alert?.user_photo || null;
  const convId = `conv_${alertId}_me`;

  const conv = {
    id: convId,
    participant1_id: 'me',
    participant2_id: alert?.user_id || genId('u'),
    participant1_name: demoFlow.me.name,
    participant2_name: otherName,
    participant1_photo: demoFlow.me.photo,
    participant2_photo: otherPhoto,
    other_name: otherName,
    other_photo: otherPhoto,
    alert_id: alertId,
    last_message_text: '',
    last_message_at: Date.now(),
    unread_count_p1: 0,
    unread_count_p2: 0,
  };

  demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];
  ensureMessagesArray(convId);
  notify();
  return conv;
}

export function applyDemoAction({ conversationId, alertId, action }) {
  const a = normalize(action);
  const title = statusToTitle(a);

  const alert = alertId ? getAlert(alertId) : null;
  if (alert) alert.status = a;

  const conv = conversationId
    ? getConversation(conversationId)
    : alertId
      ? ensureConversationForAlert(alertId)
      : null;
  const convId = conv?.id || null;

  addNotification({
    type: 'status_update',
    title,
    text: 'Estado actualizado.',
    conversationId: convId,
    alertId,
    read: false,
  });

  if (convId) {
    let msgText = '';
    if (title === 'ME LO PIENSO') msgText = 'Me lo estoy pensando…';
    else if (title === 'PRÓRROGA') msgText = 'Pido una prórroga.';
    else if (title === 'CANCELADA') msgText = 'Cancelo la operación.';
    else if (title === 'RECHAZADA') msgText = 'Rechazo la operación.';
    else if (title === 'COMPLETADA') msgText = 'Operación completada ✅';
    else if (title === 'ACTIVA') msgText = 'Operación activa.';
    else msgText = 'Actualización de estado.';

    pushMessage(convId, {
      mine: false,
      senderName: conv?.participant2_name || 'Usuario',
      senderPhoto: conv?.participant2_photo || null,
      text: msgText,
    });
  }

  notify();
}

export function reserveDemoAlert(alertId) {
  const alert = getAlert(alertId);
  if (!alert) return null;
  if (normalize(alert.status) !== 'active') return null;

  alert.status = 'reserved';
  alert.reserved_by_id = 'me';
  alert.reserved_by_name = demoFlow.me.name;
  alert.reserved_by_photo = demoFlow.me.photo;

  const conv = ensureConversationForAlert(alertId, {
    fromName: alert.user_name,
    otherPhoto: alert.user_photo,
  });

  ensureInitialWaitMeMessage(conv?.id);

  addNotification({
    type: 'status_update',
    title: 'ACTIVA',
    text: `Has enviado un WaitMe a ${alert.user_name}.`,
    conversationId: conv?.id,
    alertId,
    read: false,
  });

  notify();
  return conv?.id || null;
}

export function ensureInitialWaitMeMessage(conversationId) {
  const conv = getConversation(conversationId);
  if (!conv) return null;

  const arr = ensureMessagesArray(conversationId);
  const already = arr.some((m) =>
    String(m?.text || '')
      .toLowerCase()
      .includes('te he enviado un waitme')
  );
  if (already) return null;

  const msg = pushMessage(conversationId, {
    mine: true,
    senderName: demoFlow.me.name,
    senderPhoto: demoFlow.me.photo,
    text: 'Ey! te he enviado un WaitMe!',
  });

  notify();
  return msg?.id || null;
}

export function addDemoAlert(alert) {
  if (!alert?.id) return;
  const list = demoFlow.alerts || [];
  if (list.some((a) => a.id === alert.id)) return;
  demoFlow.alerts = [{ ...alert }, ...list];
  notify();
}

export function addIncomingWaitMeConversation(alertId, buyer) {
  if (!alertId) return null;
  const conv = ensureConversationForAlert(alertId, {
    fromName: buyer?.name || 'Usuario',
    otherPhoto: buyer?.photo || null,
  });
  if (!conv?.id) return null;
  const arr = ensureMessagesArray(conv.id);
  const already = arr.some((m) =>
    String(m?.text || '')
      .toLowerCase()
      .includes('te he enviado un waitme')
  );
  if (!already) {
    pushMessage(conv.id, {
      mine: false,
      senderName: buyer?.name || 'Usuario',
      senderPhoto: buyer?.photo || null,
      text: '¡Ey! Te he enviado un WaitMe!',
    });
  }
  notify();
  return conv.id;
}

export function markDemoRead(notificationId) {
  const n = (demoFlow.notifications || []).find((x) => x.id === notificationId);
  if (n) n.read = true;
  notify();
}

export function markAllDemoRead() {
  (demoFlow.notifications || []).forEach((n) => (n.read = true));
  notify();
}
