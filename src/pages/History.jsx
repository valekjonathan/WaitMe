import { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  Euro,
  TrendingUp,
  TrendingDown,
  Loader,
  X,
  MessageCircle,
  PhoneOff,
  Phone,
  Navigation
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
const _unusedLoader = Loader;
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useAuth } from '@/lib/AuthContext';
import { isDemoMode, startDemoFlow, subscribeDemoFlow, getDemoAlerts } from '@/components/DemoFlowManager';
import HistorySellerView from './HistorySellerView';
import HistoryBuyerView from './HistoryBuyerView';
import { toMs, getActiveSellerAlerts, getBestFinalizedTs } from '@/lib/alertSelectors';
import { useMyAlerts } from '@/hooks/useMyAlerts';

const getCarFillThinking = (color) => {
  const map = { blanco:'#ffffff',negro:'#1a1a1a',gris:'#9ca3af',plata:'#d1d5db',rojo:'#ef4444',azul:'#3b82f6',verde:'#22c55e',amarillo:'#eab308',naranja:'#f97316',morado:'#7c3aed',rosa:'#ec4899',beige:'#d4b483' };
  return map[String(color||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')] || '#9ca3af';
};

// toMs is imported from @/lib/alertSelectors

export default function Alertas() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [demoTick, setDemoTick] = useState(0);

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelConfirmAlert, setCancelConfirmAlert] = useState(null);
  const [expirePromptOpen, setExpirePromptOpen] = useState(false);
  const [expirePromptAlert, setExpirePromptAlert] = useState(null);
  const [cancelReservedOpen, setCancelReservedOpen] = useState(false);
  const [cancelReservedAlert, setCancelReservedAlert] = useState(null);

  // "Me lo pienso" requests shown in Activas
  const [thinkingRequests, setThinkingRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('waitme:thinking_requests') || '[]'); } catch { return []; }
  });
  // Rejected requests shown in Finalizadas
  const [rejectedRequests, setRejectedRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const reload = () => {
      try { setThinkingRequests(JSON.parse(localStorage.getItem('waitme:thinking_requests') || '[]')); } catch {}
    };
    window.addEventListener('waitme:thinkingUpdated', reload);
    return () => window.removeEventListener('waitme:thinkingUpdated', reload);
  }, []);

  useEffect(() => {
    const reload = () => {
      try { setRejectedRequests(JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]')); } catch {}
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

useEffect(() => {
  if (!isDemoMode()) return;
  startDemoFlow();
  const unsub = subscribeDemoFlow(() => setDemoTick((t) => t + 1));
  return () => unsub?.();
}, []);


const queryClient = useQueryClient();

  // ====== UI helpers ======
  const labelNoClick = 'cursor-default select-none pointer-events-none';
  const noScrollBar =
    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  // ====== Fotos fijas (NO rotan) ======
  const fixedAvatars = {
    Sofía: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
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
  const formatPriceInt = (v) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return '0 €';
    return `${Math.trunc(n)} €`;
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
  const createdFallbackRef = useRef(new Map());
const getCreatedTs = (alert) => {
  if (!alert?.id) return Date.now();

  const key = `alert-created-${alert.id}`;

  // 0) Cache en memoria (evita leer localStorage en cada render)
  const cached = createdFallbackRef.current.get(key);
  if (typeof cached === 'number' && cached > 0) return cached;

  // 1) Si ya existe en localStorage, usarlo SIEMPRE
  const stored = localStorage.getItem(key);
  if (stored) {
    const t = Number(stored);
    if (Number.isFinite(t) && t > 0) {
      createdFallbackRef.current.set(key, t);
      return t;
    }
  }

  // 2) Guardar SOLO la primera vez
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
      createdFallbackRef.current.set(key, t);
      return t;
    }
  }

  // 3) Último fallback (una sola vez)
  const now = Date.now();
  localStorage.setItem(key, String(now));
  createdFallbackRef.current.set(key, now);
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
      <span className={`text-sm font-mono font-extrabold ${dimmed ? 'text-gray-400/70' : 'text-purple-100'}`}>
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
      <div className={`flex-1 text-center text-xs whitespace-nowrap ${dateClassName || ''}`}>{dateText}</div>
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
    bright = false,
    dimIcons = false
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
              <img src={photoUrl} alt={name} className={photoCls} loading="eager" decoding="sync" />
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
                <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dimIcons ? 'text-gray-500' : 'text-purple-400'}`} />
                <span className={lineTextCls + ' line-clamp-1'}>{formatAddress(address)}</span>
              </div>
            ) : null}

            {timeLine ? (
              <div className="flex items-start gap-1.5 text-xs">
                <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dimIcons ? 'text-gray-500' : 'text-purple-400'}`} />
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
          <div className="flex justify-between gap-2">
            <Button
              size="icon"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg h-8"
              onClick={onChat}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>

            {phoneEnabled ? (
              <Button
                size="icon"
                className="flex-1 bg-white hover:bg-gray-200 text-black rounded-lg h-8"
                onClick={onCall}
              >
                <Phone className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="flex-1 border-white/30 bg-white/10 text-white rounded-lg h-8 opacity-70 cursor-not-allowed"
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

  // ====== Ocultar tarjetas al borrar (UI) — persistido en localStorage ======
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
    } catch {}
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
} = useMyAlerts();

const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
  queryKey: ['myTransactions', user?.email],
  enabled: !!user?.email,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchInterval: false,
  placeholderData: (prev) => prev,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  queryFn: async () => {
    try {
      const allTx = await base44.entities.Transaction.list('-created_date', 5000);
      const email = user?.email;
      if (!email) return [];
      return (allTx || []).filter((t) => t?.buyer_email === email || t?.seller_email === email || t?.user_email === email);
    } catch {
      return [];
    }
  }
});
const mockReservationsFinal = useMemo(() => {
    return [];
  }, [user?.id]);

  const mockTransactions = useMemo(() => {
  return [];
}, [user?.id]);

 



const myActiveAlerts = useMemo(
  () => getActiveSellerAlerts(myAlerts, user?.id, user?.email),
  [myAlerts, user?.id, user?.email]
);



const visibleActiveAlerts = useMemo(() => {
  return myActiveAlerts.filter((a) => !hiddenKeys.has(`active-${a.id}`));
}, [myActiveAlerts, hiddenKeys]);

  // ====== Auto-expirar alertas activas cuando el contador llega a 0. Tarjetas CANCELADA/EXPIRADA no se tocan. ======
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
        (uid && (a.user_id === uid || a.created_by === uid)) ||
        (email && a.user_email === email);
      return isMine;
    });

    if (mine && !expirePromptOpen) {
      setExpirePromptAlert(mine);
      setExpirePromptOpen(true);
    }

    const others = toExpire.filter((a) => !mine || a.id !== mine.id);

    Promise.all(
      others.map((a) =>
        base44.entities.ParkingAlert.update(a.id, { status: 'expired' }).catch(() => null)
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

    return ['cancelled', 'completed', 'expired'].includes(
      String(a.status || '').toLowerCase()
    );
  });
  
  // Ordenar: primero las finalizadas (más recientes). Usa updated_at/completed_at/cancelled_at/created_at
  return finalized.sort((a, b) => getBestFinalizedTs(b) - getBestFinalizedTs(a));
}, [myAlerts, user?.id, user?.email]);
    
  // Reservas (tuyas como comprador)
  const myReservationsReal = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.reserved_by_id !== user?.id) return false;
      if (a.status !== 'reserved') return false;

      return true;
    });
  }, [myAlerts, user?.id]);
  const reservationsActiveAll = myReservationsReal;

  // ====== Auto-expirar reservas activas cuando el contador llega a 0. CANCELADA/EXPIRADA estáticas. ======
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
        base44.entities.ParkingAlert.update(a.id, { status: 'expired' }).catch(() => null)
      )
    ).finally(() => {
      queryClient.setQueryData(['myAlerts'], (prev = []) =>
        prev.map((a) => (toExpire.some((o) => o.id === a.id) ? { ...a, status: 'expired' } : a))
      );
    });
  }, [nowTs, reservationsActiveAll, queryClient]);


  const myFinalizedAsSellerTx = useMemo(() => [
    ...transactions.filter((t) => t.seller_id === user?.id),
    ...mockTransactions
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)),
  [transactions, user?.id, mockTransactions]);

  const myFinalizedAll = useMemo(() => [
    ...myFinalizedAlerts.map((a) => ({
      type: 'alert',
      id: `final-alert-${a.id}`,
      created_date: getBestFinalizedTs(a),
      data: a
    })),
    ...myFinalizedAsSellerTx.map((t) => ({
      type: 'transaction',
      id: `final-tx-${t.id}`,
      created_date: getBestFinalizedTs(t),
      data: t
    }))
  ].sort((a, b) => getBestFinalizedTs(b.data) - getBestFinalizedTs(a.data)),
  [myFinalizedAlerts, myFinalizedAsSellerTx]);


  const renderableFinalized = useMemo(() => {
    return myFinalizedAll
      .filter((item) => !hiddenKeys.has(item.id));
  }, [myFinalizedAll, hiddenKeys]);

 
    

  const reservationsFinalAllBase = [
  ...myAlerts
    .filter((a) => a.reserved_by_id === user?.id && a.status !== 'reserved')
    .map((a) => ({
      type: 'alert',
      id: `res-final-alert-${a.id}`,
      created_date: a.created_date,
      data: a
    })),
  ...transactions
    .filter((t) => t.buyer_id === user?.id)
    .map((t) => ({
      type: 'transaction',
      id: `res-final-tx-${t.id}`,
      created_date: t.created_date,
      data: t
    })),
  ...mockReservationsFinal.map((a) => ({
    type: 'alert',
    id: `res-final-mock-${a.id}`,
    created_date: a.created_date,
    data: a
  }))
];
  const reservationsFinalAll = reservationsFinalAllBase.sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  const isLoading = loadingAlerts || loadingTransactions;

  // ====== Mutations ======
  const cancelAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      // Cancela la alerta seleccionada
      await base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });

      // Si por cualquier motivo tienes varias activas, cancelarlas también
      // (evita que "aparezca otra" automáticamente al cancelar una).
      try {
        const uid = user?.id;
        const email = user?.email;

        let all = [];
        if (uid) {
          all = await base44.entities.ParkingAlert.filter({ user_id: uid });
        } else if (email) {
          all = await base44.entities.ParkingAlert.filter({ user_email: email });
        }

        const mine = (all || []).filter((a) => {
          if (!a) return false;
          const isMine =
            (uid && (a.user_id === uid || a.created_by === uid)) ||
            (email && a.user_email === email);
          if (!isMine) return false;
          const st = String(a.status || '').toLowerCase();
          return st === 'active';
        });

        await Promise.all(
          mine
            .filter((a) => a.id && a.id !== alertId)
            .map((a) => base44.entities.ParkingAlert.update(a.id, { status: 'cancelled' }).catch(() => null))
        );
      } catch {}
    },
  onMutate: async (alertId) => {
      // Quitar la activa y la bolita EN EL MISMO INSTANTE
      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map((a) => (a?.id === alertId ? { ...a, status: 'cancelled', updated_date: new Date().toISOString() } : a));
      });

      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    },
    onSuccess: () => {
      // Sin invalidate: el cache ya está actualizado en onMutate
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    }
  });

  const expireAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.entities.ParkingAlert.update(alertId, { status: 'expired' });
    },
    onMutate: async (alertId) => {
      // Marcar como expirada en cache (badge se recalcula desde myAlerts)
      queryClient.setQueryData(['myAlerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map((a) => (a?.id === alertId ? { ...a, status: 'expired' } : a));
      });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    },
    onSuccess: () => {
      // Sin invalidate: el cache ya está actualizado en onMutate
    }
  });


  const repeatAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (!alert) return null;

      // 1) Marca la actual como expirada
      await base44.entities.ParkingAlert.update(alert.id, { status: 'expired' });

      // 2) Crea una nueva con la misma configuración (sin reserva)
      const now = Date.now();
      const minutes = Number(alert.available_in_minutes || 0);
      const futureTime = new Date(now + minutes * 60 * 1000);

      const payload = {
        user_id: alert.user_id,
        user_email: alert.user_email,
        user_name: alert.user_name,
        user_photo: alert.user_photo,
        latitude: alert.latitude,
        longitude: alert.longitude,
        address: alert.address,
        price: alert.price,
        available_in_minutes: minutes,
        car_brand: alert.car_brand || '',
        car_model: alert.car_model || '',
        car_color: alert.car_color || '',
        car_plate: alert.car_plate || '',
        phone: alert.phone || null,
        allow_phone_calls: !!alert.allow_phone_calls,
        wait_until: futureTime.toISOString(),
        created_from: 'parked_here',
        status: 'active',
        reserved_by_id: null,
        reserved_by_name: null,
        reserved_by_email: null
      };

      return base44.entities.ParkingAlert.create(payload);
    },
    onSuccess: () => {
      // Sin invalidate: el cache ya está actualizado en onMutate
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    }
  });


  // ====== Estado de prórroga cuando expira (para tarjetas "reservado por:") ======
  const [expiredAlertExtend, setExpiredAlertExtend] = useState({});
  const [expiredAlertModalId, setExpiredAlertModalId] = useState(null);
  // expiredAlertExtend[alertId] = true si ha expirado y aún no ha elegido

  // Detectar alertas reservadas cuyo countdown llegó a 0
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

  // ====== Bloque de expiración (debajo de botones) ======
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
            { mins: '15 min', price: '5 €', addMins: 15 }
          ].map((opt) => (
            <button
              key={opt.addMins}
              className="flex-1 h-9 rounded-lg bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 transition-colors flex flex-col items-center justify-center"
              onClick={() => {
                setExpiredAlertExtend((prev) => { const n = { ...prev }; delete n[alert.id]; return n; });
                setExpiredAlertModalId(null);
                const newMins = (Number(alert.available_in_minutes) || 0) + opt.addMins;
                base44.entities.ParkingAlert.update(alert.id, { available_in_minutes: newMins }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                });
              }}
            >
              <span className="text-white text-[11px] font-bold leading-none">{opt.mins} ·</span>
              <span className="text-purple-300 text-[11px] font-bold leading-none mt-0.5">{opt.price}</span>
            </button>
          ))}
        </div>
        <Button
          className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
          onClick={() => {
            setExpiredAlertExtend((prev) => { const n = { ...prev }; delete n[alert.id]; return n; });
            setExpiredAlertModalId(null);
            base44.entities.ParkingAlert.update(alert.id, { status: 'cancelled' }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
              try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
            });
          }}
        >
          Me voy
        </Button>
      </div>
    </>
  );

  // ====== Contenido de tarjeta "reservado por:" — MISMA estructura que IncomingRequestModal ======
  const ReservedByContent = ({
    alert,
    waitUntilLabel,
    countdownText,
    onNavigateClick,
    onCancelClick
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

    const stUpper = String(countdownText || '').trim().toUpperCase();
    const isCountdownLike = /^\d{2}:\d{2}(?::\d{2})?$/.test(stUpper);
    const statusBoxCls = isCountdownLike ? 'border-purple-400/70 bg-purple-600/25' : 'border-purple-500/30 bg-purple-600/10';
    const statusTextCls = isCountdownLike ? 'text-purple-100' : 'text-purple-300';

    return (
      <>
        {/* Contenido interior idéntico al modal — empieza dentro del bg-gray-800/60 */}
        <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500">
          {/* Header badge + distancia + precio + X cancelar */}
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
              Te reservó:
            </div>
            <div className="flex items-center gap-1">
              <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                <Navigation className="w-3 h-3 text-purple-400"/>
                <span className="text-white font-bold text-xs">300m</span>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                <TrendingUp className="w-4 h-4 text-green-400"/>
                <span className="text-green-400 font-bold text-sm">{formatPriceInt(alert.price)}</span>
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

          <div className="border-t border-gray-700/80 mb-2"/>

          {/* Foto + nombre + matrícula + coche */}
          <div className="flex gap-2.5">
            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
              <img src={reservedByPhoto} alt={reservedByName} className="w-full h-full object-cover"/>
            </div>
            <div className="flex-1 h-[85px] flex flex-col">
              <p className="font-bold text-xl text-white leading-none">{String(reservedByName).split(' ')[0]}</p>
              <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>
              <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                <div className="flex-shrink-0">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">{formatPlate(plate)}</span>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex-shrink-0 relative top-[2px]">
                    <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
                      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={carFill} stroke="white" strokeWidth="1.5"/>
                      <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5"/>
                      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                      <circle cx="14" cy="18" r="2" fill="#666"/>
                      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                      <circle cx="36" cy="18" r="2" fill="#666"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dirección y tiempo */}
          <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
              <MapPin className="w-4 h-4 flex-shrink-0 text-purple-400"/>
              <span className="text-gray-200 line-clamp-1 leading-none">{formatAddress(alert.address)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
              <Clock className="w-4 h-4 flex-shrink-0 text-purple-400"/>
              <span className="leading-none">
                <span className="text-white">Te vas en {alert.available_in_minutes} min · </span>
                <span className="text-purple-400">Debes esperar hasta las:</span>
                {' '}<span className="text-white font-bold" style={{fontSize:'14px'}}>{waitUntilLabel}</span>
              </span>
            </div>
          </div>

          {/* Botones — mismos tamaños que el modal, IR parpadeante en azul */}
          <div className="mt-2 flex items-center gap-2">
            <Button size="icon" className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400"
              style={{width:'46px',flexShrink:0}}
              onClick={() => (window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.reserved_by_email || alert.reserved_by_id}`))}>
              <MessageCircle className="w-4 h-4"/>
            </Button>

            {phoneEnabled ? (
              <Button size="icon" className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg border-2 border-gray-300"
                style={{width:'46px',flexShrink:0}}
                onClick={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}>
                <Phone className="w-4 h-4"/>
              </Button>
            ) : (
              <Button size="icon" className="h-8 border-2 border-white/30 bg-white/10 text-white rounded-lg opacity-70"
                style={{width:'46px',flexShrink:0}} disabled>
                <PhoneOff className="w-4 h-4"/>
              </Button>
            )}

            {/* IR: parpadeante en azul cuando hay navigate, desactivado sino */}
            <Button size="icon"
              className={`h-8 rounded-lg border-2 flex items-center justify-center ${
                onNavigateClick
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 animate-pulse shadow-lg shadow-blue-500/50'
                  : 'bg-blue-600/40 text-blue-300 border-blue-400/30 opacity-50 cursor-not-allowed'
              }`}
              style={{width:'46px',flexShrink:0}}
              disabled={!onNavigateClick}
              onClick={onNavigateClick || undefined}>
              <Navigation className="w-4 h-4"/>
            </Button>

            <div className="flex-1">
              <div className={`w-full h-8 rounded-lg border-2 flex items-center justify-center ${statusBoxCls}`}>
                <span className={`font-mono font-extrabold text-sm ${statusTextCls}`}>{countdownText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque expiración — debajo */}
        {isExpired && <ExpiredBlock alert={alert} />}
      </>
    );
  };

  // ====== Badge ancho igual que la foto (95px) ======
  const badgePhotoWidth = 'w-[95px] h-7 flex items-center justify-center text-center';

  // ====== Map status a texto ======
  const statusLabelFrom = (s, alert) => {
    const st = String(s || '').toLowerCase();
    if (st === 'completed') return 'COMPLETADA';
    if (st === 'cancelled') {
      if (alert?.cancel_reason === 'me_fui') return 'ME FUI';
      return 'CANCELADA';
    }
    if (st === 'expired') return 'EXPIRADA';
    if (st === 'reserved') return 'EN CURSO';
    return 'COMPLETADA';
  };

  // ====== Dinero en "Tus reservas" según estado ======
  const reservationMoneyModeFromStatus = (status) => {
    const st = String(status || '').toLowerCase();
    if (st === 'completed') return 'paid';
    if (st === 'expired' || st === 'cancelled') return 'neutral';
    return 'neutral';
  };

  return (
    <div className="min-h-[100dvh] text-white flex flex-col" style={{ backgroundColor: '#0b0b0b' }}>
      <Header title="Alertas" showBackButton={true} backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="fixed top-[56px] left-0 right-0 z-40 backdrop-blur-sm px-4 pt-3 pb-2 border-b border-gray-800" style={{ backgroundColor: 'rgba(11,11,11,0.93)' }}>
            <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0 mt-[4px] mb-[2px] h-auto p-0 flex justify-between">
              <TabsTrigger value="alerts" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]">
                Tus alertas
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]">
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="h-[59px]" />

          <HistorySellerView
            noScrollBar={noScrollBar}
            SectionTag={SectionTag}
            thinkingRequests={thinkingRequests}
            setThinkingRequests={setThinkingRequests}
            visibleActiveAlerts={visibleActiveAlerts}
            nowTs={nowTs}
            formatRemaining={formatRemaining}
            getCreatedTs={getCreatedTs}
            getWaitUntilTs={getWaitUntilTs}
            hiddenKeys={hiddenKeys}
            hideKey={hideKey}
            formatCardDate={formatCardDate}
            formatPriceInt={formatPriceInt}
            formatAddress={formatAddress}
            getCarFill={getCarFill}
            getCarFillThinking={getCarFillThinking}
            CarIconProfile={CarIconProfile}
            PlateProfile={PlateProfile}
            badgePhotoWidth={badgePhotoWidth}
            labelNoClick={labelNoClick}
            cancelAlertMutation={cancelAlertMutation}
            queryClient={queryClient}
            ReservedByContent={ReservedByContent}
            CardHeaderRow={CardHeaderRow}
            MoneyChip={MoneyChip}
            CountdownButton={CountdownButton}
            renderableFinalized={renderableFinalized}
            rejectedRequests={rejectedRequests}
            statusLabelFrom={statusLabelFrom}
            MarcoContent={MarcoContent}
            deleteAlertSafe={deleteAlertSafe}
            user={user}
            setCancelReservedAlert={setCancelReservedAlert}
            setCancelReservedOpen={setCancelReservedOpen}
            expiredAlertExtend={expiredAlertExtend}
            setExpiredAlertExtend={setExpiredAlertExtend}
            setExpiredAlertModalId={setExpiredAlertModalId}
            ExpiredBlock={ExpiredBlock}
            toMs={toMs}
            avatarFor={avatarFor}
            formatPlate={formatPlate}
            reservationMoneyModeFromStatus={reservationMoneyModeFromStatus}
          />


          <HistoryBuyerView
            noScrollBar={noScrollBar}
            SectionTag={SectionTag}
            reservationsActiveAll={reservationsActiveAll}
            nowTs={nowTs}
            getCreatedTs={getCreatedTs}
            getWaitUntilTs={getWaitUntilTs}
            formatRemaining={formatRemaining}
            hiddenKeys={hiddenKeys}
            autoFinalizedReservationsRef={autoFinalizedReservationsRef}
            formatCardDate={formatCardDate}
            formatPriceInt={formatPriceInt}
            reservationMoneyModeFromStatus={reservationMoneyModeFromStatus}
            CardHeaderRow={CardHeaderRow}
            badgePhotoWidth={badgePhotoWidth}
            labelNoClick={labelNoClick}
            MoneyChip={MoneyChip}
            hideKey={hideKey}
            user={user}
            queryClient={queryClient}
            MarcoContent={MarcoContent}
            formatAddress={formatAddress}
            reservationsFinalAll={reservationsFinalAll}
            toMs={toMs}
            deleteAlertSafe={deleteAlertSafe}
            statusLabelFrom={statusLabelFrom}
          />
                    </Tabs>
                    </main>

      {/* Dialog: cancelar alerta RESERVADA (penalización) — pantalla completa estilo IncomingRequestModal */}
      {cancelReservedOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col" style={{ backgroundColor: '#0b0b0b' }}>
          {/* Borde morado superior */}
          <div className="h-1.5 w-full bg-purple-500 flex-shrink-0" />

          <div className="flex-1 flex flex-col items-center justify-center px-5">
            {/* Header con X cuadrado estilo filtros */}
            <div className="w-full max-w-sm relative mb-6">
              <button
                onClick={() => { setCancelReservedOpen(false); setCancelReservedAlert(null); }}
                className="absolute top-0 right-0 w-8 h-8 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* "Atención" centrado */}
              <div className="flex justify-center mb-6 pt-1">
                <div className="px-6 py-2.5 rounded-xl bg-red-900/60 border-2 border-red-500/70">
                  <span className="text-red-300 font-bold text-lg">⚠️ Atención</span>
                </div>
              </div>

              <p className="text-gray-200 text-sm leading-relaxed mb-8 text-center">
                Vas a cancelar la alerta que te acaba de reservar <span className="font-bold text-white">{cancelReservedAlert?.reserved_by_name?.split(' ')[0] || 'el comprador'}</span>.<br/><br/>
                Si cancelas, <span className="text-red-400 font-semibold">se te suspenderá el servicio de publicación de alertas durante 24 horas</span> y tendrás una <span className="text-red-400 font-semibold">penalización del 33% adicional en tu próximo ingreso</span>.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!cancelReservedAlert?.id) return;
                    const alert = cancelReservedAlert;
                    const cardKey = `active-${alert.id}`;
                    hideKey(cardKey);
                    queryClient.setQueryData(['myAlerts'], (old = []) =>
                      Array.isArray(old) ? old.map(a => a.id === alert.id ? { ...a, status: 'cancelled', cancel_reason: 'me_fui', updated_date: new Date().toISOString() } : a) : old
                    );
                    base44.entities.ParkingAlert.update(alert.id, { status: 'cancelled', cancel_reason: 'me_fui' }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
                    });
                    setCancelReservedOpen(false);
                    setCancelReservedAlert(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 h-12 text-base font-semibold"
                >
                  Me voy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setCancelReservedOpen(false); setCancelReservedAlert(null); }}
                  className="flex-1 border-gray-600 text-white h-12 text-base font-semibold bg-gray-800 hover:bg-gray-700"
                >
                  Volver
                </Button>
              </div>
            </div>
          </div>

          {/* Borde morado inferior */}
          <div className="h-1.5 w-full bg-purple-500 flex-shrink-0" />
        </div>
      )}

      <Dialog open={cancelConfirmOpen} onOpenChange={(open) => {
        setCancelConfirmOpen(open);
        if (!open) setCancelConfirmAlert(null);
      }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Vas a cancelar tu alerta publicada</DialogTitle>
            <DialogDescription className="text-gray-400">Confirma para moverla a finalizadas como cancelada.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span className="text-gray-200">{cancelConfirmAlert?.address || ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-gray-200">{cancelConfirmAlert?.available_in_minutes ?? ''} Minutos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Euro className="w-4 h-4 text-purple-400" />
              <span className="text-gray-200">{cancelConfirmAlert?.price ?? ''}€</span>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => {
              setCancelConfirmOpen(false);
              setCancelConfirmAlert(null);
            }} className="flex-1 border-gray-700">Rechazar</Button>
            <Button
              onClick={() => {
                if (!cancelConfirmAlert?.id) return;
                cancelAlertMutation.mutate(cancelConfirmAlert.id);
                setCancelConfirmOpen(false);
                setCancelConfirmAlert(null);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expirePromptOpen} onOpenChange={(open) => {
        setExpirePromptOpen(open);
        if (!open) setExpirePromptAlert(null);
      }}>
        <DialogContent
          hideClose
          className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500 max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0"
        >
          {/* Cabecera centrada (mismo estilo que "Vas a publicar una alerta") */}
          <div className="flex justify-center mb-3">
            <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
              <span className="text-white font-semibold text-sm">Tu alerta ha expirado</span>
            </div>
          </div>
          {/* Tarjeta incrustada: EXACTAMENTE mismo layout que una Activa, pero el botón del contador pone EXPIRADA */}
          {(() => {
            const a = expirePromptAlert;
            if (!a) return null;

            const createdTs = getCreatedTs(a) || nowTs;
            const waitUntilTs = getWaitUntilTs(a);
            const waitUntilLabel = waitUntilTs
              ? new Date(waitUntilTs).toLocaleString('es-ES', {
                  timeZone: 'Europe/Madrid',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              : '--:--';

            return (
              <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative">
                <CardHeaderRow
                  left={
                    <Badge
                      className={`bg-purple-700/60 text-white border border-purple-500/60 ${badgePhotoWidth} ${labelNoClick}`}
                    >
                      Expirada
                    </Badge>
                  }
                  dateText={formatCardDate(createdTs)}
                  dateClassName="text-white"
                  right={
                    <div className="flex items-center gap-1">
                      <MoneyChip mode="green" showUpIcon amountText={formatPriceInt(a.price)} />
                    </div>
                  }
                />

                <div className="border-t border-gray-700/80 mb-2" />

                <div className="flex items-start gap-1.5 text-xs mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                  <span className="text-white leading-5">{formatAddress(a.address) || 'Ubicación marcada'}</span>
                </div>

                <div className="flex items-start gap-1.5 text-xs">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                  <span className="text-white leading-5">
                    Te vas en {a.available_in_minutes} min · Debes esperar hasta las{' '}
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
                  </span>
                </div>

                <div className="mt-2">
                  <CountdownButton text="EXPIRADA" dimmed={false} />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-4">
            <Button
              onClick={() => {
                if (!expirePromptAlert?.id) return;
                expireAlertMutation.mutate(expirePromptAlert.id);
                setExpirePromptOpen(false);
                setExpirePromptAlert(null);
              }}
              className="w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>

            <Button
              onClick={() => {
                if (!expirePromptAlert?.id) return;
                repeatAlertMutation.mutate(expirePromptAlert);
                setExpirePromptOpen(false);
                setExpirePromptAlert(null);
              }}
              className="w-auto px-4 py-2 bg-white text-black hover:bg-gray-200"
            >
              Repetir alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de expiración de reserva */}
      {expiredAlertModalId && (() => {
        const alert = visibleActiveAlerts.find(a => a.id === expiredAlertModalId);
        if (!alert) return null;
        const waitUntilTs = getWaitUntilTs(alert);
        const waitUntilLabel = waitUntilTs
          ? new Date(waitUntilTs).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })
          : '--:--';
        const reservedByPhoto =
          alert.reserved_by_photo ||
          avatarFor(alert.reserved_by_name) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(alert.reserved_by_name || 'U')}&background=7c3aed&color=fff&size=128`;
        const carLabel = alert.reserved_by_car || 'Sin datos';
        const carColor = alert.reserved_by_car_color || 'gris';
        const plate = alert.reserved_by_plate || '';
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 border-2 border-purple-500/60 rounded-xl w-full max-w-sm p-3 relative">
              {/* Cerrar */}
              <button
                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center text-white z-10"
                onClick={() => setExpiredAlertModalId(null)}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex justify-center mb-3">
                <div className="px-4 py-1.5 rounded-lg bg-purple-700/60 border border-purple-500/60">
                  <span className="text-white font-semibold text-sm">Tiempo expirado</span>
                </div>
              </div>

              {/* Foto + info */}
              <div className="flex gap-2.5 mb-2">
                <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                  <img src={reservedByPhoto} alt={alert.reserved_by_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 h-[85px] flex flex-col">
                  <p className="font-bold text-xl text-white leading-none min-h-[22px]">
                    {(alert.reserved_by_name || 'Usuario').split(' ')[0]}
                  </p>
                  <p className="text-sm font-medium text-gray-200 leading-none flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>
                  <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                    <div className="flex-shrink-0"><PlateProfile plate={plate} /></div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex-shrink-0 relative -top-[1px]">
                        <CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700/80 mb-2 pt-1.5 space-y-1.5">
                <div className="flex items-start gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                  <span className="text-gray-200 leading-5 line-clamp-1">{formatAddress(alert.address)}</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                    <span className="text-white leading-5">
                      Te vas en {alert.available_in_minutes} min · Te espera hasta las:{' '}
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
                    </span>
                </div>
              </div>

              <p className="text-white text-sm font-semibold text-center mb-2">
                Usuario no se ha presentado. Puedes irte o prorrogarle:
              </p>

              <div className="flex gap-2 mb-2">
                {[
                  { mins: '5 min', price: '2 €', addMins: 5 },
                  { mins: '10 min', price: '3 €', addMins: 10 },
                  { mins: '15 min', price: '5 €', addMins: 15 }
                ].map((opt) => (
                  <button
                    key={opt.addMins}
                    className="flex-1 h-9 rounded-lg bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 transition-colors flex flex-col items-center justify-center"
                    onClick={() => {
                      setExpiredAlertExtend((prev) => { const n = { ...prev }; delete n[alert.id]; return n; });
                      setExpiredAlertModalId(null);
                      const newMins = (Number(alert.available_in_minutes) || 0) + opt.addMins;
                      base44.entities.ParkingAlert.update(alert.id, { available_in_minutes: newMins }).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                      });
                    }}
                  >
                    <span className="text-white text-[11px] font-bold leading-none">{opt.mins} ·</span>
                    <span className="text-purple-300 text-[11px] font-bold leading-none mt-0.5">{opt.price}</span>
                  </button>
                ))}
              </div>

              <Button
                className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                onClick={() => {
                  setExpiredAlertExtend((prev) => { const n = { ...prev }; delete n[alert.id]; return n; });
                  setExpiredAlertModalId(null);
                  base44.entities.ParkingAlert.update(alert.id, { status: 'cancelled' }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                    try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
                  });
                }}
              >
                Me voy
              </Button>
            </div>
          </div>
        );
      })()}

      <BottomNav />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}

      
    </div>
  );
}