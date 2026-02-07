// src/lib/demoFlow.js
// Motor de estado DEMO (solo frontend). NO toca Base44. Todo se guarda en memoria + localStorage.

const STORAGE_KEY = "waitme_demo_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function defaultState() {
  const baseNow = Date.now();

  const users = {
    marco: {
      id: "marco",
      name: "Marco",
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    marta: {
      id: "marta",
      name: "Marta",
      photo: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    sofia: {
      id: "sofia",
      name: "Sofía",
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    dani: {
      id: "dani",
      name: "Dani",
      photo: "https://randomuser.me/api/portraits/men/41.jpg",
    },
  };

  // Conversaciones DEMO: ids coinciden con los mocks de Chats.jsx (mock_*).
  const conversations = [
    {
      id: "mock_reservaste_1",
      kind: "reservaste", // tú reservaste a X
      otherUserId: "marco",
      status: "activa", // activa | finalizada
      lastMessage: "Voy llegando, 3 min.",
      unread: 2,
      // tiempos demo (ms)
      createdAt: baseNow - 8 * 60 * 1000,
      departInMin: 10,
    },
    {
      id: "mock_te_reservo_1",
      kind: "te_reservo", // te reservó X
      otherUserId: "sofia",
      status: "activa",
      lastMessage: "Ok, te espero. Avísame.",
      unread: 0,
      createdAt: baseNow - 15 * 60 * 1000,
      departInMin: 10,
    },
    {
      id: "mock_finalizada_1",
      kind: "reservaste",
      otherUserId: "marta",
      status: "finalizada",
      finalState: "COMPLETADA",
      lastMessage: "Pago completado ✅",
      unread: 0,
      createdAt: baseNow - 60 * 60 * 1000,
      departInMin: 0,
    },
    {
      id: "mock_pensando_1",
      kind: "te_reservo",
      otherUserId: "dani",
      status: "finalizada",
      finalState: "ME LO PIENSO",
      lastMessage: "Me lo pienso…",
      unread: 0,
      createdAt: baseNow - 25 * 60 * 1000,
      departInMin: 0,
    },
  ];

  const messagesByConv = {};
  for (const c of conversations) {
    const other = users[c.otherUserId];
    const you = { id: "you", name: "Tú", photo: null };
    const t0 = c.createdAt;

    const sys = (text, offsetMs) => ({
      id: makeId("sys"),
      type: "system",
      sender_id: "system",
      sender_name: "WaitMe!",
      sender_photo: null,
      message: text,
      created_date: new Date(t0 + offsetMs).toISOString(),
      read: true,
    });

    const msg = (from, text, offsetMs) => ({
      id: makeId("msg"),
      type: "message",
      sender_id: from.id,
      sender_name: from.name,
      sender_photo: from.photo,
      message: text,
      created_date: new Date(t0 + offsetMs).toISOString(),
      read: from.id === "you",
    });

    messagesByConv[c.id] = [
      sys("Operación creada.", 0),
      msg(other, "Ey! Te he enviado un WaitMe!", 10_000),
      msg(you, "Perfecto, voy ahora.", 25_000),
      msg(other, c.kind === "reservaste" ? "Te espero, avísame cuando estés cerca." : "Ok, en cuanto llegues te doy la matrícula.", 45_000),
    ];

    if (c.status === "finalizada") {
      messagesByConv[c.id].push(sys(`Estado: ${c.finalState}`, 90_000));
    }
  }

  return {
    version: 1,
    demoEnabled: false,
    users,
    conversations,
    messagesByConv,
    // Notificaciones accionables (pantalla Notificaciones)
    actionableNotifications: [],
    // Cola de push informativas (toasts)
    pushQueue: [],
    // Control del motor
    step: 0,
    lastTickAt: 0,
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const st = raw ? safeParse(raw, null) : null;
  if (!st || !st.version) return defaultState();
  return st;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = null;
const listeners = new Set();

function ensure() {
  if (state) return;
  state = loadState();
}

function notify() {
  for (const fn of listeners) fn(state);
}

function update(mutator) {
  ensure();
  mutator(state);
  saveState(state);
  notify();
}

function subscribe(fn) {
  ensure();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getState() {
  ensure();
  return state;
}

function setDemoEnabled(enabled) {
  update((s) => { s.demoEnabled = !!enabled; });
}

function enqueuePush(push) {
  update((s) => {
    s.pushQueue.push({ id: makeId("push"), createdAt: Date.now(), ...push });
  });
}

function shiftPush() {
  ensure();
  const item = state.pushQueue.shift();
  saveState(state);
  return item;
}

function addActionableNotification(n) {
  update((s) => {
    s.actionableNotifications.unshift({ id: makeId("notif"), createdAt: Date.now(), ...n });
  });
}

function resolveActionable(id) {
  update((s) => {
    s.actionableNotifications = s.actionableNotifications.filter(x => x.id !== id);
  });
}

function appendMessage(conversationId, messageObj) {
  update((s) => {
    if (!s.messagesByConv[conversationId]) s.messagesByConv[conversationId] = [];
    s.messagesByConv[conversationId].push(messageObj);
    // actualiza preview en lista
    const conv = s.conversations.find(c => c.id === conversationId);
    if (conv && messageObj?.message) conv.lastMessage = messageObj.message;
  });
}

function markConversationRead(conversationId) {
  update((s) => {
    const conv = s.conversations.find(c => c.id === conversationId);
    if (conv) conv.unread = 0;
  });
}

function bumpUnread(conversationId, n = 1) {
  update((s) => {
    const conv = s.conversations.find(c => c.id === conversationId);
    if (conv) conv.unread = Math.min(99, (conv.unread || 0) + n);
  });
}


function setStep(nextStep) {
  update((s) => { s.step = nextStep; s.lastTickAt = Date.now(); });
}
function setConversationFinal(conversationId, finalState) {
  update((s) => {
    const conv = s.conversations.find(c => c.id === conversationId);
    if (!conv) return;
    conv.status = "finalizada";
    conv.finalState = finalState;
  });
}

export const demoFlow = {
  subscribe,
  getState,
  setDemoEnabled,
  enqueuePush,
  shiftPush,
  addActionableNotification,
  resolveActionable,
  appendMessage,
  markConversationRead,
  bumpUnread,
  setConversationFinal,
  setStep,
};
