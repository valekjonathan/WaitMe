import { useEffect } from 'react';

/* ======================================================
   DEMO CENTRAL ÚNICO (VACÍO + COMPAT)
   - Mantiene exports esperados por Home/History/Chats/Chat/Notifications
   - Estado por defecto: SIN alertas, SIN conversaciones, SIN notificaciones
   - Evita errores de imports (p.ej. sendDemoMessage)
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

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

const STORAGE_KEY = 'waitme_demo_flow_v2_empty';
const MODE_KEY = 'waitme_demo_mode';

const DEFAULT_FLOW = {
  users: [
    {
      id: 'u_me',
      name: 'Tú',
      photo: null,
      car_brand: '',
      car_model: '',
      car_color: 'gris',
      car_plate: '',
      phone: ''
    }
  ],
  alerts: [],
  conversations: [],
  messages: {},
  notifications: [],
  lastTick: Date.now(),
  seedCreatedAt: Date.now()
};

function loadFlow() {
  if (typeof window === 'undefined') return { ...DEFAULT_FLOW };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FLOW };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FLOW,
      ...parsed,
      alerts: Array.isArray(parsed?.alerts) ? parsed.alerts : [],
      conversations: Array.isArray(parsed?.conversations) ? parsed.conversations : [],
      notifications: Array.isArray(parsed?.notifications) ? parsed.notifications : [],
      messages: parsed?.messages && typeof parsed.messages === 'object' ? parsed.messages : {}
    };
  } catch {
    return { ...DEFAULT_FLOW };
  }
}

function saveFlow(flow) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
  } catch {}
}

let demoFlow = loadFlow();

export function isDemoMode() {
  if (typeof window === 'undefined') return false;
  // Por defecto ON: así la app queda vacía sin depender de BD.
  const v = localStorage.getItem(MODE_KEY);
  if (v == null) return true;
  return v !== '0' && v !== 'false';
}

export function setDemoMode(on) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODE_KEY, on ? 'true' : 'false');
}

function resetDemo() {
  demoFlow = {
    ...DEFAULT_FLOW,
    seedCreatedAt: Date.now(),
    lastTick: Date.now()
  };
  saveFlow(demoFlow);
}

function tickDemo() {
  const now = Date.now();
  demoFlow.lastTick = now;
  saveFlow(demoFlow);
  notify();
}

export function startDemoFlow() {
  if (!isDemoMode()) return;
  if (started) return;
  started = true;

  if (!demoFlow || !demoFlow.seedCreatedAt) resetDemo();

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(tickDemo, 1000);
}

export function stopDemoFlow() {
  started = false;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

export function subscribeDemoFlow(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Hook opcional
export function useDemoFlowTick() {
  useEffect(() => {
    if (!isDemoMode()) return;
    startDemoFlow();
    return () => {};
  }, []);
}

// ====== Read API (vacío) ======
export function getDemoAlerts() {
  if (!isDemoMode()) return [];
  return Array.isArray(demoFlow.alerts) ? demoFlow.alerts : [];
}

export function getDemoAlertById(alertId) {
  if (!isDemoMode()) return null;
  const list = getDemoAlerts();
  return list.find((a) => String(a?.id) === String(alertId)) || null;
}

export function getDemoConversations() {
  if (!isDemoMode()) return [];
  return Array.isArray(demoFlow.conversations) ? demoFlow.conversations : [];
}

export function getDemoMessages(conversationId) {
  if (!isDemoMode()) return [];
  const map = demoFlow.messages || {};
  const list = map[String(conversationId)] || [];
  return Array.isArray(list) ? list : [];
}

export function getDemoNotifications() {
  if (!isDemoMode()) return [];
  return Array.isArray(demoFlow.notifications) ? demoFlow.notifications : [];
}

// ====== Write API (compat) ======
// Usado en Chat.jsx: sendDemoMessage(conversationId, text, attachments, mine?)
export function sendDemoMessage(conversationId, text, attachments = null, mine = true) {
  if (!isDemoMode()) return null;
  if (!conversationId) return null;

  const msg = {
    id: genId('m'),
    created_date: new Date().toISOString(),
    mine: Boolean(mine),
    sender_name: Boolean(mine) ? (demoFlow.users?.[0]?.name || 'Tú') : 'Sistema',
    text: String(text || ''),
    attachments: attachments || null
  };

  if (!demoFlow.messages) demoFlow.messages = {};
  const key = String(conversationId);
  const prev = Array.isArray(demoFlow.messages[key]) ? demoFlow.messages[key] : [];
  demoFlow.messages[key] = [...prev, msg];

  // Actualiza conversación si existe
  if (Array.isArray(demoFlow.conversations)) {
    demoFlow.conversations = demoFlow.conversations.map((c) => {
      if (!c || String(c.id) !== key) return c;
      return {
        ...c,
        last_message: msg.text,
        updated_date: msg.created_date
      };
    });
  }

  saveFlow(demoFlow);
  notify();
  return msg;
}

export function markDemoNotificationRead(notificationId) {
  if (!isDemoMode()) return;
  demoFlow.notifications = (demoFlow.notifications || []).map((n) =>
    String(n?.id) === String(notificationId) ? { ...n, read: true } : n
  );
  saveFlow(demoFlow);
  notify();
}

// Crea conversación si no existe (se usa en flows legacy)
export function ensureConversationForAlert(alertId, otherUserId, meta = {}) {
  if (!isDemoMode()) return null;
  const id = `c_${String(alertId || 'noalert')}_${String(otherUserId || 'nouser')}`;

  const existing = (demoFlow.conversations || []).find((c) => String(c?.id) === id);
  if (existing) return existing;

  const conv = {
    id,
    alert_id: alertId || null,
    other_user_id: otherUserId || null,
    last_message: '',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...meta
  };

  demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];
  saveFlow(demoFlow);
  notify();
  return conv;
}

// No-op: en demo vacío no metemos mensajes automáticos
export function ensureInitialWaitMeMessage() {
  return null;
}

// No-op: acciones demo (accept/decline/etc.)
export function applyDemoAction() {
  return null;
}

// Utilidad por si quieres “resetear” a vacío
export function resetDemoEmpty() {
  resetDemo();
  notify();
}
