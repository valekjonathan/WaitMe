/**
 * Datos y transformaciones para la pantalla Chats.
 * @module hooks/chats/useChatsData
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as chat from '@/data/chat';
import * as alerts from '@/data/alerts';
import { useAuth } from '@/lib/AuthContext';

const pad2 = (n) => String(n).padStart(2, '0');

export const formatMMSS = (ms) => {
  const safe = Math.max(0, ms ?? 0);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
};

export const getChatStatusLabel = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'completed':
    case 'completada':
      return 'COMPLETADA';
    case 'thinking':
    case 'me_lo_pienso':
    case 'pending':
      return 'ME LO PIENSO';
    case 'rejected':
    case 'rechazada':
      return 'RECHAZADA';
    case 'extended':
    case 'prorroga':
    case 'prórroga':
      return 'PRÓRROGA';
    case 'cancelled':
    case 'canceled':
    case 'cancelada':
      return 'CANCELADA';
    case 'expired':
    case 'agotada':
    case 'expirada':
      return 'AGOTADA';
    case 'went_early':
    case 'se_fue':
      return 'SE FUE';
    default:
      return null;
  }
};

export const isFinalChatStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return [
    'completed',
    'completada',
    'cancelled',
    'canceled',
    'cancelada',
    'expired',
    'agotada',
    'expirada',
    'went_early',
    'se_fue',
  ].includes(s);
};

const normalizeStatus = (status) =>
  String(status || '')
    .trim()
    .toLowerCase();

export const isStatusMeLoPienso = (status) => {
  const s = normalizeStatus(status);
  return s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending';
};

export const isStatusProrrogada = (status) => {
  const s = normalizeStatus(status);
  return s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada';
};

export const isStatusCancelada = (status) => {
  const s = normalizeStatus(status);
  return s === 'cancelled' || s === 'canceled' || s === 'cancelada';
};

export const isStatusCompletada = (status) => {
  const s = normalizeStatus(status);
  return s === 'completed' || s === 'completada';
};

export const getRoleBoxClasses = ({ status, isSeller, isBuyer }) => {
  const base =
    'border font-bold text-xs h-7 w-full flex items-center justify-center cursor-default select-none pointer-events-none truncate';

  if (isStatusCompletada(status) || isStatusCancelada(status)) {
    return `${base} bg-red-500/20 text-red-300 border-red-400/50`;
  }

  if (isStatusMeLoPienso(status) || isStatusProrrogada(status)) {
    if (isSeller) return `${base} bg-green-500/20 text-green-300 border-green-400/50`;
    if (isBuyer) return `${base} bg-purple-500/20 text-purple-300 border-purple-400/50`;
  }

  if (isSeller) return `${base} bg-green-500/20 text-green-300 border-green-400/50`;
  if (isBuyer) return `${base} bg-purple-500/20 text-purple-300 border-purple-400/50`;
  return `${base} bg-red-500/20 text-red-400 border-red-500/30`;
};

export const shouldEnableIR = ({ status, isSeller, isFinal }) => {
  if (isFinal) return false;
  if (isSeller) return false;
  if (isStatusMeLoPienso(status) || isStatusProrrogada(status)) return true;
  return true;
};

const clampFinite = (n, fallback = null) => (Number.isFinite(n) ? n : fallback);

export const getTargetTimeMs = (alert) => {
  const t = alert?.target_time;
  if (!t) return null;
  if (typeof t === 'number') return t;
  const asDate = new Date(t);
  const ms = asDate.getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const hasLatLon = (obj, latKey = 'latitude', lonKey = 'longitude') => {
  const lat = clampFinite(Number(obj?.[latKey]));
  const lon = clampFinite(Number(obj?.[lonKey]));
  return lat !== null && lon !== null;
};

export const pickCoords = (obj, latKey = 'latitude', lonKey = 'longitude') => {
  const lat = clampFinite(Number(obj?.[latKey]));
  const lon = clampFinite(Number(obj?.[lonKey]));
  if (lat === null || lon === null) return null;
  return { lat, lon };
};

export function useChatsData() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTs, setNowTs] = useState(Date.now());
  const [etaMap] = useState({});
  const hasEverHadTimeRef = useRef(new Map());

  const [demoConvs, setDemoConvs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('waitme:demo_conversations') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        (error) => console.log('Error obteniendo ubicación:', error),
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      try {
        setDemoConvs(JSON.parse(localStorage.getItem('waitme:demo_conversations') || '[]'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    };
    window.addEventListener('waitme:newDemoConversation', handler);
    return () => window.removeEventListener('waitme:newDemoConversation', handler);
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id ?? 'none'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await chat.getConversations(user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  const { data: alertsData = [] } = useQuery({
    queryKey: ['alertsForChats', user?.id ?? 'none'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await alerts.getAlertsForChats(user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    alertsData.forEach((a) => map.set(a.id, a));
    return map;
  }, [alertsData]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = conversations.filter((conv) => {
        const isP1 = conv.participant1_id === user?.id;
        const otherName = isP1 ? conv.participant2_name : conv.participant1_name;
        const lastMsg = conv.last_message_text || '';
        return otherName?.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
      });
    }

    const buyerReservations = [];
    const sellerReservations = [];
    const others = [];

    filtered.forEach((conv) => {
      const alert = alertsMap.get(conv.alert_id);
      if (!alert) return;

      const isBuyer = alert?.reserved_by_id === user?.id;
      const isSeller = alert?.user_id === user?.id && alert?.reserved_by_id;
      const isActive = alert?.status === 'reserved';

      if (isBuyer && isActive) {
        buyerReservations.push(conv);
      } else if (isSeller && isActive) {
        sellerReservations.push(conv);
      } else {
        others.push(conv);
      }
    });

    if (buyerReservations.length > 1) {
      buyerReservations.sort(
        (a, b) =>
          new Date(b.last_message_at || b.created_date) -
          new Date(a.last_message_at || a.created_date)
      );
      const [_activeBuyer, ...restBuyer] = buyerReservations;
      filtered = filtered.map((conv) => {
        if (restBuyer.find((c) => c.id === conv.id)) {
          const alert = alertsMap.get(conv.alert_id);
          if (alert) alert.status = 'cancelled';
        }
        return conv;
      });
      buyerReservations.length = 1;
    }

    if (sellerReservations.length > 1) {
      sellerReservations.sort(
        (a, b) =>
          new Date(b.last_message_at || b.created_date) -
          new Date(a.last_message_at || a.created_date)
      );
      const [_activeSeller, ...restSeller] = sellerReservations;
      filtered = filtered.map((conv) => {
        if (restSeller.find((c) => c.id === conv.id)) {
          const alert = alertsMap.get(conv.alert_id);
          if (alert) alert.status = 'cancelled';
        }
        return conv;
      });
      sellerReservations.length = 1;
    }

    return filtered.sort((a, b) => {
      const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;

      if (bUnread !== aUnread) return bUnread - aUnread;

      const toMs = (v) => {
        if (!v) return 0;
        if (typeof v === 'number') return v;
        const d = new Date(v);
        const ms = d.getTime();
        return Number.isFinite(ms) ? ms : 0;
      };

      const aLast = Math.max(
        toMs(a.last_message_at),
        toMs(a.status_updated_at),
        toMs(a.updated_date),
        toMs(a.updated_at),
        toMs(a.created_date),
        toMs(a.created_at)
      );

      const bLast = Math.max(
        toMs(b.last_message_at),
        toMs(b.status_updated_at),
        toMs(b.updated_date),
        toMs(b.updated_at),
        toMs(b.created_date),
        toMs(b.created_at)
      );

      return bLast - aLast;
    });
  }, [conversations, searchQuery, user?.id, alertsMap]);

  const calculateDistanceText = (alert) => {
    if (!alert?.latitude || !alert?.longitude) return null;
    if (!userLocation) {
      const demoDistances = ['150m', '320m', '480m', '650m', '800m'];
      return demoDistances[String(alert.id || '').charCodeAt(0) % demoDistances.length];
    }
    const R = 6371;
    const dLat = ((alert.latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((alert.longitude - userLocation.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((alert.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const meters = Math.round(distanceKm * 1000);
    return `${Math.min(meters, 999)}m`;
  };

  const getRemainingMsForAlert = (alert, _isBuyer) => {
    const entry = etaMap?.[alert?.id];

    if (entry && Number.isFinite(entry.etaSeconds)) {
      const elapsed = nowTs - entry.fetchedAt;
      const base = entry.etaSeconds * 1000;
      const remaining = Math.max(0, base - elapsed);

      if (base > 0) {
        hasEverHadTimeRef.current.set(alert.id, true);
      }

      return remaining;
    }

    const targetMs = getTargetTimeMs(alert);
    if (targetMs && targetMs > nowTs) {
      hasEverHadTimeRef.current.set(alert.id, true);
      return targetMs - nowTs;
    }

    return null;
  };

  return {
    user,
    userLocation,
    searchQuery,
    setSearchQuery,
    nowTs,
    demoConvs,
    setDemoConvs,
    conversations,
    alertsMap,
    filteredConversations,
    calculateDistanceText,
    getRemainingMsForAlert,
    hasEverHadTimeRef,
  };
}
