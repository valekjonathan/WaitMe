// src/pages/History.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Loader,
  X,
  MessageCircle,
  PhoneOff,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useAuth } from '@/components/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const queryClient = useQueryClient();

  // ====== UI helpers ======
  const labelNoClick = 'cursor-default select-none pointer-events-none';
  const noScrollBar =
    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  // ====== Fotos fijas (NO rotan) ======
  const fixedAvatars = {
    Sofía: 'https://randomuser.me/api/portraits/women/68.jpg',
    Hugo: 'https://randomuser.me/api/portraits/men/32.jpg',
    Nuria: 'https://randomuser.me/api/portraits/women/44.jpg',
    Iván: 'https://randomuser.me/api/portraits/men/75.jpg',
    Marco: 'https://randomuser.me/api/portraits/men/12.jpg'
  };
  const avatarFor = (name) => fixedAvatars[String(name || '').trim()] || null;

  // ====== Fecha: "19 Enero - 21:05" ======
  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const raw = format(new Date(ts), 'd MMMM - HH:mm', { locale: es });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const toMs = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') {
      if (v >= 1e12) return v;
      return v * 1000;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isNaN(n) && /^\d+(?:\.\d+)?$/.test(s)) {
        return n >= 1e12 ? n : n * 1000;
      }
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    }
    return null;
  };

  const getCreatedTs = (alert) => {
    const candidates = [
      alert?.created_date,
      alert?.createdDate,
      alert?.created_at,
      alert?.createdAt,
      alert?.timestamp
    ];
    for (const candidate of candidates) {
      const ms = toMs(candidate);
      if (typeof ms === 'number' && ms > 0) return ms;
    }
    return null;
  };

  const getWaitUntilTs = (alert) => {
    if (alert.wait_until) {
      const t = toMs(alert.wait_until);
      if (typeof t === 'number' && t > 0) {
        return t;
      }
    }
    const createdTs = getCreatedTs(alert);
    const mins = Number(alert.available_in_minutes);
    if (createdTs && Number.isFinite(mins) && mins > 0) {
      return createdTs + mins * 60 * 1000;
    }
    return null;
  };

  const formatRemaining = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (h > 0) {
      const hh = String(h).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const { data: myAlerts = [], isLoading: loadingAlerts, refetch } = useQuery({
    queryKey: ['myAlerts', user?.id],
    queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: false
  });

  useEffect(() => {
    refetch();
  }, [user?.id, refetch]);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.id],
    queryFn: async () => {
      const [asSeller, asBuyer] = await Promise.all([
        base44.entities.Transaction.filter({ seller_id: user?.id }),
        base44.entities.Transaction.filter({ buyer_id: user?.id })
      ]);
      return [...asSeller, ...asBuyer];
    },
    enabled: !!user?.id,
    staleTime: 5000,
    refetchInterval: false
  });

  const deleteAlertSafe = async (id) => {
    try {
      await base44.entities.ParkingAlert.delete(id);
    } catch (e) {}
  };

  const cancelReservationSafe = async (id) => {
    try {
      await base44.entities.ParkingAlert.delete(id);
    } catch (e) {}
  };

  const autoFinalizedRef = useRef(new Set());
  const autoFinalizedReservationsRef = useRef(new Set());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        () => {}
      );
    }
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Renderizado de alertas activas
  const activeAlerts = myAlerts
    .filter((a) => {
      if (a.user_id !== user?.id) return false;
      if (a.status !== 'active' && a.status !== 'reserved') return false;
      return true;
    })
    .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

  return (
    <div>
      {/* Resto del código para mostrar las alertas */}
      {activeAlerts.map((alert, index) => {
        const createdTs = getCreatedTs(alert);
        const waitUntilTs = getWaitUntilTs(alert);
        if (!createdTs || !waitUntilTs) {
          console.warn('Alert sin timestamps válidos:', alert.id);
          return null;
        }
        const remainingMs = Math.max(0, waitUntilTs - nowTs);
        const waitUntilLabel = format(new Date(waitUntilTs), 'HH:mm', { locale: es });
        const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : 'EXPIRADA';

        if (remainingMs <= 0 && alert.status === 'active') {
          const isMock = String(alert.id).startsWith('mock-');
          if (!isMock && !autoFinalizedRef.current.has(alert.id)) {
            autoFinalizedRef.current.add(alert.id);
            base44.entities.ParkingAlert.update(alert.id, { status: 'expired' }).finally(() => {
              queryClient.invalidateQueries(['myAlerts', user?.id]);
            });
          }
          return null;
        }

        const cardKey = `active-${alert.id}`;
        const dateText = formatCardDate(createdTs);

        return (
          <motion.div
            key={cardKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
          >
            <UserCard
              name={alert.user_name}
              carLabel={`${alert.car_brand || ''} ${alert.car_model || ''}`.trim()}
              plate={alert.car_plate}
              photoUrl={alert.user_photo}
              actions={
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      hideKey(cardKey);
                      await deleteAlertSafe(alert.id);
                      queryClient.invalidateQueries(['myAlerts', user?.id]);
                    }}
                  >
                    <X className="w-4 h-4" strokeWidth={3} />
                  </Button>
                </div>
              }
              dateText={dateText}
              dateClassName="text-white"
              right={
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 flex items-center justify-center text-center">
                    {countdownText}
                  </Badge>
                </div>
              }
            />
          </motion.div>
        );
      })}
      <BottomNav active="History" />
    </div>
  );
}