import { base44 } from '@/api/base44Client';
import { getDemoState } from '@/components/DemoFlowManager';

const STORAGE_KEY = 'waitme_guest_profile_v1';
const FORCE_GUEST_KEY = 'waitme_force_guest_always_v1';

// Valores por defecto SOLO para que Preview e iPhone arranquen iguales.
// Se sobreescriben en cuanto el usuario edite el perfil.
const DEFAULT_GUEST_PROFILE = {
  display_name: 'Jonathan',
  car_brand: 'Porsche',
  car_model: 'Macan',
  car_color: 'negro',
  vehicle_type: 'car',
  car_plate: '2026VSR',
  allow_phone_calls: true,
  notifications_enabled: true,
  email_notifications: true
};

function safeJsonParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function getGuestProfile() {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  return raw ? (safeJsonParse(raw) || {}) : {};
}

function ensureGuestProfileInitialized() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GUEST_PROFILE));
  } catch {
    // ignore
  }
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
  ensureGuestProfileInitialized();
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

export function getGuestUserSync() {
  return buildGuestUser();
}

function shouldForceGuest() {
  if (typeof window === 'undefined') return true;
  try {
    const url = new URL(window.location.href);
    // Si quieres usar auth puntualmente: añade ?use_auth=true
    if (url.searchParams.get('use_auth') === 'true') {
      window.localStorage.setItem(FORCE_GUEST_KEY, 'false');
      return false;
    }
    const v = window.localStorage.getItem(FORCE_GUEST_KEY);
    if (v === null) {
      // Por defecto FORZAMOS guest para que Preview == iPhone siempre
      window.localStorage.setItem(FORCE_GUEST_KEY, 'true');
      return true;
    }
    return v === 'true';
  } catch {
    return true;
  }
}

export async function getCurrentUser() {
  if (shouldForceGuest()) {
    return buildGuestUser();
  }
  try {
    const u = await base44.auth.me();
    return { ...u, __guest: false };
  } catch {
    return buildGuestUser();
  }
}

export async function updateCurrentUser(patch) {
  if (shouldForceGuest()) {
    setGuestProfile(patch);
    return buildGuestUser();
  }
  try {
    return await base44.auth.updateMe(patch);
  } catch {
    setGuestProfile(patch);
    return buildGuestUser();
  }
}
