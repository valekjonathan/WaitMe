/**
 * Estado demo: demoFlow, helpers, seed.
 * @module hooks/demo/useDemoFlowState
 */

import { genId, normalize } from '@/lib/demo/demoFlowUtils';

export const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },
  users: [],
  alerts: [],
  conversations: [],
  messages: {},
  notifications: [],
};

export function getConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

export function getAlert(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

export function ensureMessagesArray(conversationId) {
  if (!demoFlow.messages) demoFlow.messages = {};
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  return demoFlow.messages[conversationId];
}

export function pushMessage(
  conversationId,
  { mine, senderName, senderPhoto, text, attachments = null }
) {
  const arr = ensureMessagesArray(conversationId);

  const msg = {
    id: genId('msg'),
    mine: !!mine,
    senderName: senderName || (mine ? demoFlow.me.name : 'Usuario'),
    senderPhoto: senderPhoto || null,
    text: String(text || '').trim(),
    attachments,
    ts: Date.now(),
  };

  if (!msg.text) return null;

  arr.push(msg);

  const conv = getConversation(conversationId);
  if (conv) {
    conv.last_message_text = msg.text;
    conv.last_message_at = msg.ts;
    if (!msg.mine) conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }

  return msg;
}

export function addNotification({ type, title, text, conversationId, alertId, read = false }) {
  const noti = {
    id: genId('noti'),
    type: type || 'status_update',
    title: title || 'ACTUALIZACIÓN',
    text: text || 'Actualización.',
    conversationId: conversationId || null,
    alertId: alertId || null,
    createdAt: Date.now(),
    read: !!read,
  };

  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];
  return noti;
}

export function pickUser(userId) {
  return (demoFlow.users || []).find((u) => u.id === userId) || null;
}

function buildUsers() {
  demoFlow.users = [
    {
      id: 'u1',
      name: 'Sofía',
      photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      brand: 'Renault',
      model: 'Clio',
      color: 'rojo',
      plate: '7733 MNP',
      phone: '+34677889901',
    },
    {
      id: 'u2',
      name: 'Marco',
      photo: 'https://randomuser.me/api/portraits/men/12.jpg',
      brand: 'BMW',
      model: 'Serie 1',
      color: 'gris',
      plate: '8890 LTR',
      phone: '+34677889902',
    },
    {
      id: 'u3',
      name: 'Laura',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      brand: 'Mercedes',
      model: 'Clase A',
      color: 'negro',
      plate: '7788 RTY',
      phone: '+34677889903',
    },
    {
      id: 'u4',
      name: 'Carlos',
      photo: 'https://randomuser.me/api/portraits/men/55.jpg',
      brand: 'Seat',
      model: 'León',
      color: 'azul',
      plate: '4321 PQR',
      phone: '+34677889904',
    },
    {
      id: 'u5',
      name: 'Elena',
      photo: 'https://randomuser.me/api/portraits/women/25.jpg',
      brand: 'Mini',
      model: 'Cooper',
      color: 'blanco',
      plate: '5567 ZXC',
      phone: '+34677889905',
    },
    {
      id: 'u6',
      name: 'Dani',
      photo: 'https://randomuser.me/api/portraits/men/41.jpg',
      brand: 'Audi',
      model: 'A3',
      color: 'gris',
      plate: '2145 KHB',
      phone: '+34677889906',
    },
    {
      id: 'u7',
      name: 'Paula',
      photo: 'https://randomuser.me/api/portraits/women/12.jpg',
      brand: 'Toyota',
      model: 'Yaris',
      color: 'verde',
      plate: '9001 LKD',
      phone: '+34677889907',
    },
    {
      id: 'u8',
      name: 'Iván',
      photo: 'https://randomuser.me/api/portraits/men/18.jpg',
      brand: 'Volkswagen',
      model: 'Golf',
      color: 'azul',
      plate: '3022 MJC',
      phone: '+34677889908',
    },
    {
      id: 'u9',
      name: 'Nerea',
      photo: 'https://randomuser.me/api/portraits/women/37.jpg',
      brand: 'Kia',
      model: 'Rio',
      color: 'rojo',
      plate: '6100 HJP',
      phone: '+34677889909',
    },
    {
      id: 'u10',
      name: 'Hugo',
      photo: 'https://randomuser.me/api/portraits/men/77.jpg',
      brand: 'Peugeot',
      model: '208',
      color: 'amarillo',
      plate: '4509 LST',
      phone: '+34677889910',
    },
  ];
}

function seedAlerts() {
  demoFlow.alerts = [];
}

function seedConversationsAndMessages() {
  demoFlow.conversations = [];
  demoFlow.messages = {};

  const linked = demoFlow.alerts.filter((a) => normalize(a.status) !== 'active');

  linked.forEach((a) => {
    const other = pickUser(a.user_id);
    const convId = `conv_${a.id}_me`;

    a.reserved_by_id = 'me';
    a.reserved_by_name = demoFlow.me.name;
    a.reserved_by_photo = demoFlow.me.photo;

    const conv = {
      id: convId,
      participant1_id: 'me',
      participant2_id: other?.id,
      participant1_name: demoFlow.me.name,
      participant2_name: other?.name,
      participant1_photo: demoFlow.me.photo,
      participant2_photo: other?.photo,
      other_name: other?.name,
      other_photo: other?.photo,
      alert_id: a.id,
      last_message_text: '',
      last_message_at: Date.now() - 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0,
    };

    demoFlow.conversations.push(conv);
    ensureMessagesArray(convId);

    pushMessage(convId, {
      mine: true,
      senderName: demoFlow.me.name,
      senderPhoto: demoFlow.me.photo,
      text: 'Ey! te he enviado un WaitMe!',
    });
    pushMessage(convId, {
      mine: false,
      senderName: other?.name,
      senderPhoto: other?.photo,
      text: 'Perfecto, lo tengo. Te leo por aquí.',
    });

    const st = normalize(a.status);
    if (st === 'thinking')
      pushMessage(convId, {
        mine: false,
        senderName: other?.name,
        senderPhoto: other?.photo,
        text: 'Me lo estoy pensando… ahora te digo.',
      });
    if (st === 'extended')
      pushMessage(convId, {
        mine: true,
        senderName: demoFlow.me.name,
        senderPhoto: demoFlow.me.photo,
        text: 'He pagado la prórroga.',
      });
    if (st === 'cancelled')
      pushMessage(convId, {
        mine: true,
        senderName: demoFlow.me.name,
        senderPhoto: demoFlow.me.photo,
        text: 'Cancelo la operación.',
      });
    if (st === 'completed')
      pushMessage(convId, {
        mine: false,
        senderName: other?.name,
        senderPhoto: other?.photo,
        text: 'Operación completada ✅',
      });
  });

  demoFlow.conversations.sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
}

function seedNotifications() {
  demoFlow.notifications = [];

  const findBy = (st) => demoFlow.alerts.find((a) => normalize(a.status) === st);

  const aReserved = findBy('reserved');
  const aThinking = findBy('thinking');
  const aExtended = findBy('extended');
  const aCancelled = findBy('cancelled');
  const aCompleted = findBy('completed');

  const convReserved = aReserved ? `conv_${aReserved.id}_me` : null;
  const convThinking = aThinking ? `conv_${aThinking.id}_me` : null;
  const convExtended = aExtended ? `conv_${aExtended.id}_me` : null;
  const convCancelled = aCancelled ? `conv_${aCancelled.id}_me` : null;
  const convCompleted = aCompleted ? `conv_${aCompleted.id}_me` : null;

  if (aReserved)
    addNotification({
      type: 'incoming_waitme',
      title: 'ACTIVA',
      text: `${aReserved.user_name} te ha enviado un WaitMe.`,
      conversationId: convReserved,
      alertId: aReserved.id,
      read: false,
    });
  if (aThinking)
    addNotification({
      type: 'status_update',
      title: 'ME LO PIENSO',
      text: `${aThinking.user_name} se lo está pensando.`,
      conversationId: convThinking,
      alertId: aThinking.id,
      read: false,
    });
  if (aExtended)
    addNotification({
      type: 'prorroga_request',
      title: 'PRÓRROGA SOLICITADA',
      text: `${aExtended.user_name} pide una prórroga (+1€).`,
      conversationId: convExtended,
      alertId: aExtended.id,
      read: false,
    });
  if (aCompleted)
    addNotification({
      type: 'payment_completed',
      title: 'PAGO COMPLETADO',
      text: `Pago confirmado (${aCompleted.price}€).`,
      conversationId: convCompleted,
      alertId: aCompleted.id,
      read: true,
    });
  if (aCancelled)
    addNotification({
      type: 'cancellation',
      title: 'CANCELACIÓN',
      text: `Operación cancelada.`,
      conversationId: convCancelled,
      alertId: aCancelled.id,
      read: true,
    });
  if (aReserved)
    addNotification({
      type: 'buyer_nearby',
      title: 'COMPRADOR CERCA',
      text: `El comprador está llegando.`,
      conversationId: convReserved,
      alertId: aReserved.id,
      read: false,
    });
  if (aReserved)
    addNotification({
      type: 'reservation_accepted',
      title: 'RESERVA ACEPTADA',
      text: `Reserva aceptada.`,
      conversationId: convReserved,
      alertId: aReserved.id,
      read: true,
    });
  if (aReserved)
    addNotification({
      type: 'reservation_rejected',
      title: 'RESERVA RECHAZADA',
      text: `Reserva rechazada.`,
      conversationId: convReserved,
      alertId: aReserved.id,
      read: true,
    });
  if (aReserved)
    addNotification({
      type: 'time_expired',
      title: 'TIEMPO AGOTADO',
      text: `Se agotó el tiempo.`,
      conversationId: convReserved,
      alertId: aReserved.id,
      read: true,
    });
}

export function resetDemo() {
  buildUsers();
  seedAlerts();
  seedConversationsAndMessages();
  seedNotifications();
}
