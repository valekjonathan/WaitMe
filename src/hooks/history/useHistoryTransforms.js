import { useRef } from 'react';
import { toMs } from '@/lib/alertSelectors';

const fixedAvatars = {
  Sofía:
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
  Hugo: 'https://randomuser.me/api/portraits/men/32.jpg',
  Nuria: 'https://randomuser.me/api/portraits/women/44.jpg',
  Iván: 'https://randomuser.me/api/portraits/men/75.jpg',
  Marco: 'https://randomuser.me/api/portraits/men/12.jpg',
};

export function formatCardDate(ts) {
  if (!ts) return '--';
  const date = new Date(ts);
  const madridDateStr = date.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formatted = madridDateStr
    .replace(' de ', ' ')
    .replace(',', ' -')
    .replace(/(\d+)\s+([a-záéíóúñ]+)/i, (m, day, month) => {
      const cap = month.charAt(0).toUpperCase() + month.slice(1);
      return `${day} ${cap}`;
    });

  return formatted;
}

export function statusLabelFrom(s, alert) {
  const st = String(s || '').toLowerCase();
  if (st === 'completed') return 'COMPLETADA';
  if (st === 'cancelled') {
    if (alert?.cancel_reason === 'me_fui') return 'ME FUI';
    return 'CANCELADA';
  }
  if (st === 'expired') return 'EXPIRADA';
  if (st === 'reserved') return 'EN CURSO';
  return 'COMPLETADA';
}

export function reservationMoneyModeFromStatus(status) {
  const st = String(status || '').toLowerCase();
  if (st === 'completed') return 'paid';
  if (st === 'expired' || st === 'cancelled') return 'neutral';
  return 'neutral';
}

export function avatarFor(name) {
  return fixedAvatars[String(name || '').trim()] || null;
}

/**
 * Hook that returns getCreatedTs and getWaitUntilTs.
 * getCreatedTs uses useRef internally for createdFallbackRef.
 */
export function useHistoryTransforms() {
  const createdFallbackRef = useRef(new Map());

  const getCreatedTs = (alert) => {
    if (!alert?.id) return Date.now();

    const key = `alert-created-${alert.id}`;

    const cached = createdFallbackRef.current.get(key);
    if (typeof cached === 'number' && cached > 0) return cached;

    const stored = localStorage.getItem(key);
    if (stored) {
      const t = Number(stored);
      if (Number.isFinite(t) && t > 0) {
        createdFallbackRef.current.set(key, t);
        return t;
      }
    }

    const candidates = [
      alert?.created_date,
      alert?.created_at,
      alert?.createdAt,
      alert?.created,
      alert?.updated_date,
    ];

    for (const v of candidates) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) {
        localStorage.setItem(key, String(t));
        createdFallbackRef.current.set(key, t);
        return t;
      }
    }

    const now = Date.now();
    localStorage.setItem(key, String(now));
    createdFallbackRef.current.set(key, now);
    return now;
  };

  const getWaitUntilTs = (alert) => {
    const created = getCreatedTs(alert);
    const mins = Number(alert?.available_in_minutes);

    if (typeof created === 'number' && created > 0 && Number.isFinite(mins) && mins > 0) {
      return created + mins * 60 * 1000;
    }

    return null;
  };

  return {
    formatCardDate,
    statusLabelFrom,
    reservationMoneyModeFromStatus,
    avatarFor,
    getCreatedTs,
    getWaitUntilTs,
  };
}
