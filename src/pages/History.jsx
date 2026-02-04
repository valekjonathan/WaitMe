import { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
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
import { useAuth } from '@/lib/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const queryClient = useQueryClient();

  const labelNoClick = 'cursor-default select-none pointer-events-none';
  const noScrollBar = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  const fixedAvatars = {
    Sofía: 'https://randomuser.me/api/portraits/women/68.jpg',
    Hugo: 'https://randomuser.me/api/portraits/men/32.jpg',
    Nuria: 'https://randomuser.me/api/portraits/women/44.jpg',
    Iván: 'https://randomuser.me/api/portraits/men/75.jpg',
    Marco: 'https://randomuser.me/api/portraits/men/12.jpg'
  };
  const avatarFor = (name) => fixedAvatars[String(name || '').trim()] || null;

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

    if (typeof created === 'number' && created > 0 && Number.isFinite(mins) && mins > 0) {
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

  const CountdownButton = ({ text, dimmed = false }) => (
    <div
      className={[
        'w-full h-9 rounded-lg border-2 flex items-center justify-center px-3',
        dimmed ? 'border-purple-500/30 bg-purple-600/10' : 'border-purple-400/70 bg-purple-600/25'
      ].join(' ')}
    >
      <span
        className={`text-sm font-mono font-extrabold ${dimmed ? 'text-gray-400/70' : 'text-purple-100'}`}
      >
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
          className={`${cls} border rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs text-center ${labelNoClick}`}
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
      : 'text-sm font-medium text-gray-400 leading-none flex-1 flex items-center truncate opacity-70 relative top-[6px]';

    const plateOpacity = bright ? '' : 'opacity-70';

    const chatCls = dimIcons
      ? 'bg-purple-600/25 hover:bg-purple-600/35 text-white rounded-lg h-8 w-[42px] opacity-60'
      : 'bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-8 w-[42px]';

    const callEnabled = !!phoneEnabled && typeof onCall === 'function';

    const callCls = callEnabled
      ? dimIcons
        ? 'border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-60'
        : 'border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px]'
      : 'border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed';

    const statusBoxCls = isCountdownLike
      ? dimIcons
        ? 'border-purple-400/40 bg-purple-600/10'
        : 'border-purple-400/70 bg-purple-600/25'
      : isCompleted
      ? dimIcons
        ? 'border-green-500/30 bg-green-600/10'
        : 'border-green-500/60 bg-green-600/20'
      : isDimStatus
      ? 'border-gray-600 bg-gray-800/40'
      : dimIcons
      ? 'border-gray-700 bg-gray-900/40'
      : 'border-gray-700 bg-gray-900/70';

    const statusTextCls = isCountdownLike
      ? dimIcons
        ? 'text-purple-200/60'
        : 'text-purple-100'
      : isCompleted
      ? dimIcons
        ? 'text-green-300/60'
        : 'text-green-300'
      : isDimStatus
      ? 'text-gray-500'
      : dimIcons
      ? 'text-gray-500'
      : 'text-gray-400';

    const statusTextFinal = isCountdownLike ? statusText : stUpper;

    const leftBadge = (
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className={photoCls} />
        ) : (
          <span className="text-white font-bold text-xl">{String(name || 'U').charAt(0)}</span>
        )}
      </div>
    );

    const rightX = null;

    return (
      <>
        <CardHeaderRow
          left={leftBadge}
          dateText=""
          dateClassName="hidden"
          right={rightX}
        />

        <div className="flex items-start gap-3 -mt-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className={nameCls}>{name}</div>

            <div className="flex items-center gap-2 mt-1">
              <CarIconProfile color={getCarFill(carColor)} size="w-14 h-9" />
              <div className={carCls}>{carLabel}</div>
              <div className={plateOpacity}>
                <PlateProfile plate={plate} />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <MapPin className={`w-4 h-4 ${bright ? 'text-gray-200' : 'text-gray-500'} flex-shrink-0`} />
              <p className={`text-xs ${bright ? 'text-gray-200' : 'text-gray-500'} truncate`}>
                {formatAddress(address)}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Clock className={`w-4 h-4 ${bright ? 'text-gray-200' : 'text-gray-500'} flex-shrink-0`} />
              <p className={`text-xs ${bright ? 'text-gray-200' : 'text-gray-500'} truncate`}>
                {timeLine}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2">
            <Button className={chatCls} onClick={onChat}>
              <MessageCircle className="w-4 h-4" />
            </Button>

            {callEnabled ? (
              <Button variant="outline" size="icon" className={callCls} onClick={onCall}>
                <Phone className="w-4 h-4 text-white" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className={callCls}
                disabled
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </Button>
            )}

            <div className="flex-1">
              <div className={`w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 ${statusBoxCls}`}>
                <span className={`text-sm font-mono font-extrabold ${statusTextCls}`}>
                  {statusTextFinal}
                </span>
              </div>
            </div>

            {priceChip ? <div className="hidden">{priceChip}</div> : null}
          </div>
        </div>
      </>
    );
  };

  const [hiddenKeys, setHiddenKeys] = useState(() => new Set());
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

  // ✅ FIX: definir myAlerts ANTES de cualquier uso (evita "Cannot access 'myAlerts' before initialization")
  const {
    data: myAlerts = [],
    isLoading: loadingAlerts
  } = useQuery({
    queryKey: ['myAlerts', user?.id, user?.email],
    enabled: !!user?.id || !!user?.email,
    staleTime: 120000,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: [],
    queryFn: async () => {
      const res = await base44.entities.ParkingAlert.list();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.filter((a) => {
        if (!a) return false;
        if (user?.id && (a.user_id === user.id || a.created_by === user.id)) return true;
        if (user?.email && a.user_email === user.email) return true;
        return false;
      });
    }
  });

  const autoFinalizedRef = useRef(new Set());
  useEffect(() => {
    if (!myAlerts || myAlerts.length === 0) return;

    myAlerts.forEach((alert) => {
      if (!alert) return;

      const createdTs = getCreatedTs(alert);
      const waitUntilTs = getWaitUntilTs(alert);
      if (!waitUntilTs) return;

      const remainingMs = Math.max(0, waitUntilTs - nowTs);

      if (
        remainingMs === 0 &&
        String(alert.status || '').toLowerCase() === 'active' &&
        !autoFinalizedRef.current.has(alert.id)
      ) {
        autoFinalizedRef.current.add(alert.id);

        base44.entities.ParkingAlert.update(alert.id, { status: 'expired' }).finally(() => {
          queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
        });
      }
    });
  }, [myAlerts, nowTs, queryClient]);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.email],
    queryFn: async () => {
      const [asSeller, asBuyer] = await Promise.all([
        base44.entities.Transaction.filter({ seller_id: user?.email }),
        base44.entities.Transaction.filter({ buyer_id: user?.email })
      ]);
      return [...asSeller, ...asBuyer];
    },
    enabled: !!user?.email,
    staleTime: 120000,
    refetchInterval: false,
    placeholderData: []
  });

  const statusLabelFrom = (s) => {
    const st = String(s || '').toLowerCase();
    if (st === 'active') return 'ACTIVA';
    if (st === 'reserved') return 'RESERVADA';
    if (st === 'completed') return 'COMPLETADA';
    if (st === 'cancelled') return 'CANCELADA';
    if (st === 'expired') return 'EXPIRADA';
    return String(s || '').toUpperCase() || '--';
  };

  const reservationMoneyModeFromStatus = (s) => {
    const st = String(s || '').toLowerCase();
    if (st === 'completed') return 'paid';
    if (st === 'cancelled' || st === 'expired') return 'refunded';
    return 'neutral';
  };

  const getAlertOwnerName = (a) => a?.user_name || a?.seller_name || a?.owner_name || 'Usuario';
  const getAlertOwnerPhoto = (a) => a?.user_photo || a?.seller_photo_url || a?.owner_photo_url || '';

  const getTxSellerName = (tx) => tx?.seller_name || 'Usuario';
  const getTxSellerPhoto = (tx) => tx?.seller_photo_url || tx?.sellerPhotoUrl || '';

  const badgePhotoWidth = 'w-[92px]';

  const buildMockAlert = ({ id, name, address, plate, carBrand, carModel, carColor, mins, price, status }) => {
    const now = Date.now();
    return {
      id,
      status,
      user_name: name,
      user_photo: avatarFor(name),
      address,
      car_plate: plate,
      car_brand: carBrand,
      car_model: carModel,
      car_color: carColor,
      available_in_minutes: mins,
      price,
      created_date: now - 1000 * 60 * 7,
      allow_phone_calls: false
    };
  };

  const ensureMock = (arr) => {
    const list = Array.isArray(arr) ? [...arr] : [];
    const hasAny = list.some((x) => x && !String(x.id || '').startsWith('mock-'));
    if (hasAny) return list;

    return [
      buildMockAlert({
        id: 'mock-1',
        name: 'Sofía',
        address: 'Calle Uría, 22, Oviedo',
        plate: '1234ABC',
        carBrand: 'Seat',
        carModel: 'Ibiza',
        carColor: 'rojo',
        mins: 8,
        price: 3,
        status: 'active'
      }),
      buildMockAlert({
        id: 'mock-2',
        name: 'Hugo',
        address: 'Av. de Galicia, 4, Oviedo',
        plate: '5678DEF',
        carBrand: 'Volkswagen',
        carModel: 'Golf',
        carColor: 'gris',
        mins: 5,
        price: 3,
        status: 'reserved'
      }),
      buildMockAlert({
        id: 'mock-3',
        name: 'Nuria',
        address: 'Calle Rosal, 1, Oviedo',
        plate: '9012GHI',
        carBrand: 'Peugeot',
        carModel: '208',
        carColor: 'azul',
        mins: 10,
        price: 3,
        status: 'completed'
      })
    ];
  };

  const myAlertsSafe = useMemo(() => ensureMock(myAlerts), [myAlerts]);

  const myActiveAlerts = useMemo(() => {
    return myAlertsSafe.filter((a) => {
      const st = String(a?.status || '').toLowerCase();
      return st === 'active' || st === 'reserved';
    });
  }, [myAlertsSafe]);

  const myFinalAlerts = useMemo(() => {
    return myAlertsSafe.filter((a) => {
      const st = String(a?.status || '').toLowerCase();
      return st === 'completed' || st === 'cancelled' || st === 'expired';
    });
  }, [myAlertsSafe]);

  const myTransactions = useMemo(() => {
    return Array.isArray(transactions) ? transactions : [];
  }, [transactions]);

  const txFinal = useMemo(() => {
    return myTransactions.filter((tx) => {
      const st = String(tx?.status || '').toLowerCase();
      return st === 'completed' || st === 'cancelled' || st === 'expired';
    });
  }, [myTransactions]);

  const reservationsActive = useMemo(() => {
    // reservas donde yo soy comprador (buyer_id)
    const email = user?.email;
    if (!email) return [];

    const activeTx = myTransactions
      .filter((tx) => String(tx?.buyer_id || '').toLowerCase() === String(email).toLowerCase())
      .filter((tx) => {
        const st = String(tx?.status || '').toLowerCase();
        return st === 'reserved' || st === 'active';
      });

    return activeTx;
  }, [myTransactions, user?.email]);

  const reservationsFinal = useMemo(() => {
    const email = user?.email;
    if (!email) return [];

    const finalTx = myTransactions
      .filter((tx) => String(tx?.buyer_id || '').toLowerCase() === String(email).toLowerCase())
      .filter((tx) => {
        const st = String(tx?.status || '').toLowerCase();
        return st === 'completed' || st === 'cancelled' || st === 'expired';
      });

    return finalTx;
  }, [myTransactions, user?.email]);

  const reservationsActiveAll = useMemo(() => {
    // mezcla de alertas reservadas (mis alertas) y transacciones activas (si aplica)
    const list = [];

    myActiveAlerts.forEach((a) => {
      if (String(a?.status || '').toLowerCase() === 'reserved') {
        list.push({ type: 'alert', id: a.id, data: a });
      }
    });

    reservationsActive.forEach((tx, i) => {
      list.push({ type: 'tx', id: `tx-active-${tx.id || i}`, data: tx });
    });

    return list;
  }, [myActiveAlerts, reservationsActive]);

  const reservationsFinalAll = useMemo(() => {
    const list = [];

    myFinalAlerts.forEach((a) => {
      list.push({ type: 'alert', id: a.id, data: a });
    });

    reservationsFinal.forEach((tx, i) => {
      list.push({ type: 'tx', id: `tx-final-${tx.id || i}`, data: tx });
    });

    return list;
  }, [myFinalAlerts, reservationsFinal]);

  const { mutateAsync: cancelReservation } = useMutation({
    mutationFn: async (alertId) => {
      return base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });

  const { mutateAsync: finalizeReservation } = useMutation({
    mutationFn: async (alertId) => {
      return base44.entities.ParkingAlert.update(alertId, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col">
      <Header title="Historial" showBackButton backTo="Home" />

      <main className="flex-1 px-3 pb-24 pt-2">
        <Tabs defaultValue="alertas" className="w-full">
          <TabsList className="w-full bg-transparent p-0 gap-2 h-11">
            <TabsTrigger
              value="alertas"
              className="flex-1 bg-gray-900 text-white data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl h-11"
            >
              Alertas
            </TabsTrigger>
            <TabsTrigger
              value="reservas"
              className="flex-1 bg-gray-900 text-white data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl h-11"
            >
              Reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alertas" className="mt-3">
            <div className="pt-1">
              <SectionTag variant="green" text="Activas" />
            </div>

            {myActiveAlerts.filter((a) => !hiddenKeys.has(a.id)).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
              >
                <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa.</p>
              </motion.div>
            ) : (
              <div className="space-y-[20px]">
                {myActiveAlerts.map((a, index) => {
                  const key = a.id;
                  if (hiddenKeys.has(key)) return null;

                  const createdTs = getCreatedTs(a);
                  const dateText = formatCardDate(createdTs);

                  const waitUntilTs = getWaitUntilTs(a);
                  const remainingMs = waitUntilTs ? Math.max(0, waitUntilTs - nowTs) : null;
                  const countdownText = remainingMs != null ? formatRemaining(remainingMs) : '--:--';

                  const phoneEnabled = Boolean(a.phone && a.allow_phone_calls !== false);
                  const carLabel = `${a.car_brand || ''} ${a.car_model || ''}`.trim();

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                    >
                      <CardHeaderRow
                        left={
                          <Badge
                            className={`bg-green-500/20 text-green-400 border border-green-500/30 ${badgePhotoWidth} ${labelNoClick}`}
                          >
                            Activa
                          </Badge>
                        }
                        dateText={dateText}
                        dateClassName="text-gray-400"
                        right={
                          <div className="flex items-center gap-1">
                            <MoneyChip mode="neutral" amountText={`${(a.price ?? 0).toFixed(2)}€`} />

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
                              <X className="w-4 h-4" />
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
                        timeLine={`Se iba en ${a.available_in_minutes ?? '--'} min · Te esperaba hasta las ${
                          waitUntilTs
                            ? new Date(waitUntilTs).toLocaleString('es-ES', {
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
                        statusText={countdownText}
                        phoneEnabled={phoneEnabled}
                        onCall={() => phoneEnabled && (window.location.href = `tel:${a.phone}`)}
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

            {myFinalAlerts.filter((a) => !hiddenKeys.has(a.id)).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
              >
                <p className="text-gray-500 font-semibold">No tienes ninguna alerta finalizada.</p>
              </motion.div>
            ) : (
              <div className="space-y-[20px]">
                {myFinalAlerts.map((a, index) => {
                  const key = a.id;
                  if (hiddenKeys.has(key)) return null;

                  const createdTs = toMs(a.created_date) || nowTs;
                  const dateText = createdTs ? formatCardDate(createdTs) : '--';

                  const waitUntilTs = getWaitUntilTs(a);
                  const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;
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
                      className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
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
                              <MoneyChip mode="red" showDownIcon amountText={`${(a.price ?? 0).toFixed(2)}€`} />
                            ) : (
                              <MoneyChip mode="neutral" amountText={`${(a.price ?? 0).toFixed(2)}€`} />
                            )}

                            <button
                              onClick={async () => {
                                hideKey(key);
                                const isMock = String(a.id).startsWith('mock-');
                                if (!isMock) {
                                  await deleteAlertSafe(a.id);
                                  queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
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
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservas" className="mt-3">
            <div className="pt-1">
              <SectionTag variant="green" text="Activas" />
            </div>

            {reservationsActiveAll.filter((item) => !hiddenKeys.has(item.id)).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
              >
                <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa.</p>
              </motion.div>
            ) : (
              <div className="space-y-[20px]">
                {reservationsActiveAll.map((item, index) => {
                  const key = item.id;
                  if (hiddenKeys.has(key)) return null;

                  if (item.type === 'alert') {
                    const a = item.data;

                    const createdTs = getCreatedTs(a);
                    const dateText = formatCardDate(createdTs);

                    const waitUntilTs = getWaitUntilTs(a);
                    const remainingMs = waitUntilTs ? Math.max(0, waitUntilTs - nowTs) : null;
                    const countdownText = remainingMs != null ? formatRemaining(remainingMs) : '--:--';

                    const phoneEnabled = Boolean(a.phone && a.allow_phone_calls !== false);
                    const carLabel = `${a.car_brand || ''} ${a.car_model || ''}`.trim();

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                      >
                        <CardHeaderRow
                          left={
                            <Badge
                              className={`bg-green-500/20 text-green-400 border border-green-500/30 ${badgePhotoWidth} ${labelNoClick}`}
                            >
                              Activa
                            </Badge>
                          }
                          dateText={dateText}
                          dateClassName="text-gray-400"
                          right={
                            <div className="flex items-center gap-1">
                              <MoneyChip mode="neutral" amountText={`${(a.price ?? 0).toFixed(2)}€`} />
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
                                <X className="w-4 h-4" />
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
                          timeLine={`Se iba en ${a.available_in_minutes ?? '--'} min · Te esperaba hasta las ${
                            waitUntilTs
                              ? new Date(waitUntilTs).toLocaleString('es-ES', {
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
                          statusText={countdownText}
                          phoneEnabled={phoneEnabled}
                          onCall={() => phoneEnabled && (window.location.href = `tel:${a.phone}`)}
                          statusEnabled={false}
                          dimIcons={true}
                        />
                      </motion.div>
                    );
                  }

                  // item.type === 'tx'
                  const tx = item.data;

                  const ts = toMs(tx.created_date);
                  const dateText = ts ? formatCardDate(ts) : '--';

                  const sellerName = getTxSellerName(tx);
                  const sellerPhoto = getTxSellerPhoto(tx);

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

                  const amount = (tx.amount ?? 0).toFixed(2);

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                    >
                      <CardHeaderRow
                        left={
                          <Badge
                            className={`bg-green-500/20 text-green-400 border border-green-500/30 ${badgePhotoWidth} ${labelNoClick}`}
                          >
                            Activa
                          </Badge>
                        }
                        dateText={dateText}
                        dateClassName="text-gray-400"
                        right={
                          <div className="flex items-center gap-1">
                            <MoneyChip mode="neutral" amountText={`${amount}€`} />
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
                        timeLine={`Reserva activa · ${
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
                        statusText="RESERVADA"
                        statusEnabled={true}
                        dimIcons={true}
                      />

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 font-bold"
                          onClick={async () => {
                            try {
                              await cancelReservation(tx.alert_id);
                              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                            } catch (e) {}
                          }}
                        >
                          CANCELAR
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10 font-bold"
                          onClick={async () => {
                            try {
                              await finalizeReservation(tx.alert_id);
                              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                            } catch (e) {}
                          }}
                        >
                          FINALIZAR
                        </Button>
                        <Button
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 font-bold px-4 flex items-center gap-2"
                          onClick={() => (window.location.href = createPageUrl(`Navigate?alertId=${tx.alert_id}`))}
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
                <p className="text-gray-500 font-semibold">No tienes ninguna alerta finalizada.</p>
              </motion.div>
            ) : (
              <div className="space-y-[20px]">
                {reservationsFinalAll.map((item, index) => {
                  const key = item.id;
                  if (hiddenKeys.has(key)) return null;

                  const finalizedCardClass = 'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';

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
                                <MoneyChip mode="red" showDownIcon amountText={`${(a.price ?? 0).toFixed(2)}€`} />
                              ) : (
                                <MoneyChip mode="neutral" amountText={`${(a.price ?? 0).toFixed(2)}€`} />
                              )}

                              <button
                                onClick={async () => {
                                  hideKey(key);
                                  const isMock = String(a.id).startsWith('mock-');
                                  if (!isMock) {
                                    await deleteAlertSafe(a.id);
                                    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
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
                              <MoneyChip mode="red" showDownIcon amountText={`${(tx.amount ?? 0).toFixed(2)}€`} />
                            ) : (
                              <MoneyChip mode="neutral" amountText={`${(tx.amount ?? 0).toFixed(2)}€`} />
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
                          (window.location.href = createPageUrl(`Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`))
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

      <BottomNav />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}
    </div>
  );
}