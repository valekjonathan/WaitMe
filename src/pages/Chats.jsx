import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Navigation } from 'lucide-react';
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

// ======================
// Helpers
// ======================
const pad2 = (n) => String(n).padStart(2, '0');

const formatMMSS = (ms) => {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
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

// OSRM (gratis) para ETA real por carretera
const osrmRouteUrl = (from, to) =>
  `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&alternatives=false&steps=false`;

async function fetchOsrmEtaSeconds(from, to, signal) {
  const res = await fetch(osrmRouteUrl(from, to), { signal });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const duration = data?.routes?.[0]?.duration;
  if (typeof duration === 'number' && Number.isFinite(duration)) return Math.max(0, Math.round(duration));
  throw new Error('OSRM duration inválido');
}

export default function Chats() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTs, setNowTs] = useState(Date.now());

  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState(null);
  const [currentExpiredAlert, setCurrentExpiredAlert] = useState(null);

  // ETA cache: alertId -> { etaSeconds, fetchedAt }
  const [etaMap, setEtaMap] = useState({});

  const expiredHandledRef = useRef(new Set());
  const osrmAbortRef = useRef(null);

  // Tick global (1 vez) para TODOS los contadores
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
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

  // ======================
  // Datos: Conversaciones
  // ======================
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id || 'anon'],
    queryFn: async () => {
      const allConversations = await base44.entities.Conversation.list('-last_message_at', 50);

      const mockConversations = [
        {
          id: 'mock_reservaste_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_sofia',
          participant2_name: 'Sofía',
          participant2_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          alert_id: 'alert_reservaste_1',
          last_message_text: 'Perfecto, voy llegando',
          last_message_at: new Date(Date.now() - 1 * 60000).toISOString(),
          unread_count_p1: 2,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        {
          id: 'mock_te_reservo_1',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_marco',
          participant2_name: 'Marco',
          participant2_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          alert_id: 'alert_te_reservo_1',
          last_message_text: '¿Sigues ahí?',
          last_message_at: new Date(Date.now() - 2 * 60000).toISOString(),
          unread_count_p1: 3,
          unread_count_p2: 0,
          reservation_type: 'seller'
        },
        {
          id: 'mock_reservaste_2',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'seller_laura',
          participant2_name: 'Laura',
          participant2_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          alert_id: 'alert_reservaste_2',
          last_message_text: 'Genial, aguanto',
          last_message_at: new Date(Date.now() - 10 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'buyer'
        },
        {
          id: 'mock_te_reservo_2',
          participant1_id: user?.id || 'user1',
          participant1_name: 'Tu',
          participant1_photo: user?.photo_url,
          participant2_id: 'buyer_carlos',
          participant2_name: 'Carlos',
          participant2_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          alert_id: 'alert_te_reservo_2',
          last_message_text: 'Estoy cerca',
          last_message_at: new Date(Date.now() - 15 * 60000).toISOString(),
          unread_count_p1: 0,
          unread_count_p2: 0,
          reservation_type: 'seller'
        }
      ];

      const combined = [...mockConversations, ...allConversations];
      return combined.sort(
        (a, b) =>
          new Date(b.last_message_at || b.updated_date || b.created_date) -
          new Date(a.last_message_at || a.updated_date || a.created_date)
      );
    },
    staleTime: 10000,
    refetchInterval: false
  });

  // ======================
  // Datos: Alertas (mocks + reales)
  // ======================
  const { data: alerts = [] } = useQuery({
    queryKey: ['alertsForChats', user?.id || 'anon'],
    queryFn: async () => {
      const now = Date.now();

      const mockAlerts = [
        {
          id: 'alert_reservaste_1',
          user_id: 'seller_sofia',
          user_name: 'Sofía',
          user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
          car_brand: 'Renault',
          car_model: 'Clio',
          car_plate: '7733 MNP',
          car_color: 'rojo',
          price: 6,
          address: 'Calle Uría, 33, Oviedo',
          latitude: 43.362776,
          longitude: -5.84589,
          allow_phone_calls: true,
          phone: '+34677889900',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          // posición aproximada del reservador (para demo)
          reserved_by_latitude: 43.35954,
          reserved_by_longitude: -5.85234,
          status: 'reserved',
          created_date: new Date(now - 1 * 60000).toISOString()
        },
        {
          id: 'alert_te_reservo_1',
          user_id: user?.id,
          user_name: 'Tu',
          user_photo: user?.photo_url,
          car_brand: 'Seat',
          car_model: 'Ibiza',
          car_plate: '1234 ABC',
          car_color: 'azul',
          price: 4,
          address: 'Calle Campoamor, 15, Oviedo',
          latitude: 43.357815,
          longitude: -5.84979,
          allow_phone_calls: true,
          phone: user?.phone,
          reserved_by_id: 'buyer_marco',
          reserved_by_name: 'Marco',
          reserved_by_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          reserved_by_latitude: 43.36621,
          reserved_by_longitude: -5.84312,
          status: 'reserved',
          created_date: new Date(now - 2 * 60000).toISOString()
        },
        {
          id: 'alert_reservaste_2',
          user_id: 'seller_laura',
          user_name: 'Laura',
          user_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          car_brand: 'Opel',
          car_model: 'Corsa',
          car_plate: '9812 GHJ',
          car_color: 'blanco',
          price: 4,
          address: 'Paseo de la Castellana, 42, Madrid',
          latitude: 40.464667,
          longitude: -3.632623,
          allow_phone_calls: true,
          phone: '+34612345678',
          reserved_by_id: user?.id,
          reserved_by_name: 'Tu',
          reserved_by_latitude: 40.45811,
          reserved_by_longitude: -3.68843,
          status: 'reserved',
          created_date: new Date(now - 10 * 60000).toISOString()
        },
        {
          id: 'alert_te_reservo_2',
          user_id: user?.id,
          user_name: 'Tu',
          user_photo: user?.photo_url,
          car_brand: 'Toyota',
          car_model: 'Yaris',
          car_plate: '5678 DEF',
          car_color: 'gris',
          price: 5,
          address: 'Avenida del Paseo, 25, Madrid',
          latitude: 40.456775,
          longitude: -3.68879,
          allow_phone_calls: true,
          phone: user?.phone,
          reserved_by_id: 'buyer_carlos',
          reserved_by_name: 'Carlos',
          reserved_by_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          reserved_by_latitude: 40.47002,
          reserved_by_longitude: -3.67812,
          status: 'reserved',
          created_date: new Date(now - 15 * 60000).toISOString()
        }
      ];

      if (!user?.id) return mockAlerts;

      let realAlerts = [];
      try {
        realAlerts = await base44.entities.ParkingAlert.list('-created_date', 100);
      } catch (e) {
        console.log('Error cargando alertas:', e);
      }

      return [...mockAlerts, ...realAlerts];
    },
    staleTime: 30000,
    refetchInterval: false
  });

  const alertsMap = useMemo(() => {
    const map = new Map();
    alerts.forEach((a) => map.set(a.id, a));
    return map;
  }, [alerts]);

  // ======================
  // Unreads + filtrado
  // ======================
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

    return filtered.sort((a, b) => {
      const aUnread = (a.participant1_id === user?.id ? a.unread_count_p1 : a.unread_count_p2) || 0;
      const bUnread = (b.participant1_id === user?.id ? b.unread_count_p1 : b.unread_count_p2) || 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
    });
  }, [conversations, searchQuery, user?.id]);

  // ======================
  // Expiración + prórroga
  // ======================
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

  // ======================
  // UI helpers
  // ======================
  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const date = new Date(ts);
    const day = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit' });
    let month = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '');
    month = month.charAt(0).toUpperCase() + month.slice(1);
    const time = date.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${month} - ${time}`;
  };

  const calculateDistanceText = (alert) => {
    if (!alert?.latitude || !alert?.longitude) return null;
    if (!userLocation) {
      const demoDistances = ['150m', '320m', '480m', '650m', '800m'];
      return demoDistances[String(alert.id || '').charCodeAt(0) % demoDistances.length];
    }
    const R = 6371;
    const dLat = (alert.latitude - userLocation.lat) * Math.PI / 180;
    const dLon = (alert.longitude - userLocation.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) *
        Math.cos(alert.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const meters = Math.round(distanceKm * 1000);
    return `${Math.min(meters, 999)}m`;
  };

  // ======================
  // ETA REAL (batch + cache) -> SIN hooks en map
  // ======================
  const visibleEtaRequests = useMemo(() => {
    const items = [];
    const max = 20; // límite para no reventar OSRM
    for (const conv of filteredConversations.slice(0, max)) {
      const alert = alertsMap.get(conv.alert_id);
      if (!alert) continue;

      const isBuyer = alert?.reserved_by_id === user?.id;
      const isSeller = alert?.reserved_by_id && !isBuyer;

      // buyer: tú -> ubicación del alert
      const buyerFrom = userLocation;
      const buyerTo = hasLatLon(alert) ? pickCoords(alert) : null;

      // seller: otro -> ubicación del alert (tu plaza)
      const sellerFrom =
        hasLatLon(alert, 'reserved_by_latitude', 'reserved_by_longitude')
          ? pickCoords(alert, 'reserved_by_latitude', 'reserved_by_longitude')
          : null;
      const sellerTo = hasLatLon(alert) ? pickCoords(alert) : null;

      if (isBuyer && buyerFrom && buyerTo) {
        items.push({ alertId: alert.id, from: buyerFrom, to: buyerTo });
      } else if (isSeller && sellerFrom && sellerTo) {
        items.push({ alertId: alert.id, from: sellerFrom, to: sellerTo });
      }
    }
    return items;
  }, [filteredConversations, alertsMap, user?.id, userLocation]);

  useEffect(() => {
    let mounted = true;

    const abortPrev = () => {
      try {
        osrmAbortRef.current?.abort?.();
      } catch (e) {}
      osrmAbortRef.current = null;
    };

    const shouldRefresh = (alertId) => {
      const entry = etaMap?.[alertId];
      if (!entry) return true;
      // refresco cada 20s
      return Date.now() - entry.fetchedAt > 20000;
    };

    const run = async () => {
      if (!visibleEtaRequests.length) return;

      // abort anterior
      abortPrev();
      const controller = new AbortController();
      osrmAbortRef.current = controller;

      const toFetch = visibleEtaRequests.filter((it) => shouldRefresh(it.alertId));
      if (!toFetch.length) return;

      try {
        const results = await Promise.all(
          toFetch.map(async (it) => {
            const etaSeconds = await fetchOsrmEtaSeconds(it.from, it.to, controller.signal);
            return { alertId: it.alertId, etaSeconds };
          })
        );

        if (!mounted) return;

        setEtaMap((prev) => {
          const next = { ...prev };
          const now = Date.now();
          for (const r of results) {
            next[r.alertId] = { etaSeconds: r.etaSeconds, fetchedAt: now };
          }
          return next;
        });
      } catch (e) {
        // Si OSRM falla, no rompemos nada
      }
    };

    // primera vez + polling cada 20s
    run();
    const id = setInterval(run, 20000);

    return () => {
      mounted = false;
      clearInterval(id);
      abortPrev();
    };
    // NOTA: etaMap está dentro por refresh logic, pero controlado por shouldRefresh
  }, [visibleEtaRequests, etaMap]);

  const getRemainingMsForAlert = (alert, isBuyer) => {
    // 1) Si hay ETA cache -> descontamos tiempo real desde fetchedAt
    const entry = etaMap?.[alert?.id];
    if (entry && typeof entry.etaSeconds === 'number' && Number.isFinite(entry.etaSeconds)) {
      const elapsed = nowTs - entry.fetchedAt;
      const base = entry.etaSeconds * 1000;
      return Math.max(0, base - elapsed);
    }

    // 2) fallback legacy: target_time
    const targetMs = getTargetTimeMs(alert);
    if (targetMs) return Math.max(0, targetMs - nowTs);

    // 3) si no hay nada, 0
    return 0;
  };

  // Detectar expiraciones FUERA del render
  useEffect(() => {
    const max = 25;
    for (const conv of filteredConversations.slice(0, max)) {
      const alert = alertsMap.get(conv.alert_id);
      if (!alert) continue;
      const isBuyer = alert?.reserved_by_id === user?.id;
      const remainingMs = getRemainingMsForAlert(alert, isBuyer);
      if (remainingMs === 0) openExpiredDialog(alert, isBuyer);
    }
  }, [nowTs, filteredConversations, alertsMap, user?.id]);

  // ======================
  // Render
  // ======================
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

            const cardDate = formatCardDate(conv.last_message_at || conv.created_date);

            // buyer = tú reservaste (tú viajas hacia la ubicación del alert)
            const isBuyer = alert?.reserved_by_id === user?.id;
            // seller = te reservaron (el otro viaja hacia tu ubicación)
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

            const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
            const waitUntilText = format(new Date(nowTs + remainingMs), 'HH:mm', { locale: es });

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
                    hasUnread ? 'border-purple-500/50' : 'border-gray-700/80'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 w-[95px]">
                        <Badge
                          className={`${
                            hasUnread
                              ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          } border font-bold text-xs h-7 w-full flex items-center justify-center cursor-default select-none pointer-events-none truncate`}
                        >
                          {isBuyer ? 'Reservaste a:' : isSeller ? 'Te reservó:' : 'Info usuario'}
                        </Badge>
                      </div>
                      <div className={`flex-1 text-center text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-400'} truncate`}>
                        {cardDate}
                      </div>
                      <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                        <Navigation className="w-3 h-3 text-purple-400" />
                        <span className="text-white font-bold text-xs">{distanceText}</span>
                      </div>
                      <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-0.5 flex items-center gap-1 h-7">
                        <span className="text-purple-300 font-bold text-xs">{Math.floor(alert?.price || 0)}€</span>
                      </div>
                    </div>

                    {/* Tarjeta usuario */}
                    <div className="border-t border-gray-700/80 mb-1.5 pt-2">
                      <MarcoCard
                        photoUrl={isBuyer ? alert.user_photo : alert.reserved_by_photo || otherUserPhoto}
                        name={isBuyer ? alert.user_name : alert.reserved_by_name || otherUserName}
                        carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
                        plate={alert.car_plate}
                        carColor={alert.car_color || 'gris'}
                        address={alert.address}
                        timeLine={
                          isSeller ? (
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                              Te vas en {remainingMinutes} min · Debes esperar hasta las {waitUntilText}
                            </span>
                          ) : (
                            <span className={hasUnread ? 'text-white' : 'text-gray-400'}>Tiempo para llegar:</span>
                          )
                        }
                        onChat={() => (window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`))}
                        // MISMO FORMATO VISUAL de contador (texto "MM:SS")
                        statusText={countdownText}
                        phoneEnabled={alert.allow_phone_calls}
                        onCall={() => alert.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                        dimmed={!hasUnread}
                      />
                    </div>

                    {/* Últimos mensajes */}
                    <div
                      className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => (window.location.href = createPageUrl(`Chat?conversationId=${conv.id}`))}
                    >
                      <div className="flex justify-between items-center">
                        <p className={`text-xs font-bold ${hasUnread ? 'text-purple-400' : 'text-gray-500'}`}>Ultimos mensajes:</p>
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

      {/* Dialog de prórroga */}
      <Dialog
        open={showProrrogaDialog}
        onOpenChange={(open) => {
          setShowProrrogaDialog(open);
          if (!open) {
            setSelectedProrroga(null);
            setCurrentExpiredAlert(null);
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
                  <span className="text-purple-400 font-bold">1€</span>
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
                  <span className="text-purple-400 font-bold">3€</span>
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
                  <span className="text-purple-400 font-bold">5€</span>
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