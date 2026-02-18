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

export default function History() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [demoTick, setDemoTick] = useState(0);

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelConfirmAlert, setCancelConfirmAlert] = useState(null);
  const [expirePromptOpen, setExpirePromptOpen] = useState(false);
  const [expirePromptAlert, setExpirePromptAlert] = useState(null);

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
  const toMs = (v) => {
  if (v == null) return null;

  // Date
  if (v instanceof Date) return v.getTime();

  // Number (ms o seconds)
  if (typeof v === 'number') {
    return v > 1e12 ? v : v * 1000;
  }

  // String
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // Si tiene zona horaria (Z o +hh:mm) → Date normal
    if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) {
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    }

    // 🔴 CLAVE: string SIN zona → tratar como hora local (Madrid)
    const t = new Date(s + ':00').getTime();
    return Number.isNaN(t) ? null : t;
  }

  return null;
};

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
  staleTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: false,
  queryFn: async () => {
    const all = await base44.entities.ParkingAlert.list('-created_date', 5000);
    const uid = user?.id;
    const email = user?.email;

    return (all || []).filter((a) => {
      if (!a) return false;

      const isMine =
        (uid && (a.user_id === uid || a.created_by === uid)) ||
        (email && a.user_email === email);

      return !!isMine;
    });
  }
});



const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
  queryKey: ['myTransactions', user?.email],
  enabled: !!user?.email,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  placeholderData: (prev) => prev,
  queryFn: async () => {
    // Si no existe esta entidad en tu backend, simplemente devuelve []
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

 



const myActiveAlerts = useMemo(() => {
  const filtered = myAlerts.filter((a) => {
    if (!a) return false;

    const isMine =
      (user?.id && (a.user_id === user.id || a.created_by === user.id)) ||
      (user?.email && a.user_email === user.email);

    if (!isMine) return false;

    const status = String(a.status || '').toLowerCase();

    // Solo mostrar activas o reservadas
    return status === 'active' || status === 'reserved';
  });

  if (filtered.length === 0) return [];

  const sorted = [...filtered].sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  // Solo la más reciente
  return [sorted[0]];
}, [myAlerts, user?.id, user?.email]);



const visibleActiveAlerts = useMemo(() => {
  return myActiveAlerts.filter((a) => !hiddenKeys.has(`active-${a.id}`));
}, [myActiveAlerts, hiddenKeys]);

  // ====== Auto-expirar alertas activas cuando el contador llega a 0 (sin side-effects en render) ======
  useEffect(() => {
    if (!visibleActiveAlerts || visibleActiveAlerts.length === 0) return;

    const toExpire = visibleActiveAlerts.filter((a) => {
      if (!a) return false;
      if (String(a.status || '').toLowerCase() !== 'active') return false;
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

    // Si es tu alerta, mostramos el aviso dentro de la app (no la expiramos hasta que elijas)
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
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    });
  }, [nowTs, visibleActiveAlerts, queryClient]);

const myFinalizedAlerts = useMemo(() => {
  return myAlerts.filter((a) => {
    if (!a) return false;

    const isMine =
      (user?.id && (a.user_id === user.id || a.created_by === user.id)) ||
      (user?.email && a.user_email === user.email);

    if (!isMine) return false;

    return ['cancelled', 'completed', 'expired'].includes(
      String(a.status || '').toLowerCase()
    );
  });
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

  // ====== Auto-expirar reservas activas cuando el contador llega a 0 (sin side-effects en render) ======
  useEffect(() => {
    if (!reservationsActiveAll || reservationsActiveAll.length === 0) return;

    const toExpire = reservationsActiveAll.filter((a) => {
      if (!a) return false;
      if (String(a.status || '').toLowerCase() !== 'reserved') return false;
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
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    });
  }, [nowTs, reservationsActiveAll, queryClient]);


  const myFinalizedAsSellerTx = [
    ...transactions.filter((t) => t.seller_id === user?.id),
    ...mockTransactions
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

  const myFinalizedAll = [
    ...myFinalizedAlerts.map((a) => ({
      type: 'alert',
      id: `final-alert-${a.id}`,
    created_date: toMs(a.finalized_date) || toMs(a.updated_date) || Date.now(),
      data: a
    })),
   
    ...myFinalizedAsSellerTx.map((t) => ({
      type: 'transaction',
      id: `final-tx-${t.id}`,
      created_date: t.created_date,
      data: t
    }))
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));


  const renderableFinalized = useMemo(() => {
    return myFinalizedAll
      .filter((item) => !hiddenKeys.has(item.id))
      .filter((item) => {
        if (item.type === 'alert') {
          const st = String(item.data?.status || '').toLowerCase();
          if (st === 'completed') return false; // las completadas van como transacción
        }
        return true;
      });
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
        const all = await base44.entities.ParkingAlert.list('-created_date', 5000);
        const uid = user?.id;
        const email = user?.email;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });

  const expireAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.entities.ParkingAlert.update(alertId, { status: 'expired' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
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
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });


  // ====== Badge ancho igual que la foto (95px) ======
  const badgePhotoWidth = 'w-[95px] h-7 flex items-center justify-center text-center';

  // ====== Map status a texto ======
  const statusLabelFrom = (s) => {
    const st = String(s || '').toLowerCase();
    if (st === 'completed') return 'COMPLETADA';
    if (st === 'cancelled') return 'CANCELADA';
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
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      <Header title="Alertas" showBackButton={true} backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="sticky top-[56px] z-40 bg-black pt-[11px] pb-[2px]">
            <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0 mt-[4px] mb-[2px] h-auto p-0">
              <TabsTrigger value="alerts" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]">
                Tus alertas
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]">
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="alerts" className={`space-y-3 pt-1 pb-6 ${noScrollBar}`}>
                <SectionTag variant="green" text="Activas" />

                {visibleActiveAlerts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center"
                  >
                    <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-[20px]">
                    {visibleActiveAlerts
                       .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
                       .map((alert, index) => {
                         const createdTs = getCreatedTs(alert);
                         const waitUntilTs = getWaitUntilTs(alert);



                         const remainingMs = waitUntilTs && createdTs ? Math.max(0, waitUntilTs - nowTs) : 0;
                         const waitUntilLabel = waitUntilTs ? new Date(waitUntilTs).toLocaleString('es-ES', { 
                           timeZone: 'Europe/Madrid', 
                           hour: '2-digit', 
                           minute: '2-digit', 
                           hour12: false 
                         }) : '--:--';
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
                  <span className="text-white leading-5">Te vas en {a.available_in_minutes} min · </span>
                  <span className="text-purple-400 leading-5">Debes esperar hasta las {waitUntilLabel}</span>
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
              className="w-auto px-4 min-w-[170px] bg-purple-600 hover:bg-purple-700"
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
              className="w-auto px-4 min-w-[170px] bg-white text-black hover:bg-gray-200"
            >
              Repetir alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}

      
    </div>
  );
}