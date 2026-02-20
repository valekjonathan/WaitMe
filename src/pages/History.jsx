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
import { isDemoMode, startDemoFlow, subscribeDemoFlow, getDemoAlerts, upsertDemoAlertFromReal } from '@/components/DemoFlowManager';

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
  queryKey: ['myAlerts'],
  enabled: true,
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  placeholderData: (prev) => prev,
  queryFn: async () => {
    const uid = user?.id;
    const email = user?.email;
    if (!uid && !email) return [];

    let mine = [];
    if (uid) mine = await base44.entities.ParkingAlert.filter({ user_id: uid });
    else mine = await base44.entities.ParkingAlert.filter({ user_email: email });

    return (mine || [])
      .slice()
      .sort((a, b) => (toMs(b?.created_date) || 0) - (toMs(a?.created_date) || 0));
  }
});

// DEMO: una semana de actividad sincronizada
const effectiveAlerts = isDemoMode() ? (() => {
    const real = Array.isArray(myAlerts) ? myAlerts : [];
    const demo = Array.isArray(getDemoAlerts()) ? getDemoAlerts() : [];
    const map = new Map();
    [...demo, ...real].forEach((a) => { if (a?.id) map.set(String(a.id), a); });
    return Array.from(map.values());
  })() : myAlerts;


// Cuando el usuario se hidrata (AuthContext), forzamos refetch inmediato
useEffect(() => {
  if (!user?.id && !user?.email) return;
  queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id, user?.email]);



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
  const filtered = effectiveAlerts.filter((a) => {
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
}, [effectiveAlerts, user?.id, user?.email]);



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
      queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
    });
  }, [nowTs, visibleActiveAlerts, queryClient]);

const myFinalizedAlerts = useMemo(() => {
  return effectiveAlerts.filter((a) => {
    if (!a) return false;

    const isMine =
      (user?.id && (a.user_id === user.id || a.created_by === user.id)) ||
      (user?.email && a.user_email === user.email);

    if (!isMine) return false;

    return ['cancelled', 'completed', 'expired'].includes(
      String(a.status || '').toLowerCase()
    );
  });
}, [effectiveAlerts, user?.id, user?.email]);
    
  // Reservas (tuyas como comprador)
  const myReservationsReal = useMemo(() => {
    return effectiveAlerts.filter((a) => {
      if (a.reserved_by_id !== user?.id) return false;
      if (a.status !== 'reserved') return false;

      return true;
    });
  }, [effectiveAlerts, user?.id]);
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
      queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
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
  ...effectiveAlerts
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
      queryClient.setQueryData(['effectiveAlerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map((a) => (a?.id === alertId ? { ...a, status: 'cancelled' } : a));
      });

      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); 
      try { upsertDemoAlertFromReal?.({ ...alert, status: 'canceled' }); } catch {}
} catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    }
  });

  const expireAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.entities.ParkingAlert.update(alertId, { status: 'expired' });
    },
    onMutate: async (alertId) => {
      // Marcar como expirada en cache (badge se recalcula desde effectiveAlerts)
      queryClient.setQueryData(['effectiveAlerts'], (old) => {
        const list = Array.isArray(old) ? old : (old?.data || []);
        return list.map((a) => (a?.id === alertId ? { ...a, status: 'expired' } : a));
      });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
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
      queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
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
          <div className="fixed top-[56px] left-0 right-0 z-40 bg-black/90 backdrop-blur-sm px-4 pt-3 pb-2 border-b border-gray-800">
            <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0 mt-[4px] mb-[2px] h-auto p-0">
              <TabsTrigger value="alerts" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]">
                Tus alertas
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1 text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white h-auto py-[10px]">
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="h-[59px]" />


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
                                      <MoneyChip
                                        mode="green"
                                        showUpIcon
                                        amountText={formatPriceInt(alert.price)}
                                      />
                                      <button
                                        onClick={() => {
                                          hideKey(cardKey);
                                          cancelAlertMutation.mutate(alert.id);
                                        }}
                                        disabled={cancelAlertMutation.isPending}
                                        className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
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
                                          `Chat?alertId=${alert.id}&userId=${
                                            alert.reserved_by_email || alert.reserved_by_id
                                          }`
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

                                <div className="flex items-start justify-between text-xs">
                                  <div className="flex items-start gap-1.5">
                                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                    <span className="text-gray-500 leading-5">
                                      Te vas en {alert.available_in_minutes} min
                                    </span>
                                  </div>
                                  <span className="leading-5">
  <span className="text-purple-400">Debes esperar hasta las: </span>
  <span className="text-white font-extrabold text-[17px]">{waitUntilLabel}</span>
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
                    <div
                      className={`bg-green-500/20 text-green-300 border border-green-400/50 font-bold text-xs h-7 px-3 flex items-center justify-center rounded-md ${badgePhotoWidth} ${labelNoClick}`}
                    >
                      Activa
                    </div>
                  }
                                  dateText={dateText}
                                  dateClassName="text-white"
                                  right={
                                    <div className="flex items-center gap-1">
                                      <MoneyChip
                                        mode="green"
                                        showUpIcon
                                        amountText={formatPriceInt(alert.price)}
                                      />
                                      <button
                                        onClick={() => {
  hideKey(cardKey);              // 1. Quita la tarjeta al instante (UI)
  cancelAlertMutation.mutate(alert.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['effectiveAlerts']); // 2. Refresca datos sin recargar
    }
  });
}}
                                        disabled={cancelAlertMutation.isPending}
                                        className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
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
                                    Debes esperar hasta las {waitUntilLabel}
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

                {renderableFinalized.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
                  >
                    <p className="text-gray-500 font-semibold">No tienes alertas finalizadas</p>
                  </motion.div>
                ) : (
                  <div className="space-y-[20px]">
                    {renderableFinalized.map((item, index) => {
                      const finalizedCardClass =
                        'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';
                      const key = item.id;
                      if (hiddenKeys.has(key)) return null;

                      if (item.type === 'alert') {
  const a = item.data;
  // 🔴 NO pintar alertas COMPLETADAS aquí (van como transacción)
  if (String(a?.status || '').toLowerCase() === 'completed') return null;

  const ts = item.created_date;
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
                                  className={`bg-red-500/20 text-red-400 border border-red-500/30 ${badgePhotoWidth} ${labelNoClick}`}
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
                                    amountText={formatPriceInt(a.price)}
                                  />
                                  <button
                                    onClick={async () => {
                                      hideKey(key);
                                      await deleteAlertSafe(a.id);
                                      queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
                                    }}
                                    className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              }
                            />

                            <div className="border-t border-gray-700/80 mb-2" />

                            <div className="flex items-start gap-1.5 text-xs mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-500" />
                              <span className="text-gray-400 leading-5">
                                {formatAddress(a.address) || 'Ubicación marcada'}
                              </span>
                            </div>

                            <div className="mt-2">
                              <CountdownButton
                                text={statusLabelFrom(a.status)}
                                dimmed={statusLabelFrom(a.status) !== 'COMPLETADA'}
                              />
                            </div>
                          </motion.div>
                        );
                      }

                      const tx = item.data;
                      const isSeller = tx.seller_id === user?.id;

                      const buyerName = tx.buyer_name || 'Usuario';
                      const buyerPhoto = tx.buyer_photo_url || tx.buyerPhotoUrl || '';
                      const buyerCarLabel =
                        tx.buyer_car ||
                        tx.buyerCar ||
                        tx.buyer_car_label ||
                        tx.buyerCarLabel ||
                        (tx.buyer_car_brand
                          ? `${tx.buyer_car_brand || ''} ${tx.buyer_car_model || ''}`.trim()
                          : '');
                      const buyerPlate =
                        tx.buyer_plate ||
                        tx.buyerPlate ||
                        tx.buyer_car_plate ||
                        tx.buyerCarPlate ||
                        tx.car_plate ||
                        tx.carPlate ||
                        '';
                      const buyerColor =
                        tx.buyer_car_color || tx.buyerCarColor || tx.car_color || tx.carColor || '';

                      const ts = toMs(tx.created_date);
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
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 ${badgePhotoWidth} ${labelNoClick}`}
                              >
                                Finalizada
                              </Badge>
                            }
                            dateText={dateText}
                            dateClassName="text-gray-600"
                            right={
                              <div className="flex items-center gap-1">
                                <MoneyChip
                                  mode="green"
                                  showUpIcon
                                  amountText={formatPriceInt(tx.amount)}
                                />
                                <button
                                  onClick={() => hideKey(key)}
                                  className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            }
                          />

                          <div className="border-t border-gray-700/80 mb-2" />

                          <div className="mb-1.5">
                            <MarcoContent
                              photoUrl={buyerPhoto}
                              name={buyerName}
                              carLabel={buyerCarLabel || 'Sin datos'}
                              plate={buyerPlate}
                              carColor={buyerColor}
                              address={tx.address}
                              timeLine={`Transacción completada · ${
                                ts ? format(new Date(ts), 'HH:mm', { locale: es }) : '--:--'
                              }`}
                              onChat={() =>
                                (window.location.href = createPageUrl(
                                  `Chat?alertId=${tx.alert_id}&userId=${tx.buyer_id}`
                                ))
                              }
                              statusText="COMPLETADA"
                              dimIcons={true}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  )}
                  </TabsContent>

                  <TabsContent value="reservations" className={`space-y-3 pt-1 pb-6 ${noScrollBar}`}>
                  <SectionTag variant="green" text="Activas" />

                {reservationsActiveAll.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center"
                  >
                    <p className="text-gray-500 font-semibold">No tienes ninguna reserva activa.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-[20px]">
                    {reservationsActiveAll.map((alert, index) => {
                      const createdTs = getCreatedTs(alert) || nowTs;
                      const waitUntilTs = getWaitUntilTs(alert);
                      const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;

                      const remainingMs = hasExpiry ? Math.max(0, waitUntilTs - nowTs) : null;
                      const waitUntilLabel = hasExpiry
                       ? new Date(waitUntilTs).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })
                       : '--:--';

                      const countdownText =
                        remainingMs === null
                          ? '--:--'
                          : remainingMs > 0
                          ? formatRemaining(remainingMs)
                          : 'Reserva finalizada';

                      const key = `res-active-${alert.id}`;
                      if (hiddenKeys.has(key)) return null;

                      const isMock = String(alert.id).startsWith('mock-');

                      if (
                        alert.status === 'reserved' &&
                        hasExpiry &&
                        remainingMs !== null &&
                        remainingMs <= 0
                      ) {
                        if (!isMock) {
                          if (!autoFinalizedReservationsRef.current.has(alert.id)) {
                            autoFinalizedReservationsRef.current.add(alert.id);
                          }
}
                        return null;
                      }

                      const carLabel = `${alert.car_brand || ''} ${alert.car_model || ''}`.trim();
                      const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls !== false);

                      const dateText = formatCardDate(createdTs);
                      const moneyMode = reservationMoneyModeFromStatus('reserved');

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
                              <Badge
                      className={`bg-purple-500/20 text-purple-300 border border-purple-400/50 ${badgePhotoWidth} ${labelNoClick}`}
                    >
                      Expirada
                    </Badge>
                            }
                            dateText={dateText}
                            dateClassName="text-white"
                            right={
                              <div className="flex items-center gap-1">
                                {moneyMode === 'paid' ? (
                                  <MoneyChip
                                    mode="red"
                                    showDownIcon
                                    amountText={formatPriceInt(alert.price)}
                                  />
                                ) : (
                                  <MoneyChip
                                    mode="neutral"
                                    amountText={formatPriceInt(alert.price)}
                                  />
                                )}

                                <button
                                  onClick={async () => {
                                    hideKey(key);
                                    if (isMock) return;

                                    await base44.entities.ParkingAlert.update(alert.id, { status: 'cancelled' });
                                    await base44.entities.ChatMessage.create({
                                      alert_id: alert.id,
                                      sender_id: user?.email || user?.id,
                                      sender_name:
                                        user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
                                      receiver_id: alert.user_email || alert.user_id,
                                      message: `He cancelado mi reserva de ${Math.trunc(alert.price ?? 0)} €`,
                                      read: false
                                    });

                                    queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
                                  }}
                                  className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            }
                          />

                          <div className="border-t border-gray-700/80 mb-2" />

                          <MarcoContent
                            bright={true}
                            photoUrl={alert.user_photo}
                            name={alert.user_name}
                            carLabel={carLabel || 'Sin datos'}
                            plate={alert.car_plate}
                            carColor={alert.car_color}
                            address={alert.address}
                            timeLine={{
                              main: `Se va en ${alert.available_in_minutes} min ·`,
                              accent: `Te espera hasta las ${waitUntilLabel}`
                            }}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${alert.id}&userId=${alert.user_email || alert.user_id}`
                              ))
                            }
                            statusText={countdownText}
                            statusEnabled={true}
                            phoneEnabled={phoneEnabled}
                            onCall={() => phoneEnabled && (window.location.href = `tel:${alert.phone}`)}
                          />

                          {/* Línea horizontal y botón de navegación */}
                          <div className="border-t border-gray-700/80 mt-2 pt-2">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
                              onClick={() => window.location.href = createPageUrl(`Navigate?alertId=${alert.id}`)}
                            >
                              IR
                              <Navigation className="w-5 h-5" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2">
                  <SectionTag variant="red" text="Finalizadas" />
                </div>

                {reservationsFinalAll.filter((item) => !hiddenKeys.has(item.id)).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
                  >
                    <p className="text-gray-500 font-semibold">No tienes ninguna reserva finalizada.</p>
                  </motion.div>
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
                         ? new Date(waitUntilTs).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })
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
                                  className={`bg-red-500/20 text-red-400 border border-red-500/30 ${badgePhotoWidth} ${labelNoClick}`}
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
                                      amountText={formatPriceInt(a.price)}
                                    />
                                  ) : (
                                    <MoneyChip mode="neutral" amountText={formatPriceInt(a.price)} />
                                  )}

                                  <button
                                    onClick={async () => {
                                      hideKey(key);
                                      const isMock = String(a.id).startsWith('mock-');
                                      if (!isMock) {
                                        await deleteAlertSafe(a.id);
                                        queryClient.invalidateQueries({ queryKey: ['effectiveAlerts'] });
                                      }
                                    }}
                                    className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
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
                              dimIcons={true}
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
                        tx.seller_car || tx.sellerCar || `${tx.seller_car_brand || ''} ${tx.seller_car_model || ''}`.trim();
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
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 ${badgePhotoWidth} ${labelNoClick}`}
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
                                    amountText={formatPriceInt(tx.amount)}
                                  />
                                ) : (
                                  <MoneyChip mode="neutral" amountText={formatPriceInt(tx.amount)} />
                                )}

                                <Button
                                  size="icon"
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                  onClick={() => hideKey(key)}
                                >
                                  <X className="w-4 h-4" />
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
                              ts ? new Date(ts).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'
                            }`}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`
                              ))
                            }
                            statusText="COMPLETADA"
                            statusEnabled={true}
                            dimIcons={true}
                          />
                        </motion.div>
                      );
                    })}
                    </div>
                    )}
                    </TabsContent>
                    </Tabs>
                    </main>

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
                  <span className="text-white leading-5">Te vas en {a.available_in_minutes} min · </span>
                  <span className="text-purple-400 leading-5">Debes esperar hasta las {waitUntilLabel}</span>
                </div>

                <div className="mt-2">
                  
                                <div className="mt-1">
                                  <span className="leading-5">
                                    <span className="text-purple-400">Debes esperar hasta las: </span>
                                    <span className="text-white font-extrabold text-[17px]">{waitUntilLabel}</span>
                                  </span>
                                </div>
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

      <BottomNav />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}

      
    </div>
  );
}