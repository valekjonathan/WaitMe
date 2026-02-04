import { useState, useEffect, useRef, useMemo } from 'react';
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
import ReservationRequestModal from '@/components/ReservationRequestModal';

export default function History() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [processingNotification, setProcessingNotification] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user?.id && !user?.email) return;

    const unsubAlerts = base44.entities.ParkingAlert.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    });

    const unsubNotifications = base44.entities.Notification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['pendingReservationNotifications'] });
    });

    return () => {
      unsubAlerts?.();
      unsubNotifications?.();
    };
  }, [user?.id, user?.email, queryClient]);

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

  // ====== Fecha: "2 Feb. - 00:28" en hora de Madrid ======
  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const date = new Date(ts);
    const madridDateStr = date.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const formatted = madridDateStr
      .replace(' de ', ' ')
      .replace(',', ' -')
      .replace(/\./g, '.');

    return formatted;
  };

  // ====== Dirección formato ======
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

  // ====== Colores coche ======
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
      return v > 1e12 ? v : v * 1000;
    }

    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;

      if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) {
        const t = new Date(s).getTime();
        return Number.isNaN(t) ? null : t;
      }

      const t = new Date(s + ':00').getTime();
      return Number.isNaN(t) ? null : t;
    }

    return null;
  };

  const createdFallbackRef = useRef(new Map());
  const getCreatedTs = (alert) => {
    if (!alert?.id) return Date.now();

    const key = `alert-created-${alert.id}`;

    const stored = localStorage.getItem(key);
    if (stored) return Number(stored);

    const candidates = [
      alert?.created_date,
      alert?.created_at,
      alert?.createdAt,
      alert?.created,
      alert?.updated_date
    ];

    for (const v of candidates) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) {
        localStorage.setItem(key, String(t));
        return t;
      }
    }

    const now = Date.now();
    localStorage.setItem(key, String(now));
    return now;
  };

  const getWaitUntilTs = (alert) => {
    const created = getCreatedTs(alert);
    const mins = Number(alert?.available_in_minutes);

    if (
      typeof created === 'number' &&
      created > 0 &&
      Number.isFinite(mins) &&
      mins > 0
    ) {
      return created + mins * 60 * 1000;
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

  // ====== Countdown button ======
  const CountdownButton = ({ text, dimmed = false }) => (
    <div
      className={[
        'w-full h-9 rounded-lg border-2 flex items-center justify-center px-3',
        dimmed
          ? 'border-purple-500/30 bg-purple-600/10'
          : 'border-purple-400/70 bg-purple-600/25'
      ].join(' ')}
    >
      <span className={`text-sm font-mono font-extrabold ${dimmed ? 'text-gray-400/70' : 'text-purple-100'}`}>
        {text}
      </span>
    </div>
  );

  const SectionTag = ({ variant, text }) => {
    const cls =
      variant === 'green'
        ? 'bg-green-500/20 border-green-500/30 text-green-400'
        : 'bg-red-500/20 border-red-500/30 text-red-400';
    return (
      <div className="w-full flex justify-center pt-0">
        <div
          className={`${cls} border rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs text-center cursor-default select-none`}
        >
          {text}
        </div>
      </div>
    );
  };

  const CardHeaderRow = ({ left, dateText, dateClassName, right }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-shrink-0">{left}</div>
      <div className={`flex-1 text-center text-xs ${dateClassName || ''}`}>{dateText}</div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
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

    const photoCls = bright
      ? 'w-full h-full object-cover'
      : 'w-full h-full object-cover opacity-40 grayscale';

    const nameCls = bright
      ? 'font-bold text-xl text-white leading-none min-h-[22px]'
      : 'font-bold text-xl text-gray-300 leading-none opacity-70 min-h-[22px]';

    const carCls = bright
      ? 'text-sm font-medium text-gray-200 leading-none flex-1 flex items-center truncate relative top-[6px]'
      : 'text-sm font-medium text-gray-400 leading-none opacity-70 flex-1 flex items-center truncate relative top-[6px]';

    const plateWrapCls = bright ? 'flex-shrink-0' : 'opacity-45 flex-shrink-0';
    const carIconWrapCls = bright
      ? 'flex-shrink-0 relative -top-[1px]'
      : 'opacity-45 flex-shrink-0 relative -top-[1px]';

    const lineTextCls = bright ? 'text-gray-200 leading-5' : 'text-gray-300 leading-5';

    const isTimeObj =
      timeLine && typeof timeLine === 'object' && !Array.isArray(timeLine) && 'main' in timeLine;

    const statusBoxCls = statusOn
      ? isCountdownLike
        ? 'border-purple-400/70 bg-purple-600/25'
        : 'border-purple-500/30 bg-purple-600/10'
      : 'border-gray-700 bg-gray-800/60';

    const statusTextCls = statusOn
      ? isCountdownLike
        ? 'text-purple-100'
        : isDimStatus
        ? 'text-gray-400/70'
        : 'text-purple-300'
      : 'text-gray-400 opacity-70';

    return (
      <>
        <div className="flex gap-2.5">
          <div
            className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${
              bright ? 'border-purple-500/40 bg-gray-900' : 'border-gray-600/70 bg-gray-800/30'
            }`}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={name} className={photoCls} />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-3xl ${
                  bright ? 'text-gray-300' : 'text-gray-600 opacity-40'
                }`}
              >
                👤
              </div>
            )}
          </div>

          <div className="flex-1 h-[85px] flex flex-col">
            <p className={nameCls}>{(name || '').split(' ')[0] || 'Usuario'}</p>
            <p className={carCls}>{carLabel || 'Sin datos'}</p>

            <div className="flex items-end gap-2 mt-1 min-h-[28px]">
              <div className={plateWrapCls}>
                <PlateProfile plate={plate} />
              </div>

              <div className="flex-1 flex justify-center">
                <div className={carIconWrapCls}>
                  <CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-1.5 border-t border-gray-700/80 mt-2">
          <div className={bright ? 'space-y-1.5' : 'space-y-1.5 opacity-80'}>
            {address ? (
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className={lineTextCls + ' line-clamp-1'}>{formatAddress(address)}</span>
              </div>
            ) : null}

            {timeLine ? (
              <div className="flex items-start gap-1.5 text-xs">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                {isTimeObj ? (
                  <span className={lineTextCls}>
                    {timeLine.main}{' '}
                    <span className={bright ? 'text-purple-400' : lineTextCls}>{timeLine.accent}</span>
                  </span>
                ) : (
                  <span className={lineTextCls}>{timeLine}</span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex gap-2">
            <Button
              size="icon"
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
              onClick={onChat}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>

            {phoneEnabled ? (
              <Button
                size="icon"
                className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
                onClick={onCall}
              >
                <Phone className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed"
                disabled
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </Button>
            )}

            <div className="flex-1">
              <div
                className={`w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 ${statusBoxCls}`}
              >
                <span className={`text-sm font-mono font-extrabold ${statusTextCls}`}>
                  {statusText}
                </span>
              </div>
            </div>

            {priceChip ? <div className="hidden">{priceChip}</div> : null}
          </div>
        </div>
      </>
    );
  };
    // ====== Ocultar tarjetas al borrar (UI) ======
  const [hiddenKeys, setHiddenKeys] = useState(() => new Set());
  const isHidden = (key) => hiddenKeys.has(key);
  const hideKey = (key) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const deleteAlertSafe = async (id) => {
    try {
      await base44.entities.ParkingAlert.delete(id);
    } catch (e) {}
  };

  // ====== Effects ======
  const autoFinalizedRef = useRef(new Set());
  const autoFinalizedReservationsRef = useRef(new Set());

  const {
    data: myAlerts = [],
    isLoading: loadingAlerts
  } = useQuery({
    queryKey: ['myAlerts', user?.id, user?.email],
    enabled: !!user?.id || !!user?.email,
    staleTime: 5000,
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await base44.entities.ParkingAlert.list();
      const list = Array.isArray(res) ? res : (res?.data || []);

      return list.filter((a) => {
        if (!a) return false;
        if (user?.id && (a.user_id === user.id || a.created_by === user.id)) return true;
        if (user?.email && a.user_email === user.email) return true;
        return false;
      });
    }
  });



  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <Header title="Alertas" showBackButton={true} backTo="Home" />

      <main className="pt-[56px] pb-20 px-4 overflow-hidden">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="sticky top-[56px] z-40 bg-black pt-4 pb-1">
            <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0">
              <TabsTrigger
                value="alerts"
                className="flex-1 text-white data-[state=active]:bg-purple-600"
              >
                Tus alertas
              </TabsTrigger>
              <TabsTrigger
                value="reservations"
                className="flex-1 text-white data-[state=active]:bg-purple-600"
              >
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="alerts"
            className={`space-y-1.5 pb-24 max-h-[calc(100dvh-126px)] overflow-y-auto ${noScrollBar}`}
          >
            {loadingAlerts ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <SectionTag variant="green" text="Activas" />
            )}
          </TabsContent>

          <TabsContent
            value="reservations"
            className={`space-y-1.5 pb-24 max-h-[calc(100dvh-126px)] overflow-y-auto ${noScrollBar}`}
          >
            <SectionTag variant="green" text="Activas" />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {myAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker
            key={alert.id}
            alertId={alert.id}
            userLocation={userLocation}
          />
        ))}

      <ReservationRequestModal
        notification={null}
        onAccept={() => {}}
        onReject={() => {}}
        isProcessing={false}
      />
    </div>
  );
}