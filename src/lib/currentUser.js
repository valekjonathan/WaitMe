import { base44 } from '@/api/base44Client';
import { getDemoState } from '@/components/DemoFlowManager';

const STORAGE_KEY = 'waitme_guest_profile_v1';

function safeJsonParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function getGuestProfile() {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  return raw ? (safeJsonParse(raw) || {}) : {};
}

function setGuestProfile(data) {
  if (typeof window === 'undefined') return;
  const prev = getGuestProfile();
  const next = { ...prev, ...(data || {}) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearGuestProfile() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function buildGuestUser() {
  const demo = getDemoState?.();
  const me = demo?.me || {};
  const stored = getGuestProfile();

  return {
    __guest: true,
    id: stored.id || 'guest',
    full_name: stored.full_name || me.name || 'Invitado',
    display_name: stored.display_name || me.name || '',
    photo_url: stored.photo_url || me.photo || '',
    phone: stored.phone || '',
    allow_phone_calls: stored.allow_phone_calls || false,
    notifications_enabled: stored.notifications_enabled !== false,
    email_notifications: stored.email_notifications !== false,

    car_brand: stored.car_brand || '',
    car_model: stored.car_model || '',
    car_color: stored.car_color || 'gris',
    vehicle_type: stored.vehicle_type || 'car',
    car_plate: stored.car_plate || ''
  };
}

export async function getCurrentUser() {
  try {
    const u = await base44.auth.me();
    return { ...u, __guest: false };
  } catch {
    return buildGuestUser();
  }
}

export async function updateCurrentUser(patch) {
  try {
    return await base44.auth.updateMe(patch);
  } catch {
    setGuestProfile(patch);
    return buildGuestUser();
  }
}
