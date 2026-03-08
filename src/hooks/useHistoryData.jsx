import { useState, useEffect, useRef, useMemo } from 'react';
import * as alerts from '@/data/alerts';
import * as transactions from '@/data/transactions';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  X,
  MessageCircle,
  PhoneOff,
  Phone,
  Navigation,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { setCarsMovementMode, CARS_MOVEMENT_MODE } from '@/stores/carsMovementStore';
import { toMs, getActiveSellerAlerts, getBestFinalizedTs } from '@/lib/alertSelectors';
import { stampFinalizedAt, getFinalizedAtMap } from '@/lib/finalizedAtStore';
import { useMyAlerts } from '@/hooks/useMyAlerts';
import { getCarFill, getCarFillThinking, formatPlate } from '@/utils/carUtils';
import {
  formatAddress,
  formatPriceInt,
  formatRemaining,
  CarIconProfile,
  PlateProfile,
  SectionTag,
  CardHeaderRow,
  MoneyChip,
  MarcoContent,
  CountdownButton,
} from '@/components/history/HistoryItem';

const labelNoClick = 'cursor-default select-none pointer-events-none';
const noScrollBar =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const badgePhotoWidth = 'w-[95px] h-7 flex items-center justify-center text-center';

const fixedAvatars = {
  Sofía:
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
  Hugo: 'https://randomuser.me/api/portraits/men/32.jpg',
  Nuria: 'https://randomuser.me/api/portraits/women/44.jpg',
  Iván: 'https://randomuser.me/api/portraits/men/75.jpg',
  Marco: 'https://randomuser.me/api/portraits/men/12.jpg',
};
const avatarFor = (name) => fixedAvatars[String(name || '').trim()] || null;

function formatCardDate(ts) {
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

function statusLabelFrom(s, alert) {
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

function reservationMoneyModeFromStatus(status) {
  const st = String(status || '').toLowerCase();
  if (st === 'completed') return 'paid';
  if (st === 'expired' || st === 'cancelled') return 'neutral';
  return 'neutral';
}

export function useHistoryData() {
  const { user } = useAuth();
  const [nowTs, setNowTs] = useState(Date.now());
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelConfirmAlert, setCancelConfirmAlert] = useState(null);
  const [expirePromptOpen, setExpirePromptOpen] = useState(false);
  const [expirePromptAlert, setExpirePromptAlert] = useState(null);
  const [cancelReservedOpen, setCancelReservedOpen] = useState(false);
  const [cancelReservedAlert, setCancelReservedAlert] = useState(null);

  const [thinkingRequests, setThinkingRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('waitme:thinking_requests') || '[]');
    } catch {
      return [];
    }
  });
  const [rejectedRequests, setRejectedRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const reload = () => {
      try {
        setThinkingRequests(JSON.parse(localStorage.getItem('waitme:thinking_requests') || '[]'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    };
    window.addEventListener('waitme:thinkingUpdated', reload);
    return () => window.removeEventListener('waitme:thinkingUpdated', reload);
  }, []);

  useEffect(() => {
    const reload = () => {
      try {
        setRejectedRequests(JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    };
    window.addEventListener('waitme:rejectedUpdated', reload);
    return () => window.removeEventListener('waitme:rejectedUpdated', reload);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const queryClient = useQueryClient();
  const createdFallbackRef = useRef(new Map());
  const autoFinalizedRef = useRef(new Set());
  const autoFinalizedReservationsRef = useRef(new Set());

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

  const [hiddenKeys, setHiddenKeys] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('waitme:hidden_keys') || '[]');
      return new Set(stored);
    } catch {
      return new Set();
    }
  });

  const hideKey = (key) => {
    const next = new Set(hiddenKeys);
    next.add(key);
    setHiddenKeys(next);
    try {
      localStorage.setItem('waitme:hidden_keys', JSON.stringify(Array.from(next)));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const deleteAlertSafe = async (id) => {
    try {
      await alerts.deleteAlert(id);
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  const { data: myAlerts = [], isLoading: loadingAlerts } = useMyAlerts();

  const { data: transactionsData = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      try {
        const { data, error } = await transactions.listTransactions(user?.id, { limit: 5000 });
        if (error) throw error;
        return data ?? [];
      } catch {
        return [];
      }
    },
  });

  const myActiveAlerts = useMemo(
    () => getActiveSellerAlerts(myAlerts, user?.id, user?.email),
    [myAlerts, user?.id, user?.email]
  );

  const hasReservedAlerts = myActiveAlerts.filter((a) => a.status === 'reserved').length > 0;
  useEffect(() => {
    setCarsMovementMode(
      hasReservedAlerts ? CARS_MOVEMENT_MODE.WAITME_ACTIVE : CARS_MOVEMENT_MODE.STATIC
    );
    return () => setCarsMovementMode(CARS_MOVEMENT_MODE.STATIC);
  }, [hasReservedAlerts]);

  const visibleActiveAlerts = useMemo(() => {
    return myActiveAlerts.filter((a) => !hiddenKeys.has(`active-${a.id}`));
  }, [myActiveAlerts, hiddenKeys]);

  useEffect(() => {
    if (!visibleActiveAlerts || visibleActiveAlerts.length === 0) return;

    const toExpire = visibleActiveAlerts.filter((a) => {
      if (!a) return false;
      const st = String(a.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'expired') return false;
      if (st !== 'active') return false;
      if (autoFinalizedRef.current.has(a.id)) return false;

      const createdTs = getCreatedTs(a);
      const waitUntilTs = getWaitUntilTs(a);
      if (!waitUntilTs || !createdTs) return false;

      const remainingMs = Math.max(0, waitUntilTs - nowTs);
      return remainingMs === 0;
    });

    if (toExpire.length === 0) return;

    toExpire.forEach((a) => autoFinalizedRef.current.add(a.id));

    const mine = toExpire.find((a) => {
      const uid = user?.id;
      const email = user?.email;
      const isMine =
        (uid && (a.user_id === uid || a.created_by === uid)) || (email && a.user_email === email);
      return isMine;
    });

    if (mine && !expirePromptOpen) {
      setExpirePromptAlert(mine);
      setExpirePromptOpen(true);
    }

    const others = toExpire.filter((a) => !mine || a.id !== mine.id);

    Promise.all(
      others.map((a) =>
        alerts
          .updateAlert(a.id, { status: 'expired' })
          .then(() => null)
          .catch(() => null)
      )
    ).finally(() => {
      queryClient.setQueryData(['myAlerts'], (prev = []) =>
        prev.map((a) => (others.some((o) => o.id === a.id) ? { ...a, status: 'expired' } : a))
      );
    });
  }, [nowTs, visibleActiveAlerts, queryClient, user?.id, user?.email]);

  const myFinalizedAlerts = useMemo(() => {
    const finalized = myAlerts.filter((a) => {
      if (!a) return false;

      const isMine =
        (user?.id && (a.user_id === user.id || a.created_by === user.id)) ||
        (user?.email && a.user_email === user.email);

      if (!isMine) return false;

      return ['cancelled', 'completed', 'expired'].includes(String(a.status || '').toLowerCase());
    });

    return finalized;
  }, [myAlerts, user?.id, user?.email]);

  const myReservationsReal = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.reserved_by_id !== user?.id) return false;
      if (a.status !== 'reserved') return false;

      return true;
    });
  }, [myAlerts, user?.id]);
  const reservationsActiveAll = myReservationsReal;

  useEffect(() => {
    if (!reservationsActiveAll || reservationsActiveAll.length === 0) return;

    const toExpire = reservationsActiveAll.filter((a) => {
      if (!a) return false;
      const st = String(a.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'expired') return false;
      if (st !== 'reserved') return false;
      if (String(a.id || '').startsWith('mock-')) return false;
      if (autoFinalizedReservationsRef.current.has(a.id)) return false;

      const createdTs = getCreatedTs(a);
      const waitUntilTs = getWaitUntilTs(a);
      if (!waitUntilTs || !createdTs) return false;

      const remainingMs = Math.max(0, waitUntilTs - nowTs);
      return remainingMs === 0;
    });

    if (toExpire.length === 0) return;

    toExpire.forEach((a) => autoFinalizedReservationsRef.current.add(a.id));

    Promise.all(
      toExpire.map((a) =>
        alerts
          .updateAlert(a.id, { status: 'expired' })
          .then(() => null)
          .catch(() => null)
      )
    ).finally(() => {
      queryClient.setQueryData(['myAlerts'], (prev = []) =>
        prev.map((a) => (toExpire.some((o) => o.id === a.id) ? { ...a, status: 'expired' } : a))
      );
    });
  }, [nowTs, reservationsActiveAll, queryClient]);

  const myFinalizedAsSellerTx = useMemo(
    () => transactionsData.filter((t) => t.seller_id === user?.id),
    [transactionsData, user?.id]
  );

  const myFinalizedAll = useMemo(() => {
    const fatMap = getFinalizedAtMap();
    return [
      ...myFinalizedAlerts.map((a) => ({
        type: 'alert',
        id: `final-alert-${a.id}`,
        finalized_at: a.finalized_at || fatMap[a.id] || getBestFinalizedTs(a),
        data: a,
      })),
      ...myFinalizedAsSellerTx.map((t) => ({
        type: 'transaction',
        id: `final-tx-${t.id}`,
        finalized_at: fatMap[t.id] || getBestFinalizedTs(t),
        data: t,
      })),
      ...rejectedRequests.map((i) => ({
        type: 'rejected',
        id: `rejected-${i.id}`,
        finalized_at: i.finalized_at || i.savedAt || 0,
        data: i,
      })),
    ].sort((a, b) => b.finalized_at - a.finalized_at);
  }, [myFinalizedAlerts, myFinalizedAsSellerTx, rejectedRequests]);

  const finalItems = useMemo(
    () => myFinalizedAll.filter((item) => !hiddenKeys.has(item.id)),
    [myFinalizedAll, hiddenKeys]
  );

  const reservationsFinalAllBase = [
    ...myAlerts
      .filter((a) => a.reserved_by_id === user?.id && a.status !== 'reserved')
      .map((a) => ({
        type: 'alert',
        id: `res-final-alert-${a.id}`,
        created_date: a.created_date,
        data: a,
      })),
    ...transactionsData
      .filter((t) => t.buyer_id === user?.id)
      .map((t) => ({
        type: 'transaction',
        id: `res-final-tx-${t.id}`,
        created_date: t.created_date,
        data: t,
      })),
  ];
  const reservationsFinalAll = reservationsFinalAllBase.sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  const loading = loadingAlerts || loadingTransactions;

  const cancelAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await alerts.updateAlert(alertId, { status: 'cancelled' });

      const uid = user?.id;
      if (!uid) return;
      const { data: all } = await alerts.getMyAlerts(uid);
      const mine = (all || []).filter((a) => {
        if (!a) return false;
        const st = String(a.status || '').toLowerCase();
        return st === 'active';
      });
      await Promise.all(
        mine
          .filter((a) => a.id && a.id !== alertId)
          .map((a) =>
            alerts
              .updateAlert(a.id, { status: 'cancelled' })
              .then(() => null)
              .catch(() => null)
          )
      );
    },
    onMutate: async (alertId) => {
      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        const now = Date.now();
        return list.map((a) => {
          if (a?.id !== alertId) return a;
          stampFinalizedAt(alertId);
          return {
            ...a,
            status: 'cancelled',
            finalized_at: now,
            updated_date: new Date(now).toISOString(),
          };
        });
      });

      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
    onSuccess: () => {
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
  });

  const expireAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await alerts.updateAlert(alertId, { status: 'expired' });
    },
    onMutate: async (alertId) => {
      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : old?.data || [];
        return list.map((a) => (a?.id === alertId ? { ...a, status: 'expired' } : a));
      });
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
    onSuccess: () => {},
  });

  const repeatAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (!alert) return null;

      await alerts.updateAlert(alert.id, { status: 'expired' });

      const now = Date.now();
      const minutes = Number(alert.available_in_minutes || 0);
      const futureTime = new Date(now + minutes * 60 * 1000);

      const payload = {
        sellerId: alert.seller_id ?? alert.user_id,
        latitude: alert.latitude ?? alert.lat,
        longitude: alert.longitude ?? alert.lng,
        address: alert.address ?? alert.address_text,
        price: alert.price,
        wait_until: futureTime.toISOString(),
        metadata: {
          available_in_minutes: minutes,
          brand: alert.brand || '',
          model: alert.model || '',
          color: alert.color || '',
          plate: alert.plate || '',
          phone: alert.phone || null,
          allow_phone_calls: !!alert.allow_phone_calls,
        },
      };

      const { data } = await alerts.createAlert(payload);
      return data;
    },
    onSuccess: () => {
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    },
  });

  const [expiredAlertExtend, setExpiredAlertExtend] = useState({});
  const [expiredAlertModalId, setExpiredAlertModalId] = useState(null);

  useEffect(() => {
    if (!visibleActiveAlerts) return;
    visibleActiveAlerts.forEach((alert) => {
      if (alert.status !== 'reserved') return;
      const waitUntilTs = getWaitUntilTs(alert);
      if (!waitUntilTs) return;
      const rem = Math.max(0, waitUntilTs - nowTs);
      if (rem === 0 && !expiredAlertExtend[alert.id]) {
        setExpiredAlertExtend((prev) => ({ ...prev, [alert.id]: true }));
        setExpiredAlertModalId(alert.id);
      }
    });
  }, [nowTs, visibleActiveAlerts]);

  const ExpiredBlock = ({ alert }) => (
    <>
      <div className="border-t border-gray-700/60 mt-2 pt-2">
        <p className="text-white text-sm font-semibold text-center mb-2">
          Usuario no se ha presentado. Puedes irte o prorrogarle:
        </p>
        <div className="flex gap-2 mb-2">
          {[
            { mins: '5 min', price: '2 €', addMins: 5 },
            { mins: '10 min', price: '3 €', addMins: 10 },
            { mins: '15 min', price: '5 €', addMins: 15 },
          ].map((opt) => (
            <button
              key={opt.addMins}
              className="flex-1 h-9 rounded-lg bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 transition-colors flex flex-col items-center justify-center"
              onClick={() => {
                setExpiredAlertExtend((prev) => {
                  const n = { ...prev };
                  delete n[alert.id];
                  return n;
                });
                setExpiredAlertModalId(null);
                const newMins = (Number(alert.available_in_minutes) || 0) + opt.addMins;
                alerts.updateAlert(alert.id, { available_in_minutes: newMins }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                });
              }}
            >
              <span className="text-white text-[11px] font-bold leading-none">{opt.mins} ·</span>
              <span className="text-purple-300 text-[11px] font-bold leading-none mt-0.5">
                {opt.price}
              </span>
            </button>
          ))}
        </div>
        <Button
          className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
          onClick={() => {
            setExpiredAlertExtend((prev) => {
              const n = { ...prev };
              delete n[alert.id];
              return n;
            });
            setExpiredAlertModalId(null);
            stampFinalizedAt(alert.id);
            alerts.updateAlert(alert.id, { status: 'cancelled' }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
              try {
                window.dispatchEvent(new Event('waitme:badgeRefresh'));
              } catch (error) {
                console.error('[WaitMe Error]', error);
              }
            });
          }}
        >
          Me voy
        </Button>
      </div>
    </>
  );

  const ReservedByContent = ({
    alert,
    waitUntilLabel,
    countdownText,
    onNavigateClick,
    onCancelClick,
  }) => {
    const reservedByName = alert.reserved_by_name || 'Usuario';
    const reservedByPhoto =
      alert.reserved_by_photo ||
      avatarFor(reservedByName) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(reservedByName)}&background=7c3aed&color=fff&size=128`;

    const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls !== false);
    const isExpired = expiredAlertExtend[alert.id];

    const carLabel = alert.reserved_by_car || 'Sin datos';
    const carColor = alert.reserved_by_car_color || 'gris';
    const plate = alert.reserved_by_plate || '';
    const carFill = getCarFill(carColor);

    const stUpper = String(countdownText || '')
      .trim()
      .toUpperCase();
    const isCountdownLike = /^\d{2}:\d{2}(?::\d{2})?$/.test(stUpper);
    const statusBoxCls = isCountdownLike
      ? 'border-purple-400/70 bg-purple-600/25'
      : 'border-purple-500/30 bg-purple-600/10';
    const statusTextCls = isCountdownLike ? 'text-purple-100' : 'text-purple-300';

    return (
      <>
        <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
              Te reservó:
            </div>
            <div className="flex items-center gap-1">
              <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                <Navigation className="w-3 h-3 text-purple-400" />
                <span className="text-white font-bold text-xs">300m</span>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold text-sm">
                  {formatPriceInt(alert.price)}
                </span>
              </div>
              {onCancelClick && (
                <button
                  onClick={onCancelClick}
                  className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-700/80 mb-2" />

          <div className="flex gap-2.5">
            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
              <img
                src={reservedByPhoto}
                alt={reservedByName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 h-[85px] flex flex-col">
              <p className="font-bold text-xl text-white leading-none">
                {String(reservedByName).split(' ')[0]}
              </p>
              <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">
                {carLabel}
              </p>
              <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                <div className="flex-shrink-0">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">
                      {formatPlate(plate)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex-shrink-0 relative top-[2px]">
                    <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
                      <path
                        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
                        fill={carFill}
                        stroke="white"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M16 9 L18 12 L30 12 L32 9 Z"
                        fill="rgba(255,255,255,0.3)"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                      <circle cx="14" cy="18" r="2" fill="#666" />
                      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                      <circle cx="36" cy="18" r="2" fill="#666" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
              <MapPin className="w-4 h-4 flex-shrink-0 text-purple-400" />
              <span className="text-gray-200 line-clamp-1 leading-none">
                {formatAddress(alert.address)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
              <Clock className="w-4 h-4 flex-shrink-0 text-purple-400" />
              <span className="leading-none">
                <span className="text-white">Te vas en {alert.available_in_minutes} min · </span>
                <span className="text-purple-400">Debes esperar hasta las:</span>{' '}
                <span className="text-white font-bold" style={{ fontSize: '14px' }}>
                  {waitUntilLabel}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              size="icon"
              className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400"
              style={{ width: '46px', flexShrink: 0 }}
              onClick={() =>
                (window.location.href = createPageUrl(
                  `Chat?alertId=${alert.id}&userId=${alert.reserved_by_email || alert.reserved_by_id}`
                ))
              }
            >
              <MessageCircle className="w-4 h-4" />
            </Button>

            {phoneEnabled ? (
              <Button
                size="icon"
                className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg border-2 border-gray-300"
                style={{ width: '46px', flexShrink: 0 }}
                onClick={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
              >
                <Phone className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-8 border-2 border-white/30 bg-white/10 text-white rounded-lg opacity-70"
                style={{ width: '46px', flexShrink: 0 }}
                disabled
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            )}

            <Button
              size="icon"
              className={`h-8 rounded-lg border-2 flex items-center justify-center ${
                onNavigateClick
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 animate-pulse shadow-lg shadow-blue-500/50'
                  : 'bg-blue-600/40 text-blue-300 border-blue-400/30 opacity-50 cursor-not-allowed'
              }`}
              style={{ width: '46px', flexShrink: 0 }}
              disabled={!onNavigateClick}
              onClick={onNavigateClick || undefined}
            >
              <Navigation className="w-4 h-4" />
            </Button>

            <div className="flex-1">
              <div
                className={`w-full h-8 rounded-lg border-2 flex items-center justify-center ${statusBoxCls}`}
              >
                <span className={`font-mono font-extrabold text-sm ${statusTextCls}`}>
                  {countdownText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isExpired && <ExpiredBlock alert={alert} />}
      </>
    );
  };

  const sellerContext = {
    finalItems,
    noScrollBar,
    SectionTag,
    thinkingRequests,
    setThinkingRequests,
    visibleActiveAlerts,
    nowTs,
    formatRemaining,
    getCreatedTs,
    getWaitUntilTs,
    hiddenKeys,
    hideKey,
    formatCardDate,
    formatPriceInt,
    formatAddress,
    getCarFill,
    getCarFillThinking,
    CarIconProfile,
    PlateProfile,
    badgePhotoWidth,
    labelNoClick,
    cancelAlertMutation,
    queryClient,
    ReservedByContent,
    CardHeaderRow,
    MoneyChip,
    CountdownButton,
    statusLabelFrom,
    MarcoContent,
    deleteAlertSafe,
    user,
    setCancelReservedAlert,
    setCancelReservedOpen,
    expiredAlertExtend,
    setExpiredAlertExtend,
    setExpiredAlertModalId,
    ExpiredBlock,
    toMs,
    avatarFor,
    formatPlate,
    reservationMoneyModeFromStatus,
  };

  const buyerContext = {
    noScrollBar,
    SectionTag,
    reservationsActiveAll,
    nowTs,
    getCreatedTs,
    getWaitUntilTs,
    formatRemaining,
    hiddenKeys,
    autoFinalizedReservationsRef,
    formatCardDate,
    formatPriceInt,
    reservationMoneyModeFromStatus,
    CardHeaderRow,
    badgePhotoWidth,
    labelNoClick,
    MoneyChip,
    hideKey,
    user,
    queryClient,
    MarcoContent,
    formatAddress,
    reservationsFinalAll,
    toMs,
    deleteAlertSafe,
    statusLabelFrom,
  };

  return {
    sellerContext,
    buyerContext,
    loading,
    user,
    userLocation: null,
    cancelConfirmOpen,
    setCancelConfirmOpen,
    cancelConfirmAlert,
    setCancelConfirmAlert,
    expirePromptOpen,
    setExpirePromptOpen,
    expirePromptAlert,
    setExpirePromptAlert,
    cancelReservedOpen,
    setCancelReservedOpen,
    cancelReservedAlert,
    setCancelReservedAlert,
    hideKey,
    queryClient,
    formatCardDate,
    formatPriceInt,
    formatAddress,
    getCreatedTs,
    getWaitUntilTs,
    nowTs,
    cancelAlertMutation,
    expireAlertMutation,
    repeatAlertMutation,
    stampFinalizedAt,
    visibleActiveAlerts,
    myActiveAlerts,
    expiredAlertModalId,
    setExpiredAlertModalId,
    setExpiredAlertExtend,
    avatarFor,
    PlateProfile,
    CarIconProfile,
    getCarFill,
    badgePhotoWidth,
    labelNoClick,
    MoneyChip,
    CardHeaderRow,
    CountdownButton,
  };
}
