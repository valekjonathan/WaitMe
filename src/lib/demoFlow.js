// src/lib/demoFlow.js
// Motor de simulación (solo front) para darle "vida" a Chats/Chat/Notifications sin depender de Base44.
// Estado en memoria + suscriptores. No añade dependencias.

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const now = () => Date.now();

const listeners = new Set();
let started = false;
let tickTimer = null;
const replyTimers = new Map();

function mkMsg({ id, ts, senderId, senderName, senderPhoto, mine, text, kind = 'text' }) {
  return { id, ts, senderId, senderName, senderPhoto, mine, text, kind };
}
function msgMe(ts, text) {
  return mkMsg({
    id: `m_${ts}_${Math.random().toString(16).slice(2)}`,
    ts,
    senderId: 'me_demo',
    senderName: 'Tu',
    senderPhoto: null,
    mine: true,
    text
  });
}
function msgOther(user, ts, text) {
  return mkMsg({
    id: `m_${ts}_${Math.random().toString(16).slice(2)}`,
    ts,
    senderId: user.id,
    senderName: user.name,
    senderPhoto: user.photo,
    mine: false,
    text
  });
}
function msgSys(ts, senderName, text) {
  return mkMsg({
    id: `m_${ts}_${Math.random().toString(16).slice(2)}`,
    ts,
    senderId: 'system',
    senderName,
    senderPhoto: null,
    mine: false,
    text,
    kind: 'system'
  });
}

function initial() {
  const t0 = now();

  const users = {
    me: { id: 'me_demo', name: 'Tu', photo: null },
    sofia: { id: 'seller_sofia', name: 'Sofía', photo: 'https://randomuser.me/api/portraits/women/68.jpg' },
    marco: { id: 'buyer_marco', name: 'Marco', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
    dani: { id: 'buyer_dani', name: 'Dani', photo: 'https://randomuser.me/api/portraits/men/75.jpg' },
    pablo: { id: 'seller_pablo', name: 'Pablo', photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
  };

  // IDs alineados con los mocks que ya existen en Chats.jsx (alert_* y mock_*).
  const conversations = [
    // 1) Tú reservaste (activa con cuenta atrás)
    {
      id: 'mock_reservaste_1',
      reservation_type: 'buyer',
      otherUserId: users.sofia.id,
      alert_id: 'alert_reservaste_1',
      alert_meta: {
        // “Se va en 10 min · Te espera hasta …”
        leaveInMin: 10,
        waitUntilMs: t0 + 10 * 60000,
        countdownToMs: t0 + 10 * 60000,
        status: 'active'
      },
      last_message_text: 'Perfecto, voy llegando',
      last_message_at: t0 - 60 * 1000,
      unread: 2,
      messages: [
        msgSys(t0 - 3 * 60000, 'Sistema', 'Has reservado un WaitMe! (3€ retenidos).'),
        msgOther(users.sofia, t0 - 2 * 60000, 'Ey! Te he enviado un WaitMe!'),
        msgMe(t0 - 90 * 1000, 'Perfecto, voy llegando'),
        msgOther(users.sofia, t0 - 60 * 1000, 'Vale! Te espero 😊'),
      ],
    },

    // 2) Te reservaron (activa y caduca pronto para disparar prórroga)
    {
      id: 'mock_te_reservo_1',
      reservation_type: 'seller',
      otherUserId: users.marco.id,
      alert_id: 'alert_te_reservo_1',
      alert_meta: {
        // “Te vas en 10 min · Debes esperar hasta …”
        leaveInMin: 10,
        waitUntilMs: t0 + 15000,
        countdownToMs: t0 + 15000,
        status: 'active'
      },
      last_message_text: '¿Sigues ahí?',
      last_message_at: t0 - 25 * 1000,
      unread: 3,
      messages: [
        msgSys(t0 - 2 * 60000, 'Sistema', 'Marco quiere un WaitMe!'),
        // Mensaje rompe-hielo coherente cuando te reservan
        msgOther(users.marco, t0 - 90 * 1000, 'Ey! Te he enviado un WaitMe!'),
        msgOther(users.marco, t0 - 70 * 1000, 'Ey gracias por aceptar mi WaitMe! Llegaré lo antes posible.'),
        msgOther(users.marco, t0 - 25 * 1000, '¿Sigues ahí?'),
      ],
    },

    // 3) Me lo pienso (sin mensajes -> IR apagado)
    {
      id: 'mock_pensar_1',
      reservation_type: 'seller',
      otherUserId: users.dani.id,
      alert_id: 'alert_pensar_1',
      alert_meta: {
        leaveInMin: 15,
        waitUntilMs: t0 + 8 * 60000,
        countdownToMs: t0 + 8 * 60000,
        status: 'thinking'
      },
      last_message_text: '',
      last_message_at: t0 - 7 * 60000,
      unread: 0,
      messages: [
        msgSys(t0 - 7 * 60000, 'Sistema', 'Dani quiere un WaitMe! (Me lo pienso).'),
      ],
    },

    // 4) Completada (estado dentro del botón de contador)
    {
      id: 'mock_completada_1',
      reservation_type: 'buyer',
      otherUserId: users.marco.id,
      alert_id: 'alert_completada_1',
      alert_meta: {
        leaveInMin: 10,
        waitUntilMs: t0 - 30 * 60000,
        countdownToMs: t0 - 30 * 60000,
        status: 'completed'
      },
      last_message_text: 'Pago completado ✅',
      last_message_at: t0 - 35 * 60000,
      unread: 0,
      messages: [
        msgSys(t0 - 46 * 60000, 'Sistema', 'Has reservado un WaitMe!.'),
        msgOther(users.marco, t0 - 44 * 60000, 'Te espero, estoy listo.'),
        msgSys(t0 - 35 * 60000, 'Sistema', 'Pago completado. Has ganado 2€.'),
      ],
    },

    // 5) Rechazada (finalizada, sin mensajes)
    {
      id: 'mock_rechazada_1',
      reservation_type: 'seller',
      otherUserId: users.pablo.id,
      alert_id: 'alert_rechazada_1',
      alert_meta: {
        leaveInMin: 10,
        waitUntilMs: t0 - 10 * 60000,
        countdownToMs: t0 - 10 * 60000,
        status: 'rejected'
      },
      last_message_text: '',
      last_message_at: t0 - 20 * 60000,
      unread: 0,
      messages: [
        msgSys(t0 - 20 * 60000, 'Sistema', 'Has rechazado el WaitMe!.'),
      ],
    },

    // 6) Prórroga (finalizada con estado PRÓRROGA)
    {
      id: 'mock_prorroga_1',
      reservation_type: 'seller',
      otherUserId: users.dani.id,
      alert_id: 'alert_prorroga_1',
      alert_meta: {
        leaveInMin: 10,
        waitUntilMs: t0 - 1 * 60000,
        countdownToMs: t0 - 1 * 60000,
        status: 'extended'
      },
      last_message_text: 'Propuse prórroga: +10 min por 3€',
      last_message_at: t0 - 2 * 60000,
      unread: 1,
      messages: [
        msgSys(t0 - 6 * 60000, 'Sistema', 'UsuarioA no se ha presentado. Puedes “Me voy” o “Prórroga”.'),
        msgMe(t0 - 2 * 60000, 'Propuse prórroga: +10 min por 3€'),
        msgOther(users.dani, t0 - 60 * 1000, 'Lo veo, te confirmo ahora.'),
      ],
    },
  ];

  const notifications = [
    {
      id: 'n_init_1',
      ts: t0 - 2 * 60000,
      type: 'request',
      title: 'Marco quiere un WaitMe!',
      conversationId: 'mock_te_reservo_1',
      body: 'Puedes aceptar, rechazar o me lo pienso.'
    },
  ];

  const script = [
    { at: t0 + 6000, fn: (st) => toastAndNotify(st, 'Usuario quiere un WaitMe!', 'Nueva solicitud en Notificaciones.') },
    { at: t0 + 12000, fn: (st) => addOtherMsg(st, 'mock_te_reservo_1', users.marco, 'Estoy a 3 min.') },
    { at: t0 + 16000, fn: (st) => offerProrroga(st, 'mock_te_reservo_1') },
    { at: t0 + 24000, fn: (st) => addSystemMsg(st, 'mock_te_reservo_1', 'Sistema', 'UsuarioA no se ha presentado. Puedes: “Me voy” o “Prórroga”.') },
    { at: t0 + 30000, fn: (st) => addOtherMsg(st, 'mock_reservaste_1', users.sofia, '¿Te queda mucho?') },
    { at: t0 + 36000, fn: (st) => completePayment(st, 'mock_reservaste_1') },
  ];

  return { t0, users, conversations, notifications, script, scriptIdx: 0 };
}

let state = initial();

function emit() {
  for (const cb of listeners) cb();
}
function setState(next) {
  state = next;
  emit();
}

function dispatchToast(title, description) {
  window.dispatchEvent(new CustomEvent('waitme:demoToast', { detail: { title, description } }));
}

function toastAndNotify(st, title, description) {
  dispatchToast(title, description);
  const next = { ...st };
  next.notifications = [
    { id: `n_${now()}_${Math.random().toString(16).slice(2)}`, ts: now(), type: 'info', title, body: description, conversationId: null },
    ...next.notifications,
  ];
  return next;
}

function addSystemMsg(st, conversationId, senderName, text) {
  const ts = now();
  const next = { ...st };
  next.conversations = next.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const msgs = [...(c.messages || []), msgSys(ts, senderName, text)];
    return { ...c, messages: msgs, last_message_text: text, last_message_at: ts };
  });
  return next;
}

function addOtherMsg(st, conversationId, user, text) {
  const ts = now();
  const next = { ...st };
  next.conversations = next.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const msgs = [...(c.messages || []), msgOther(user, ts, text)];
    return { ...c, messages: msgs, last_message_text: text, last_message_at: ts, unread: Math.min(99, (c.unread || 0) + 1) };
  });
  dispatchToast('Mensaje nuevo', `${user.name}: ${text}`);
  return next;
}

function offerProrroga(st, conversationId) {
  const next = { ...st };
  next.conversations = next.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return { ...c, alert_meta: { ...c.alert_meta, status: 'extended_offer' } };
  });
  next.notifications = [
    { id: `n_${now()}_${Math.random().toString(16).slice(2)}`, ts: now(), type: 'prorroga', title: 'Prórroga', body: 'Se ha activado una prórroga.', conversationId },
    ...next.notifications,
  ];
  dispatchToast('Prórroga', 'Se ha activado la prórroga en una operación.');
  return next;
}

function completePayment(st, conversationId) {
  const ts = now();
  const next = { ...st };
  next.conversations = next.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const sys = msgSys(ts, 'Sistema', 'Pago completado. Has ganado 2€.');
    return { ...c, alert_meta: { ...c.alert_meta, status: 'completed' }, messages: [...(c.messages || []), sys], last_message_text: sys.text, last_message_at: ts, unread: 0 };
  });
  dispatchToast('Pago completado', 'Has ganado 2€.');
  return next;
}

export function startDemoFlow() {
  if (started) return;
  started = true;

  const runTick = () => {
    const t = now();
    let next = state;

    while (next.scriptIdx < next.script.length && t >= next.script[next.scriptIdx].at) {
      const fn = next.script[next.scriptIdx].fn;
      try {
        next = fn(next) || next;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('demoFlow step error', e);
      }
      next.scriptIdx += 1;
    }

    if (next !== state) setState(next);
    tickTimer = window.setTimeout(runTick, rand(5000, 10000));
  };

  tickTimer = window.setTimeout(runTick, rand(2500, 4500));
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDemoConversation(conversationId) {
  const c = state.conversations.find((x) => x.id === conversationId) || null;
  if (!c) return null;
  const other = Object.values(state.users).find((u) => u.id === c.otherUserId);
  return {
    ...c,
    other_name: other?.name || 'Usuario',
    other_photo: other?.photo || null
  };
}

export function getDemoMessages(conversationId) {
  return getDemoConversation(conversationId)?.messages || [];
}

export function markDemoRead(conversationId) {
  const next = { ...state };
  next.conversations = next.conversations.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c));
  setState(next);
}

export function sendDemoMessage(conversationId, text) {
  const ts = now();
  const conv = getDemoConversation(conversationId);
  if (!conv) return;

  const next = { ...state };
  next.conversations = next.conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const msgs = [...(c.messages || []), msgMe(ts, text)];
    return { ...c, messages: msgs, last_message_text: text, last_message_at: ts };
  });
  setState(next);

  const other = Object.values(state.users).find((u) => u.id === conv.otherUserId);
  if (!other) return;

  if (replyTimers.get(conversationId)) window.clearTimeout(replyTimers.get(conversationId));
  const timer = window.setTimeout(() => {
    const replies = [
      'Ok, entendido.',
      'Perfecto.',
      'Voy en camino.',
      'Dime por dónde vienes y te guío.',
      'Estoy atento/a, avísame cuando estés cerca.',
    ];
    const reply = replies[rand(0, replies.length - 1)];
    setState(addOtherMsg(state, conversationId, other, reply));
    replyTimers.delete(conversationId);
  }, rand(1500, 3500));
  replyTimers.set(conversationId, timer);
}

// Estructura similar a Base44 Conversation + extras (demo_alert)
export function getDemoConversationsForChats(meId, mePhoto) {
  const me = meId || 'me_demo';
  return state.conversations.map((c) => {
    const other = Object.values(state.users).find((u) => u.id === c.otherUserId);
    return {
      id: c.id,
      participant1_id: me,
      participant1_name: 'Tu',
      participant1_photo: mePhoto || null,
      participant2_id: other?.id || 'other',
      participant2_name: other?.name || 'Usuario',
      participant2_photo: other?.photo || null,
      alert_id: c.alert_id,
      last_message_text: c.last_message_text || '',
      last_message_at: new Date(c.last_message_at || state.t0).toISOString(),
      unread_count_p1: c.unread || 0,
      unread_count_p2: 0,
      reservation_type: c.reservation_type,
      demo_alert: c.alert_meta ? {
        leave_in_min: c.alert_meta.leaveInMin,
        wait_until: c.alert_meta.waitUntilMs,
        target_time: c.alert_meta.countdownToMs,
        status: c.alert_meta.status
      } : null,
    };
  });
}

export function getDemoNotifications() {
  return state.notifications;
}

// Compatibilidad: algunas pantallas importan { demoFlow } como objeto.
// Exponemos una API mínima coherente con la anterior.
export const demoFlow = {
  // Mantiene la forma antigua: { actionableNotifications: [...] }
  getState: () => ({ actionableNotifications: getDemoNotifications() }),
  subscribe: (fn) => subscribeDemoFlow(() => fn({ actionableNotifications: getDemoNotifications() })),
  start: () => startDemoFlow(),
  // Alias útiles
  startDemoFlow,
  subscribeDemoFlow,
  getDemoConversationsForChats,
  getDemoConversation,
  getDemoMessages,
  markDemoRead,
  sendDemoMessage,
  getDemoNotifications,
};
