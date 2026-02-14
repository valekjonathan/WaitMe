import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Navigation, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import MarcoCard from '@/components/cards/MarcoCard';
import {
  isDemoMode,
  startDemoFlow,
  subscribeDemoFlow,
  getDemoConversations,
  getDemoAlerts
} from '@/components/DemoFlowManager';
import { getCurrentUser } from '@/lib/currentUser';

// ======================
// Helpers
// ======================
const pad2 = (n) => String(n).padStart(2, '0');

const formatMMSS = (ms) => {
  const safe = Math.max(0, ms ?? 0);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
};

const getChatStatusLabel = (status) => {
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

const isFinalChatStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return ['completed', 'completada', 'cancelled', 'canceled', 'cancelada', 'expired', 'agotada', 'expirada', 'went_early', 'se_fue'].includes(s);
};

// ====== Estilos sincronizados (CHATS / CHAT / NOTIFICACIONES) ======
const PURPLE_ACTIVE_BORDER = 'border-purple-400/70';
const PURPLE_ACTIVE_TEXT = 'text-purple-400';
const PURPLE_ACTIVE_TEXT_DIM = 'text-purple-400/70';

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const isStatusMeLoPienso = (status) => {
  const s = normalizeStatus(status);
  return s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending';
};

const isStatusProrrogada = (status) => {
  const s = normalizeStatus(status);
  return s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada';
};

const isStatusCancelada = (status) => {
  const s = normalizeStatus(status);
  return s === 'cancelled' || s === 'canceled' || s === 'cancelada';
};

const isStatusCompletada = (status) => {
  const s = normalizeStatus(status);
  return s === 'completed' || s === 'completada';
};

const getRoleBoxClasses = ({ status, isSeller, isBuyer }) => {
  // Caja izquierda: "Te reservo:" (vendes/ganas) o "Reservaste a:" (compras/pagas)
  const base =
    'border font-bold text-xs h-7 w-full flex items-center justify-center cursor-default select-none pointer-events-none truncate';

  // COMPLETADAS / CANCELADAS => rojo (ambas)
  if (isStatusCompletada(status) || isStatusCancelada(status)) {
    return `${base} bg-red-500/20 text-red-300 border-red-400/50`;
  }

  // ME LO PIENSO / PRORROGADA => seller verde, buyer morado
  if (isStatusMeLoPienso(status) || isStatusProrrogada(status)) {
    if (isSeller) return `${base} bg-green-500/20 text-green-300 border-green-400/50`;
    if (isBuyer) return `${base} bg-purple-500/20 text-purple-300 border-purple-400/50`;
  }

  // Por defecto: seller verde (ganas) / buyer morado (pagas) / otros rojo suave
  if (isSeller) return `${base} bg-green-500/20 text-green-300 border-green-400/50`;
  if (isBuyer) return `${base} bg-purple-500/20 text-purple-300 border-purple-400/50`;
  return `${base} bg-red-500/20 text-red-400 border-red-500/30`;
};

const PricePill = ({ direction = 'up', amount = 0 }) => {
  const isUp = direction === 'up';
  const wrapCls = isUp ? 'bg-green-500/15 border border-green-400/40' : 'bg-red-500/15 border border-red-400/40';
  const textCls = isUp ? 'text-green-400' : 'text-red-400';
  return (
    <div className={`${wrapCls} rounded-lg px-2 py-1 flex items-center gap-1 h-7`}>
      {isUp ? <TrendingUpIcon className={`w-4 h-4 ${textCls}`} /> : <TrendingDownIcon className={`w-4 h-4 ${textCls}`} />}
      <span className={`font-bold text-sm ${textCls}`}>{Math.floor(amount || 0)}€</span>
    </div>
  );
};

// Íconos (SVG) para mantener este archivo autocontenido sin tocar imports
const TrendingUpIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const shouldEnableIR = ({ status, isSeller, isFinal }) => {
  if (isFinal) return false;
  if (isSeller) return false;
  // En ME LO PIENSO / PRORROGA el botón debe estar encendido (comprador)
  if (isStatusMeLoPienso(status) || isStatusProrrogada(status)) return true;
  // En el resto de estados no finales, también lo dejamos activo (comprador)
  return true;
};


const clampFinite = (n, fallback = null) => (Number.isFinite(n) ? n : fallback);

const getTargetTimeMs = (alert) => {
  const t = alert?.target_time;
  if (!t) return null;
  if (typeof t === 'number') return t;
  const asDate = new Date(t);
  const ms = asDate.getTime();
  return Number.isFinite(ms) ? ms : null;
};

const hasLatLon = (obj, latKey = 'latitude', lonKey = 'longitude') => {
  const lat = clampFinite(Number(obj?.[latKey]));
  const lon = clampFinite(Number(obj?.[lonKey]));
  return lat !== null && lon !== null;
};

const pickCoords = (obj, latKey = 'latitude', lonKey = 'longitude') => {
  const lat = clampFinite(Number(obj?.[latKey]));
  const lon = clampFinite(Number(obj?.[lonKey]));
  if (lat === null || lon === null) return null;
  return { lat, lon };
};

const PriceChip = ({ amount, direction }) => {
  const n = Number(amount || 0);
  const amountText = `${Math.floor(Math.abs(n))}€`;
  const isGreen = direction === 'up';
  const isRed = direction === 'down';
  const wrapCls = isGreen
    ? 'bg-green-500/20 border border-green-500/30'
    : isRed
    ? 'bg-red-500/20 border border-red-500/30'
    : 'bg-purple-600/20 border border-purple-500/30';
  const textCls = isGreen ? 'text-green-400' : isRed ? 'text-red-400' : 'text-purple-300';
  return (
    <div className={`${wrapCls} rounded-lg px-3 py-0.5 flex items-center gap-1 h-7`}>
      {isGreen ? <TrendingUp className={`w-4 h-4 ${textCls}`} /> : null}
      {isRed ? <TrendingDown className={`w-4 h-4 ${textCls}`} /> : null}
      <span className={`font-bold text-xs ${textCls}`}>{amountText}</span>
    </div>
  );
};


export default function Chats() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTs, setNowTs] = useState(Date.now());

  // Demo “vivo” y sincronizado (CHATS / CHAT / NOTIFICACIONES)
  const demoMode = useMemo(() => isDemoMode(), []);
  const [demoTick, setDemoTick] = useState(0);

  useEffect(() => {
    if (!demoMode) return;
    startDemoFlow();
    const unsub = subscribeDemoFlow(() => setDemoTick((t) => t + 1));
    return () => unsub?.();
  }, [demoMode]);

  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState(null);
  const [currentExpiredAlert, setCurrentExpiredAlert] = useState(null);

  const [etaMap, setEtaMap] = useState({});

  const expiredHandledRef = useRef(new Set());
  const hasEverHadTimeRef = useRef(new Map());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser({ id: 'guest', display_name: 'Tú', photo_url: null, __guest: true });
      }
    };
    fetchUser();

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

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id ?? 'none'],
    queryFn: async () => {
      return [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
    refetchInterval: false
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats', user?.id ?? 'none'],
    queryFn: async () => {
      return [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    keepPreviousData: true,
    refetchInterval: false
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    alerts.forEach((a) => map.set(a.id, a));
    return map;
  }, [alerts]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => {
      const isP1 = conv.participant1_id === user?.id;
      const unread = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
      return sum + (unread || 0);
    }, 0);
  }, [conversations, user?.id]);

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

    // Aplicar lógica de negocio: solo UNA reserva activa como buyer y UNA como seller
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

    // Mantener solo la reserva buyer más reciente como activa
    if (buyerReservations.length > 1) {
      buyerReservations.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
      const [activeBuyer, ...restBuyer] = buyerReservations;
      filtered = filtered.map((conv) => {
        if (restBuyer.find((c) => c.id === conv.id)) {
          const alert = alertsMap.get(conv.alert_id);
          if (alert) alert.status = 'cancelled';
        }
        return conv;
      });
      buyerReservations.length = 1;
    }

    // Mantener solo la reserva seller más reciente como activa
    if (sellerReservations.length > 1) {
      sellerReservations.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
      const [activeSeller, ...restSeller] = sellerReservations;
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

  const openExpiredDialog = (alert, isBuyer) => {
    if (!alert?.id) return;
    if (expiredHandledRef.current.has(alert.id)) return;
    expiredHandledRef.current.add(alert.id);

    const title = isBuyer ? '⏱️ No te has presentado' : '⏱️ Usuario no se ha presentado';
    const desc = isBuyer
      ? 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
      : 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera';

    toast({ title, description: desc });

    setCurrentExpiredAlert({ alert, isBuyer });
    setSelectedProrroga(null);
    setShowProrrogaDialog(true);
  };

  const handleProrroga = async () => {
    if (!selectedProrroga || !currentExpiredAlert) return;

    const { minutes, price } = selectedProrroga;
    const { alert, isBuyer } = currentExpiredAlert;

    try {
      await base44.entities.Notification.create({
        type: 'extension_request',
        recipient_id: isBuyer ? alert.user_id : alert.reserved_by_id,
        sender_id: user?.id,
        sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
        alert_id: alert.id,
        amount: price,
        extension_minutes: minutes,
        status: 'pending'
      });

      toast({
        title: '✅ PRÓRROGA ENVIADA',
        description: `${minutes} min por ${price}€`
      });
    } catch (err) {
      console.error('Error creando notificación de prórroga:', err);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la prórroga. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }

    setShowProrrogaDialog(false);
    setSelectedProrroga(null);
    setCurrentExpiredAlert(null);
  };

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

  const openDirectionsToAlert = (alert) => {
    const coords = hasLatLon(alert) ? pickCoords(alert) : null;
    if (!coords) return;
    const { lat, lon } = coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    window.location.href = url;
  };

  const getRemainingMsForAlert = (alert, isBuyer) => {
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

  useEffect(() => {
    const max = 25;
    for (const conv of filteredConversations.slice(0, max)) {
      const alert = alertsMap.get(conv.alert_id);
      if (!alert) continue;
      const isBuyer = alert?.reserved_by_id === user?.id;
      const remainingMs = getRemainingMsForAlert(alert, isBuyer);
            const statusLabel = getChatStatusLabel(alert?.status);
const isCompletedOrCanceled = statusLabel === 'COMPLETADA' || statusLabel === 'CANCELADA';
const isThinking = statusLabel === 'ME LO PIENSO';
const isProrroga = statusLabel === 'PRÓRROGA';

const isSeller = alert?.user_id === user?.id;

const badgeCls = isCompletedOrCanceled
  ? 'bg-red-500/20 text-red-400 border-red-500/30'
  : isBuyer
  ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
  : isSeller
  ? 'bg-green-500/20 text-green-300 border-green-400/50'
  : 'bg-purple-500/10 text-purple-300/70 border-purple-400/30';


      if (remainingMs === 0 && hasEverHadTimeRef.current.get(alert.id) === true && !showProrrogaDialog) {
        openExpiredDialog(alert, isBuyer);
      }
    }
  }, [nowTs, filteredConversations, alertsMap, user?.id, showProrrogaDialog]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Chats" showBackButton={true} backTo="Home" unreadCount={totalUnread} />

      <main className="pt-[60px] pb-24">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-3 pt-1">
          {filteredConversations.map((conv, index) => {
            const alert = alertsMap.get(conv.alert_id);
            if (!alert) return null;

            const isP1 = conv.participant1_id === user?.id;
            const unreadCount = isP1 ? conv.unread_count_p1 : conv.unread_count_p2;
            const hasUnread = (unreadCount || 0) > 0;

            const isBuyer = alert?.reserved_by_id === user?.id;
            const isSeller = alert?.reserved_by_id && !isBuyer;

            const otherUserName = isP1 ? conv.participant2_name : conv.participant1_name;
            let otherUserPhoto = isP1 ? conv.participant2_photo : conv.participant1_photo;

            if (!otherUserPhoto) {
              const photoUrls = [
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                'https://randomuser.me/api/portraits/women/68.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/75.jpg'
              ];
              otherUserPhoto = photoUrls[String(conv.id || '').charCodeAt(0) % photoUrls.length];
            }

            const distanceText = calculateDistanceText(alert);

            const remainingMs = getRemainingMsForAlert(alert, isBuyer);
            const countdownText = formatMMSS(remainingMs);

            const remainingMinutes = Math.max(0, Math.ceil((remainingMs ?? 0) / 60000));
            const waitUntilText = format(new Date(nowTs + (remainingMs ?? 0)), 'HH:mm', { locale: es });

            const finalLabel = getChatStatusLabel(alert?.status);
            const isFinal = isFinalChatStatus(alert?.status) && !!finalLabel;
            const canIR = shouldEnableIR({ status: alert?.status, isSeller, isFinal });
            const statusBoxText = isFinal ? finalLabel : countdownText;

            const navigateToChat = () => {
              const name = encodeURIComponent(otherUserName || '');
              const photo = encodeURIComponent(otherUserPhoto || '');
              const demo = demoMode ? 'demo=true&' : '';
              const alertIdParam = conv.alert_id ? `&alertId=${encodeURIComponent(conv.alert_id)}` : '';
              navigate(createPageUrl(`Chat?${demo}conversationId=${conv.id}${alertIdParam}&otherName=${name}&otherPhoto=${photo}`));
            };

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={`bg-gradient-to-br ${
                    hasUnread ? 'from-gray-800 to-gray-900' : 'from-gray-900/50 to-gray-900/50'
                  } rounded-xl p-2.5 transition-all border-2 ${
                    hasUnread ? 'border-purple-400/70' : 'border-purple-500/30'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 w-[95px]">
                        <Badge
                          className={getRoleBoxClasses({ status: alert?.status, isSeller, isBuyer })}
                        >
                          {isBuyer ? 'Reservaste a:' : isSeller ? 'Te reservo:' : 'Info usuario'}
                        </Badge>
                      </div>
                      <div className="flex-1"></div>
                      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                        <Navigation className="w-3 h-3 text-purple-400" />
                        <span className="text-white font-bold text-xs">{distanceText}</span>
                      </div>
                      <PricePill direction={isSeller ? 'up' : 'down'} amount={alert?.price} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Cerrar conversación:', conv.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>

                    <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                      <MarcoCard
                        photoUrl={otherUserPhoto}
                        name={otherUserName}
                        carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                        plate={alert.car_plate}
                        carColor={alert.car_color || 'gris'}
                        address={alert.address}
                        timeLine={
                          isSeller ? (
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                              Te vas en {remainingMinutes} min ·{' '}
                              <span className="text-purple-300 font-bold">Debes esperar hasta las {waitUntilText}</span>
                            </span>
                          ) : isBuyer ? (
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                              Se va en {remainingMinutes} min ·{' '}
                              <span className="text-purple-300 font-bold">Te espera hasta las {waitUntilText}</span>
                            </span>
                          ) : (
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>Tiempo para llegar:</span>
                          )
                        }
                        onChat={navigateToChat}
                        statusText={statusBoxText}
                        phoneEnabled={alert.allow_phone_calls}
                        onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                        dimmed={!hasUnread}
                        role={isSeller ? 'seller' : 'buyer'}
                      />

                      {hasLatLon(alert) && (
                        <div className="mt-2">
                          <Button
                            disabled={!canIR}
                            className={`w-full border-2 ${
                              canIR ? 'bg-blue-600 hover:bg-blue-700 border-blue-400/70' : 'bg-blue-600/30 text-white/50 border-blue-500/30'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isSeller || isFinal) return;
                              openDirectionsToAlert(alert);
                            }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Navigation className="w-4 h-4" />
                              IR
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div
                      className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={navigateToChat}
                    >
                      <div className="flex justify-between items-center">
                        <p className={`text-xs font-bold ${hasUnread ? PURPLE_ACTIVE_TEXT : PURPLE_ACTIVE_TEXT_DIM}`}>
                          Últimos mensajes:
                        </p>
                        {unreadCount > 0 && (
                          <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center relative top-[10px]">
                            <span className="text-red-400 text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                        {conv.last_message_text || 'Sin mensajes'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <BottomNav />

      <Dialog
        open={showProrrogaDialog}
        onOpenChange={(open) => {
          setShowProrrogaDialog(open);
          if (!open) {
            setSelectedProrroga(null);
            setCurrentExpiredAlert(null);
            expiredHandledRef.current.clear();
          }
        }}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {currentExpiredAlert?.isBuyer ? '⏱️ No te has presentado' : '⏱️ Usuario no se ha presentado'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {currentExpiredAlert?.isBuyer
                ? 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
                : 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-300 font-semibold">PRORROGAR</p>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedProrroga({ minutes: 5, price: 1 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 5
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">5 minutos más</span>
                  <span className="text-purple-300 font-bold">1€</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProrroga({ minutes: 10, price: 3 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 10
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">10 minutos más</span>
                  <span className="text-purple-300 font-bold">3€</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProrroga({ minutes: 15, price: 5 })}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedProrroga?.minutes === 15
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">15 minutos más</span>
                  <span className="text-purple-300 font-bold">5€</span>
                </div>
              </button>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setShowProrrogaDialog(false)} className="flex-1 border-gray-700">
              {currentExpiredAlert?.isBuyer ? 'ACEPTAR DEVOLUCIÓN' : 'ACEPTAR COMPENSACIÓN'}
            </Button>
            <Button
              onClick={handleProrroga}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!selectedProrroga}
            >
              PRORROGAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}