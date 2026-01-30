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
  Phone,
  Navigation
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

  useEffect(() => {
    const i = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

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

  // ====== Fecha: "19 Enero - 21:05" en hora de Madrid ======
  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const date = new Date(ts);
    const madridDateStr = date.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const formatted = madridDateStr
      .replace(' de ', ' ')
      .replace(',', ' -')
      .replace(/(\d+)\s+([a-záéíóúñ]+)/i, (m, day, month) => {
        const cap = month.charAt(0).toUpperCase() + month.slice(1);
        return `${day} ${cap}`;
      });

    return formatted;
  };

  // ====== Dirección formato: "Calle Gran Vía, n1, Oviedo" ======
  const formatAddress = (addr) => {
    const fallback = 'Calle Gran Vía, n1, Oviedo';
    const s = String(addr || '').trim();
    if (!s) return fallback;

    const hasOviedo = /oviedo/i.test(s);
    const m = s.match(/^(.+?),\s*(?:n\s*)?(\d+)\s*(?:,.*)?$/i);
    if (m) {
      const street = m[1].trim();
      const num = m[2].trim();
      return `${street}, n${num}, Oviedo`;
    }

    if (!hasOviedo) return `${s}, Oviedo`;
    return s;
  };

  // ====== Coche + matrícula (como Marco) ======
  const carColors = [
    { value: 'blanco', fill: '#FFFFFF' },
    { value: 'negro', fill: '#1a1a1a' },
    { value: 'rojo', fill: '#ef4444' },
    { value: 'azul', fill: '#3b82f6' },
    { value: 'amarillo', fill: '#facc15' },
    { value: 'gris', fill: '#6b7280' }
  ];

  const getCarFill = (colorValue) => {
    const c = carColors.find((x) => x.value === (colorValue || '').toLowerCase());
    return c?.fill || '#6b7280';
  };

  const formatPlate = (plate) => {
    const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
    if (!p) return '0000 XXX';
    const a = p.slice(0, 4);
    const b = p.slice(4);
    return `${a} ${b}`.trim();
  };

  const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
    <svg viewBox="0 0 48 24" className={size} fill="none" style={{ transform: 'translateY(3px)' }}>
      <path
        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
        fill={color}
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
  );

  const PlateProfile = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
      <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
        <span className="text-white text-[8px] font-bold">E</span>
      </div>
      <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
        {formatPlate(plate)}
      </span>
    </div>
  );

  // ====== Timestamps robustos ======
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

  const getExpiresTs = (alert) => {
    return toMs(alert?.expires_at);
  };

  // ====== Campos robustos (evita 00:00 permanente y pantallas en blanco) ======
  const getCreatedTs = (obj) =>
    toMs(obj?.created_date ?? obj?.created_at ?? obj?.createdAt ?? obj?.created_ts ?? obj?.createdTs);

  const getWaitUntilTs = (alert) => {
  const explicit =
    alert?.expires_at ??
    alert?.wait_until ??
    alert?.wait_until_at ??
    alert?.waitUntil ??
    alert?.waitUntilAt;

  const explicitMs = toMs(explicit);
  if (explicitMs) return explicitMs;

  // 🔒 FALLBACK REAL: created_date + available_in_minutes
  const createdMs = getCreatedTs(alert);
  const mins = Number(alert?.available_in_minutes);

  if (createdMs && Number.isFinite(mins)) {
    return createdMs + mins * 60 * 1000;
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

  // ====== Countdown (apagable para Finalizadas) ======
  const CountdownButton = ({ text, dimmed = false }) => (
    <div
      className={[
        'w-full h-9 rounded-lg border-2 flex items-center justify-center px-3',
        dimmed
          ? 'border-purple-500/30 bg-purple-600/10'
          : 'border-purple-400/70 bg-purple-600/25'
      ].join(' ')}
    >
      <span
        className={`text-sm font-mono font-extrabold ${
          dimmed ? 'text-gray-400/70' : 'text-purple-100'
        }`}
      >
        {text}
      </span>
    </div>
  );

  // ====== Secciones "Activas / Finalizadas" centradas ======
  const SectionTag = ({ variant, text }) => {
    const cls =
      variant === 'green'
        ? 'bg-green-500/20 border-green-500/30 text-green-400'
        : 'bg-red-500/20 border-red-500/30 text-red-400';
    return (
      <div className="w-full flex justify-center pt-0">
        <div
          className={`${cls} border rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs text-center ${labelNoClick}`}
        >
          {text}
        </div>
      </div>
    );
  };

  // ====== Header de tarjeta (fecha centrada ENTRE badge y precio) ======
  const CardHeaderRow = ({ left, dateText, dateClassName, right }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-shrink-0">{left}</div>
      <div className={`flex-1 text-center text-xs ${dateClassName || ''}`}>{dateText}</div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );

  // ====== Chips de dinero ======
  const MoneyChip = ({ mode = 'neutral', amountText, showDownIcon = false, showUpIcon = false }) => {
    const isGreen = mode === 'green';
    const isRed = mode === 'red';

    const wrapCls = isGreen
      ? 'bg-green-500/20 border border-green-500/30'
      : isRed
      ? 'bg-red-500/20 border border-red-500/30'
      : 'bg-gray-500/10 border border-gray-600';

    const textCls = isGreen ? 'text-green-400' : isRed ? 'text-red-400' : 'text-gray-400';

    return (
      <div className={`${wrapCls} rounded-lg px-2 py-1 flex items-center gap-1 h-7`}>
        {showUpIcon ? <TrendingUp className={`w-4 h-4 ${textCls}`} /> : null}
        {showDownIcon ? <TrendingDown className={`w-4 h-4 ${textCls}`} /> : null}
        <span className={`font-bold text-sm ${textCls}`}>{amountText}</span>
      </div>
    );
  };

  // ====== Contenido "Marco" SIN tarjeta envolvente ======
  const MarcoContent = ({
    photoUrl,
    name,
    carLabel,
    plate,
    carColor,
    onChat,
    statusText = 'COMPLETADA',
    address,
    timeLine,
    priceChip,
    phoneEnabled = false,
    onCall,
    statusEnabled = false,
    bright = false
  }) => {
    const stUpper = String(statusText || '').trim().toUpperCase();
    const isCountdownLike =
      typeof statusText === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(String(statusText).trim());
    const isCompleted = stUpper === 'COMPLETADA';
    const isDimStatus = stUpper === 'CANCELADA' || stUpper === 'EXPIRADA';
    const statusOn = statusEnabled || isCompleted || isDimStatus || isCountdownLike;

    const photoCls = bright ? 'w-full h-full object-cover' : 'w-full h-full object-cover';

    const avatarSrc = photoUrl || avatarFor(name);

    const statusColorClass = isCompleted
      ? 'text-green-400'
      : isDimStatus
      ? 'text-gray-500'
      : isCountdownLike
      ? 'text-purple-300'
      : 'text-gray-400';

    return (
      <>
        {/* top row: photo + car/plate + actions */}
        <div className="flex gap-3 items-center mb-2">
          {/* Foto */}
          <div className="w-[92px] h-[92px] rounded-xl overflow-hidden border-2 border-gray-700 flex-shrink-0 bg-gray-800">
            {avatarSrc ? (
              <img src={avatarSrc} alt={name} className={photoCls} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                {String(name || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {/* Car + plate */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-extrabold text-base truncate">{name || 'Usuario'}</span>
            </div>

            <div className="flex items-center gap-2">
              <CarIconProfile color={getCarFill(carColor)} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400 font-semibold truncate">{carLabel || 'Sin datos'}</span>
                <div className="mt-1">
                  <PlateProfile plate={plate} />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 items-end">
            {priceChip ? priceChip : null}

            <div className="flex gap-2">
              <Button
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 w-10 border-2 border-gray-500"
                onClick={onChat}
              >
                <MessageCircle className="w-5 h-5" strokeWidth={3} />
              </Button>

              <Button
                size="icon"
                className={`${
                  phoneEnabled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700'
                } text-white rounded-xl h-10 w-10 border-2 border-gray-500`}
                onClick={onCall}
                disabled={!phoneEnabled}
              >
                {phoneEnabled ? <Phone className="w-5 h-5" strokeWidth={3} /> : <PhoneOff className="w-5 h-5" strokeWidth={3} />}
              </Button>
            </div>
          </div>
        </div>

        {/* address */}
        <div className="flex items-start gap-1.5 text-xs mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
          <span className="text-gray-400 leading-5">{formatAddress(address) || 'Ubicación marcada'}</span>
        </div>

        {/* timeline */}
        <div className="flex items-start gap-1.5 text-xs mb-2">
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
          <span className="text-gray-400 leading-5">{timeLine || '--'}</span>
        </div>

        {/* status */}
        {statusOn ? (
          <div className="mt-2">
            <div className="w-full h-9 rounded-lg border-2 border-gray-700/80 bg-black/30 flex items-center justify-center px-3">
              <span className={`text-sm font-extrabold ${statusColorClass}`}>{statusText}</span>
            </div>
          </div>
        ) : null}
      </>
    );
  };

  // ====== Queries ======
  const queryClient = useQueryClient();

  const { data: myAlertsRaw, isLoading } = useQuery({
    queryKey: ['myAlerts'],
    queryFn: async () => {
      const res = await base44.entities.ParkingAlert.list({
        filter: { user_email: user?.email }
      });
      return res?.data || res || [];
    },
    enabled: Boolean(user?.email)
  });

  const { data: myTransactionsRaw } = useQuery({
    queryKey: ['myTransactions'],
    queryFn: async () => {
      const res = await base44.entities.Transaction.list({
        filter: { $or: [{ buyer_id: user?.id }, { seller_id: user?.id }] }
      });
      return res?.data || res || [];
    },
    enabled: Boolean(user?.id)
  });

  // ====== Hides ======
  const [hiddenKeys, setHiddenKeys] = useState(new Set());
  const hideKey = (k) => setHiddenKeys((prev) => new Set(prev).add(k));

  // ====== Safety delete ======
  const deleteAlertSafe = async (id) => {
    try {
      await base44.entities.ParkingAlert.delete(id);
    } catch (e) {}
  };

  // ====== Mutations ======
  const cancelAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      return base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });

  const [userEmailSafe] = useState(user?.email || '');

  // ====== Demo fallbacks (si hiciera falta) ======
  const baseNow = Date.now();
  const demoAlerts = [
    {
      id: 'mock-1',
      user_email: userEmailSafe,
      user_name: 'Sofía',
      user_photo: fixedAvatars.Sofía,
      address: 'Calle Uría, n10, Oviedo',
      available_in_minutes: 8,
      price: 2.5,
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_color: 'rojo',
      car_plate: '1234ABC',
      expires_at: new Date(baseNow + 8 * 60 * 1000).toISOString(),
      status: 'active',
      created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      id: 'mock-2',
      user_email: userEmailSafe,
      user_name: 'Hugo',
      user_photo: fixedAvatars.Hugo,
      address: 'Avenida de Galicia, n5, Oviedo',
      available_in_minutes: 12,
      price: 3.0,
      car_brand: 'BMW',
      car_model: 'Serie 1',
      car_color: 'azul',
      car_plate: '5678DEF',
      expires_at: new Date(baseNow + 12 * 60 * 1000).toISOString(),
      status: 'reserved',
      reserved_by_name: 'Marco',
      reserved_by_email: userEmailSafe,
      reserved_by_car: 'Audi A3 gris',
      reserved_by_plate: '9999ZZZ',
      created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'mock-3',
      user_email: userEmailSafe,
      user_name: 'Nuria',
      user_photo: fixedAvatars.Nuria,
      address: 'Plaza de España, n1, Oviedo',
      available_in_minutes: 6,
      price: 2.0,
      car_brand: 'Renault',
      car_model: 'Clio',
      car_color: 'gris',
      car_plate: '2468GHI',
      expires_at: new Date(baseNow - 2 * 60 * 1000).toISOString(),
      status: 'expired',
      created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 5).toISOString()
    }
  ];

  const myAlerts = Array.isArray(myAlertsRaw) ? myAlertsRaw : [];
  const myTransactions = Array.isArray(myTransactionsRaw) ? myTransactionsRaw : [];

  // ====== Derivados ======
  const myActiveAlerts = useMemo(() => {
    const real = myAlerts.filter((a) => String(a.status || '').toLowerCase() === 'active');
    if (real.length > 0) return real;
    return demoAlerts.filter((a) => String(a.status).toLowerCase() === 'active');
  }, [myAlerts]);

  const reservationsActiveAll = useMemo(() => {
    const real = myAlerts.filter((a) => String(a.status || '').toLowerCase() === 'reserved');
    if (real.length > 0) return real;
    return demoAlerts.filter((a) => String(a.status).toLowerCase() === 'reserved');
  }, [myAlerts]);

  const myFinalizedAll = useMemo(() => {
    const alertsFinal = myAlerts
      .filter((a) => ['expired', 'cancelled', 'completed'].includes(String(a.status || '').toLowerCase()))
      .map((a) => ({ type: 'alert', id: `alert-${a.id}`, data: a }));

    const txFinal = myTransactions
      .filter((t) => ['completed', 'cancelled'].includes(String(t.status || '').toLowerCase()))
      .map((t) => ({ type: 'tx', id: `tx-${t.id}`, data: t }));

    const filtered = [...alertsFinal, ...txFinal];

    if (filtered.length > 0) {
      const sorted = filtered.sort((a, b) => (toMs(b.data.created_date) || 0) - (toMs(a.data.created_date) || 0));
      return sorted;
    }

    const demoFinal = demoAlerts
      .filter((a) => ['expired', 'cancelled', 'completed'].includes(String(a.status).toLowerCase()))
      .map((a) => ({ type: 'alert', id: `alert-${a.id}`, data: a }));

    return demoFinal;
  }, [myAlerts, myTransactions]);

  const reservationsFinalAll = useMemo(() => {
    const alertsFinal = myAlerts
      .filter((a) => ['expired', 'cancelled', 'completed'].includes(String(a.status || '').toLowerCase()))
      .map((a) => ({ type: 'alert', id: `alert-${a.id}`, data: a }));

    const txFinal = myTransactions
      .filter((t) => ['completed', 'cancelled'].includes(String(t.status || '').toLowerCase()))
      .map((t) => ({ type: 'tx', id: `tx-${t.id}`, data: t }));

    const filtered = [...alertsFinal, ...txFinal];
    if (filtered.length > 0) {
      const sorted = filtered.sort((a, b) => (toMs(b.data.created_date) || 0) - (toMs(a.data.created_date) || 0));
      return sorted;
    }

    return [];
  }, [myAlerts, myTransactions]);

  // ====== Auto-finalize reservas cuando expiraron ======
  const autoFinalizedReservationsRef = useRef(new Set());

  // ====== Helpers status ======
  const statusLabelFrom = (st) => {
    const s = String(st || '').toLowerCase();
    if (s === 'completed') return 'COMPLETADA';
    if (s === 'cancelled') return 'CANCELADA';
    if (s === 'expired') return 'EXPIRADA';
    if (s === 'reserved') return 'RESERVADA';
    if (s === 'active') return 'ACTIVA';
    return 'FINALIZADA';
  };

  const reservationMoneyModeFromStatus = (st) => {
    const s = String(st || '').toLowerCase();
    if (s === 'completed') return 'paid';
    if (s === 'cancelled') return 'neutral';
    if (s === 'expired') return 'neutral';
    return 'neutral';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Alertas" showBackButton={true} backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="sticky top-[56px] z-40 bg-black pt-4 pb-1">
            <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0">
              <TabsTrigger value="alerts" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Tus alertas
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ===================== TUS ALERTAS ===================== */}
          <TabsContent
            value="alerts"
            className={`space-y-1.5 pb-24 max-h-[calc(100vh-126px)] overflow-y-auto pr-0 ${noScrollBar}`}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                <SectionTag variant="green" text="Activas" />

                {myActiveAlerts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center"
                  >
                    <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-[20px]">
                    {myActiveAlerts
                      .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
                      .map((alert, index) => {
                        const createdTs = getCreatedTs(alert);
                        const waitUntilTs = getWaitUntilTs(alert);

                        // FIX: countdown no depende de created_date (evita 00:00 permanente)
                        const remainingMs = waitUntilTs ? Math.max(0, waitUntilTs - nowTs) : 0;

                        const waitUntilLabel = waitUntilTs
                          ? new Date(waitUntilTs).toLocaleString('es-ES', {
                              timeZone: 'Europe/Madrid',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                          : '--:--';

                        const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : formatRemaining(0);

                        const cardKey = `active-${alert.id}`;
                        if (hiddenKeys.has(cardKey)) return null;

                        const dateText = formatCardDate(createdTs);

                        return (
                          <motion.div
                            key={cardKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                          >
                            {alert.status === 'reserved' && alert.reserved_by_name ? (
                              <>
                                <CardHeaderRow
                                  left={
                                    <Badge
                                      className={`bg-purple-500/20 text-purple-300 border border-purple-400/50 flex items-center justify-center text-center ${labelNoClick}`}
                                    >
                                      Reservado por:
                                    </Badge>
                                  }
                                  dateText={dateText}
                                  dateClassName="text-white"
                                  right={
                                    <div className="flex items-center gap-1">
                                      <MoneyChip
                                        mode="green"
                                        showUpIcon
                                        amountText={`${(alert.price ?? 0).toFixed(2)}€`}
                                      />
                                      <Button
                                        size="icon"
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                        onClick={() => {
                                          hideKey(cardKey);
                                          cancelAlertMutation.mutate(alert.id);
                                        }}
                                        disabled={cancelAlertMutation.isPending}
                                      >
                                        <X className="w-4 h-4" strokeWidth={3} />
                                      </Button>
                                    </div>
                                  }
                                />

                                <div className="border-t border-gray-700/80 mb-2" />

                                {alert.reserved_by_name && (
                                  <div className="mb-1.5 h-[220px]">
                                    <UserCard
                                      userName={alert.reserved_by_name}
                                      userPhoto={null}
                                      carBrand={alert.reserved_by_car?.split(' ')[0] || 'Sin'}
                                      carModel={alert.reserved_by_car?.split(' ')[1] || 'datos'}
                                      carColor={alert.reserved_by_car?.split(' ').pop() || 'gris'}
                                      carPlate={alert.reserved_by_plate}
                                      vehicleType={alert.reserved_by_vehicle_type}
                                      address={formatAddress(alert.address)}
                                      availableInMinutes={alert.available_in_minutes}
                                      price={alert.price}
                                      showLocationInfo={false}
                                      showContactButtons={true}
                                      onChat={() =>
                                        (window.location.href = createPageUrl(
                                          `Chat?alertId=${alert.id}&userId=${alert.reserved_by_email || alert.reserved_by_id}`
                                        ))
                                      }
                                      onCall={() =>
                                        alert.phone && (window.location.href = `tel:${alert.phone}`)
                                      }
                                      latitude={alert.latitude}
                                      longitude={alert.longitude}
                                      allowPhoneCalls={alert.allow_phone_calls}
                                      isReserved={true}
                                    />
                                  </div>
                                )}

                                <div className="flex items-start gap-1.5 text-xs mb-2">
                                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-gray-400 leading-5">
                                    {formatAddress(alert.address) || 'Ubicación marcada'}
                                  </span>
                                </div>

                                <div className="flex items-start gap-1.5 text-xs">
                                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-white leading-5">
                                    Te vas en {alert.available_in_minutes} min ·{' '}
                                  </span>
                                  <span className="text-purple-400 leading-5">
                                    Debes esperar hasta las {waitUntilLabel}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <CountdownButton text={countdownText} dimmed={false} />
                                </div>
                              </>
                            ) : (
                              <>
                                <CardHeaderRow
                                  left={
                                    <Badge
                                      className={`bg-green-500/20 text-green-400 border border-green-500/30 ${labelNoClick}`}
                                    >
                                      Activa
                                    </Badge>
                                  }
                                  dateText={dateText}
                                  dateClassName="text-white"
                                  right={
                                    <div className="flex items-center gap-1">
                                      <MoneyChip mode="neutral" amountText={`${(alert.price ?? 0).toFixed(2)}€`} />
                                      <Button
                                        size="icon"
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                        onClick={() => {
                                          hideKey(cardKey);
                                          cancelAlertMutation.mutate(alert.id);
                                        }}
                                        disabled={cancelAlertMutation.isPending}
                                      >
                                        <X className="w-4 h-4" strokeWidth={3} />
                                      </Button>
                                    </div>
                                  }
                                />

                                <div className="border-t border-gray-700/80 mb-2" />

                                <div className="flex items-start gap-1.5 text-xs mb-2">
                                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-white leading-5">
                                    {formatAddress(alert.address) || 'Ubicación marcada'}
                                  </span>
                                </div>

                                <div className="flex items-start gap-1.5 text-xs">
                                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-white leading-5">
                                    Te vas en {alert.available_in_minutes} min ·{' '}
                                  </span>
                                  <span className="text-purple-400 leading-5">
                                    Debes esperar hasta las: {waitUntilLabel}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <CountdownButton text={countdownText} dimmed={false} />
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })
                      .slice(0, 1)}
                  </div>
                )}

                <div className="pt-2">
                  <SectionTag variant="red" text="Finalizadas" />
                </div>

                {myFinalizedAll.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes alertas finalizadas</p>
                  </div>
                ) : (
                  <div className="space-y-[20px]">
                    {myFinalizedAll.map((item, index) => {
                      const finalizedCardClass =
                        'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';
                      const key = item.id;
                      if (hiddenKeys.has(key)) return null;

                      if (item.type === 'alert') {
                        const a = item.data;
                        const ts = toMs(a.created_date);
                        const dateText = ts ? formatCardDate(ts) : '--';

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={finalizedCardClass}
                          >
                            <CardHeaderRow
                              left={
                                <Badge
                                  className={`bg-red-500/20 text-red-400 border border-red-500/30 ${labelNoClick}`}
                                >
                                  Finalizada
                                </Badge>
                              }
                              dateText={dateText}
                              dateClassName="text-gray-600"
                              right={
                                <div className="flex items-center gap-1">
                                  <MoneyChip
                                    mode="neutral"
                                    amountText={`${((a.price ?? 0) * 1).toFixed(2)}€`}
                                  />
                                  <Button
                                    size="icon"
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                    onClick={async () => {
                                      hideKey(key);
                                      await deleteAlertSafe(a.id);
                                      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                                    }}
                                  >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                  </Button>
                                </div>
                              }
                            />

                            <div className="border-t border-gray-700/80 mb-2" />

                            <MarcoContent
                              photoUrl={a.user_photo}
                              name={a.user_name}
                              carLabel={`${a.car_brand || ''} ${a.car_model || ''}`.trim() || 'Sin datos'}
                              plate={a.car_plate}
                              carColor={a.car_color}
                              address={a.address}
                              timeLine={`Transacción finalizada · ${
                                ts
                                  ? new Date(ts).toLocaleString('es-ES', {
                                      timeZone: 'Europe/Madrid',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    })
                                  : '--:--'
                              }`}
                              onChat={() =>
                                (window.location.href = createPageUrl(
                                  `Chat?alertId=${a.id}&userId=${a.user_email || a.user_id}`
                                ))
                              }
                              statusText={statusLabelFrom(a.status)}
                              phoneEnabled={Boolean(a.phone && a.allow_phone_calls !== false)}
                              onCall={() =>
                                a.phone && (window.location.href = `tel:${a.phone}`)
                              }
                              statusEnabled={String(a.status || '').toLowerCase() === 'completed'}
                            />
                          </motion.div>
                        );
                      }

                      const tx = item.data;
                      const ts = toMs(tx.created_date);
                      const dateText = ts ? formatCardDate(ts) : '--';

                      const sellerName = tx.seller_name || 'Usuario';
                      const sellerPhoto = tx.seller_photo_url || tx.sellerPhotoUrl || '';
                      const sellerCarLabel =
                        tx.seller_car ||
                        tx.sellerCar ||
                        `${tx.seller_car_brand || ''} ${tx.seller_car_model || ''}`.trim();
                      const sellerPlate =
                        tx.seller_plate ||
                        tx.sellerPlate ||
                        tx.seller_car_plate ||
                        tx.sellerCarPlate ||
                        tx.car_plate ||
                        tx.carPlate ||
                        '';
                      const sellerColor =
                        tx.seller_car_color || tx.sellerCarColor || tx.car_color || tx.carColor || '';

                      const txPaid = String(tx.status || '').toLowerCase() === 'completed';

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={finalizedCardClass}
                        >
                          <CardHeaderRow
                            left={
                              <Badge
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 ${labelNoClick}`}
                              >
                                Finalizada
                              </Badge>
                            }
                            dateText={dateText}
                            dateClassName="text-gray-600"
                            right={
                              <div className="flex items-center gap-1">
                                {txPaid ? (
                                  <MoneyChip
                                    mode="red"
                                    showDownIcon
                                    amountText={`${(tx.amount ?? 0).toFixed(2)}€`}
                                  />
                                ) : (
                                  <MoneyChip mode="neutral" amountText={`${(tx.amount ?? 0).toFixed(2)}€`} />
                                )}

                                <Button
                                  size="icon"
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                  onClick={() => hideKey(key)}
                                >
                                  <X className="w-4 h-4" strokeWidth={3} />
                                </Button>
                              </div>
                            }
                          />

                          <div className="border-t border-gray-700/80 mb-2" />

                          <MarcoContent
                            photoUrl={sellerPhoto}
                            name={sellerName}
                            carLabel={sellerCarLabel || 'Sin datos'}
                            plate={sellerPlate}
                            carColor={sellerColor}
                            address={tx.address}
                            timeLine={`Transacción completada · ${
                              ts
                                ? new Date(ts).toLocaleString('es-ES', {
                                    timeZone: 'Europe/Madrid',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })
                                : '--:--'
                            }`}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`
                              ))
                            }
                            statusText="COMPLETADA"
                            statusEnabled={true}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ===================== TUS RESERVAS ===================== */}
          <TabsContent
            value="reservations"
            className={`space-y-1.5 pb-24 max-h-[calc(100vh-126px)] overflow-y-auto pr-0 ${noScrollBar}`}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                <SectionTag variant="green" text="Activas" />

                {reservationsActiveAll.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
                    <div className="h-[110px] flex items-center justify-center">
                      <p className="text-gray-500 font-semibold">No tienes reservas</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-[20px]">
                    {reservationsActiveAll.map((alert, index) => {
                      const createdTs = getCreatedTs(alert) || nowTs;
                      const waitUntilTs = getWaitUntilTs(alert);
                      const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;

                      const remainingMs = hasExpiry ? Math.max(0, waitUntilTs - nowTs) : null;
                      const waitUntilLabel = hasExpiry
                        ? new Date(waitUntilTs).toLocaleString('es-ES', {
                            timeZone: 'Europe/Madrid',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })
                        : '--:--';

                      const countdownText =
                        remainingMs === null ? '--:--' : remainingMs > 0 ? formatRemaining(remainingMs) : 'Reserva finalizada';

                      const key = `res-active-${alert.id}`;
                      if (hiddenKeys.has(key)) return null;

                      const isMock = String(alert.id).startsWith('mock-');

                      if (alert.status === 'reserved' && hasExpiry && remainingMs !== null && remainingMs <= 0) {
                        if (!isMock) {
                          if (!autoFinalizedReservationsRef.current.has(alert.id)) {
                            autoFinalizedReservationsRef.current.add(alert.id);
                            base44.entities.ParkingAlert
                              .update(alert.id, { status: 'expired' })
                              .finally(() => {
                                queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                              });
                          }
                        }
                        return null;
                      }

                      const carLabel = `${alert.car_brand || ''} ${alert.car_model || ''}`.trim();
                      const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls !== false);
                      const dateText = formatCardDate(createdTs);

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                        >
                          <CardHeaderRow
                            left={
                              <Badge className={`bg-purple-500/20 text-purple-300 border border-purple-400/50 ${labelNoClick}`}>
                                Reservada
                              </Badge>
                            }
                            dateText={dateText}
                            dateClassName="text-white"
                            right={
                              <MoneyChip
                                mode="red"
                                showDownIcon
                                amountText={`${(alert.price ?? 0).toFixed(2)}€`}
                              />
                            }
                          />

                          <div className="border-t border-gray-700/80 mb-2" />

                          <MarcoContent
                            photoUrl={alert.user_photo}
                            name={alert.user_name}
                            carLabel={carLabel || 'Sin datos'}
                            plate={alert.car_plate}
                            carColor={alert.car_color}
                            address={alert.address}
                            timeLine={`Se va en ${alert.available_in_minutes ?? '--'} min · Te espera hasta las ${waitUntilLabel}`}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${alert.id}&userId=${alert.user_email || alert.user_id}`
                              ))
                            }
                            statusText={countdownText}
                            phoneEnabled={phoneEnabled}
                            onCall={() => phoneEnabled && (window.location.href = `tel:${alert.phone}`)}
                            statusEnabled={false}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2">
                  <SectionTag variant="red" text="Finalizadas" />
                </div>

                {reservationsFinalAll.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes reservas finalizadas</p>
                  </div>
                ) : (
                  <div className="space-y-[20px]">
                    {reservationsFinalAll.map((item, index) => {
                      const key = item.id;
                      if (hiddenKeys.has(key)) return null;

                      const finalizedCardClass =
                        'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';

                      if (item.type === 'alert') {
                        const a = item.data;
                        const ts = toMs(a.created_date) || nowTs;
                        const dateText = ts ? formatCardDate(ts) : '--';

                        const waitUntilTs = getWaitUntilTs(a);
                        const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > ts;
                        const waitUntilLabel = hasExpiry
                          ? new Date(waitUntilTs).toLocaleString('es-ES', {
                              timeZone: 'Europe/Madrid',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                          : '--:--';

                        const carLabel = `${a.car_brand || ''} ${a.car_model || ''}`.trim();
                        const phoneEnabled = Boolean(a.phone && a.allow_phone_calls !== false);
                        const mode = reservationMoneyModeFromStatus(a.status);

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={finalizedCardClass}
                          >
                            <CardHeaderRow
                              left={
                                <Badge
                                  className={`bg-red-500/20 text-red-400 border border-red-500/30 ${labelNoClick}`}
                                >
                                  Finalizada
                                </Badge>
                              }
                              dateText={dateText}
                              dateClassName="text-gray-600"
                              right={
                                <div className="flex items-center gap-1">
                                  {mode === 'paid' ? (
                                    <MoneyChip
                                      mode="red"
                                      showDownIcon
                                      amountText={`${(a.price ?? 0).toFixed(2)}€`}
                                    />
                                  ) : (
                                    <MoneyChip mode="neutral" amountText={`${(a.price ?? 0).toFixed(2)}€`} />
                                  )}

                                  <Button
                                    size="icon"
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                    onClick={async () => {
                                      hideKey(key);
                                      const isMock = String(a.id).startsWith('mock-');
                                      if (!isMock) {
                                        await deleteAlertSafe(a.id);
                                        queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                                      }
                                    }}
                                  >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                  </Button>
                                </div>
                              }
                            />

                            <div className="border-t border-gray-700/80 mb-2" />

                            <MarcoContent
                              photoUrl={a.user_photo}
                              name={a.user_name}
                              carLabel={carLabel || 'Sin datos'}
                              plate={a.car_plate}
                              carColor={a.car_color}
                              address={a.address}
                              timeLine={`Se iba en ${a.available_in_minutes ?? '--'} min · Te esperaba hasta las ${waitUntilLabel}`}
                              onChat={() =>
                                (window.location.href = createPageUrl(
                                  `Chat?alertId=${a.id}&userId=${a.user_email || a.user_id}`
                                ))
                              }
                              statusText={statusLabelFrom(a.status)}
                              phoneEnabled={phoneEnabled}
                              onCall={() => phoneEnabled && (window.location.href = `tel:${a.phone}`)}
                              statusEnabled={String(a.status || '').toLowerCase() === 'completed'}
                            />
                          </motion.div>
                        );
                      }

                      const tx = item.data;
                      const ts = toMs(tx.created_date);
                      const dateText = ts ? formatCardDate(ts) : '--';

                      const sellerName = tx.seller_name || 'Usuario';
                      const sellerPhoto = tx.seller_photo_url || tx.sellerPhotoUrl || '';
                      const sellerCarLabel =
                        tx.seller_car ||
                        tx.sellerCar ||
                        `${tx.seller_car_brand || ''} ${tx.seller_car_model || ''}`.trim();
                      const sellerPlate =
                        tx.seller_plate ||
                        tx.sellerPlate ||
                        tx.seller_car_plate ||
                        tx.sellerCarPlate ||
                        tx.car_plate ||
                        tx.carPlate ||
                        '';
                      const sellerColor =
                        tx.seller_car_color || tx.sellerCarColor || tx.car_color || tx.carColor || '';

                      const txPaid = String(tx.status || '').toLowerCase() === 'completed';

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={finalizedCardClass}
                        >
                          <CardHeaderRow
                            left={
                              <Badge
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 ${labelNoClick}`}
                              >
                                Finalizada
                              </Badge>
                            }
                            dateText={dateText}
                            dateClassName="text-gray-600"
                            right={
                              <div className="flex items-center gap-1">
                                {txPaid ? (
                                  <MoneyChip
                                    mode="red"
                                    showDownIcon
                                    amountText={`${(tx.amount ?? 0).toFixed(2)}€`}
                                  />
                                ) : (
                                  <MoneyChip mode="neutral" amountText={`${(tx.amount ?? 0).toFixed(2)}€`} />
                                )}

                                <Button
                                  size="icon"
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                  onClick={() => hideKey(key)}
                                >
                                  <X className="w-4 h-4" strokeWidth={3} />
                                </Button>
                              </div>
                            }
                          />

                          <div className="border-t border-gray-700/80 mb-2" />

                          <MarcoContent
                            photoUrl={sellerPhoto}
                            name={sellerName}
                            carLabel={sellerCarLabel || 'Sin datos'}
                            plate={sellerPlate}
                            carColor={sellerColor}
                            address={tx.address}
                            timeLine={`Transacción completada · ${
                              ts
                                ? new Date(ts).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })
                                : '--:--'
                            }`}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`
                              ))
                            }
                            statusText="COMPLETADA"
                            statusEnabled={true}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}

      <script>
        {`if (window.location.hash === '#refresh') { window.location.hash = ''; window.location.reload(); }`}
      </script>
    </div>
  );
}