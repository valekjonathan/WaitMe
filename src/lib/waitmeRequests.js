// ================================
// FILE: src/lib/waitmeRequests.js
// ================================

const STORAGE_KEY = 'waitme_requests_v1';

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export function getWaitMeRequests() {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const arr = safeJsonParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveWaitMeRequests(list) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  } catch {}
}

export function upsertWaitMeRequest(req) {
  const list = getWaitMeRequests();
  const id = req?.id;
  if (!id) return;
  const next = list.slice();
  const idx = next.findIndex((r) => r?.id === id);
  if (idx >= 0) next[idx] = { ...next[idx], ...req };
  else next.unshift(req);
  saveWaitMeRequests(next);
  try { window.dispatchEvent(new Event('waitme:requestsChanged')); } catch {}
}

export function setWaitMeRequestStatus(id, status, extra = {}) {
  if (!id) return;
  const list = getWaitMeRequests();
  const next = list.map((r) => {
    if (r?.id !== id) return r;
    return { ...r, status, ...extra, updatedAt: Date.now() };
  });
  saveWaitMeRequests(next);
  try { window.dispatchEvent(new Event('waitme:requestsChanged')); } catch {}
}

export function clearWaitMeRequests() {
  saveWaitMeRequests([]);
  try { window.dispatchEvent(new Event('waitme:requestsChanged')); } catch {}
}
