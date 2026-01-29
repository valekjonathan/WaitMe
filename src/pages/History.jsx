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
      // Si ya es timestamp en milisegundos (>= 1e12), devolverlo tal cual
      if (v >= 1e12) return v;
      // Si es timestamp en segundos (< 1e12), convertir a ms
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
      alert?.created
    ];
    for (const v of candidates) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) return t;
    }
    return null;
  };

  const getWaitUntilTs = (alert) => {
    // Intentar usar wait_until si existe
    if (alert.wait_until) {
      const t = toMs(alert.wait_until);
      if (typeof t === 'number' && t > 0) {
        return t;
      }
    }

    // Si no hay wait_until válido, SIEMPRE calcularlo desde created_date + minutes
    const createdTs = getCreatedTs(alert);
    const mins = Number(alert.available_in_minutes);
    
    if (createdTs && Number.isFinite(mins) && mins > 0) {
      return createdTs + (mins * 60 * 1000);
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        () => {}
      );
    }
    // Actualizar cada segundo para countdown preciso
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ====== Data ======
  const { data: myAlerts = [], isLoading: loadingAlerts, refetch } = useQuery({
        queryKey: ['myAlerts', user?.id],
        queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
        enabled: !!user?.id,
        staleTime: 5000,
        refetchInterval: false
      });

  useEffect(() => {
    refetch();
  }, []);

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
    staleTime: 30000,
    refetchInterval: false
  });

  // ====== MOCKS (ESTABLES: NO se regeneran con cada tick) ======
  // Mock para "Tus alertas" activas
  const mockMyActiveAlerts = useMemo(() => {
    const baseNow = Date.now();
    return [
      {
        id: 'mock-my-active-1',
        status: 'active',
        user_id: user?.id,
        user_email: 'test@test.com',
        user_name: 'Tu',
        address: 'Calle Campoamor, n3, Oviedo',
        car_brand: 'Seat',
        car_model: 'León',
        car_color: 'rojo',
        car_plate: '5555ABC',
        available_in_minutes: 25,
        price: 3.0,
        created_date: new Date(baseNow).toISOString(),
        wait_until: new Date(baseNow + 1000 * 60 * 25).toISOString()
      }
    ];
  }, [user?.id]);

  const mockReservationsActive = useMemo(() => {
    const baseNow = Date.now();
    return [
      {
        id: 'mock-res-1',
        status: 'reserved',
        reserved_by_id: user?.id,
        user_id: 'seller-1',
        user_email: 'seller1@test.com',
        user_name: 'Sofía',
        user_photo: avatarFor('Sofía'),
        car_brand: 'Seat',
        car_model: 'Ibiza',
        car_color: 'rojo',
        car_plate: '7780KLP',
        address: 'Calle Gran Vía, 1',
        available_in_minutes: 6,
        price: 2.5,
        phone: '600123123',
        allow_phone_calls: true,
        created_date: new Date(baseNow - 1000 * 60 * 2).toISOString(),
        wait_until: new Date(baseNow + 1000 * 60 * 10).toISOString()
      }
    ];
  }, [user?.id]);

  const mockReservationsFinal = useMemo(() => {
    const baseNow = Date.now();
    return [
      {
        id: 'mock-res-fin-1',
        status: 'completed',
        reserved_by_id: user?.id,
        user_id: 'seller-8',
        user_email: 'seller8@test.com',
        user_name: 'Hugo',
        user_photo: avatarFor('Hugo'),
        car_brand: 'BMW',
        car_model: 'Serie 1',
        car_color: 'gris',
        car_plate: '2847BNM',
        address: 'Calle Gran Vía, 25',
        available_in_minutes: 8,
        price: 4.0,
        phone: '611111111',
        allow_phone_calls: false,
        created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'mock-res-fin-2',
        status: 'cancelled',
        reserved_by_id: user?.id,
        user_id: 'seller-9',
        user_email: 'seller9@test.com',
        user_name: 'Nuria',
        user_photo: avatarFor('Nuria'),
        car_brand: 'Audi',
        car_model: 'A3',
        car_color: 'azul',
        car_plate: '1209KLP',
        address: 'Calle Uría, 10',
        available_in_minutes: 12,
        price: 3.0,
        phone: '622222222',
        allow_phone_calls: true,
        created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 3).toISOString()
      },
      {
        id: 'mock-res-fin-3',
        status: 'expired',
        reserved_by_id: user?.id,
        user_id: 'seller-10',
        user_email: 'seller10@test.com',
        user_name: 'Iván',
        user_photo: avatarFor('Iván'),
        car_brand: 'Toyota',
        car_model: 'Yaris',
        car_color: 'blanco',
        car_plate: '4444XYZ',
        address: 'Calle Campoamor, 15',
        available_in_minutes: 10,
        price: 2.8,
        phone: null,
        allow_phone_calls: false,
        created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 5).toISOString()
      }
    ];
  }, [user?.id]);

  const mockTransactions = useMemo(() => {
    const baseNow = Date.now();
    return [
      {
        id: 'mock-tx-1',
        seller_id: user?.id,
        seller_name: 'Tu',
        buyer_id: 'buyer-1',
        buyer_name: 'Marco',
        buyer_photo_url: avatarFor('Marco'),
        buyer_car: 'BMW Serie 3',
        buyer_car_color: 'gris',
        buyer_plate: '2847BNM',
        amount: 5.0,
        seller_earnings: 4.0,
        platform_fee: 1.0,
        status: 'completed',
        address: 'Calle Gran Vía, 25',
        alert_id: 'mock-alert-1',
        created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 2).toISOString()
      }
    ];
  }, [user?.id]);

  // Mock extra para ver una tarjeta CANCELADA en "Tus alertas"
  const mockMyFinalizedAlerts = useMemo(() => {
    const baseNow = Date.now();
    return [
      {
        id: 'mock-my-fin-cancel-1',
        status: 'cancelled',
        user_id: user?.id,
        address: 'Calle Uría, 10',
        available_in_minutes: 12,
        price: 3.0,
        created_date: new Date(baseNow - 1000 * 60 * 60 * 24 * 4).toISOString()
      }
    ];
  }, [user?.id]);

  // Activas (tuyas) - SOLO si NO han expirado
  const myActiveAlerts = useMemo(() => {
    const dbAlerts = myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;
      if (a.status !== 'active' && a.status !== 'reserved') return false;

      return true;
    });
    return [...dbAlerts, ...mockMyActiveAlerts];
  }, [myAlerts, user?.id, mockMyActiveAlerts]);

  // Finalizadas tuyas como alertas
  const myFinalizedAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;

      // SOLO incluir si el status indica finalizada
      if (a.status === 'expired' || a.status === 'cancelled' || a.status === 'completed') {
        return true;
      }

      return false;
    });
  }, [myAlerts, user?.id]);

  // Reservas (tuyas como comprador)
  const myReservationsReal = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.reserved_by_id !== user?.id) return false;
      if (a.status !== 'reserved') return false;

      return true;
    });
  }, [myAlerts, user?.id]);

  const myFinalizedAsSellerTx = [
    ...transactions.filter((t) => t.seller_id === user?.id),
    ...mockTransactions
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

  const myFinalizedAll = [
    ...myFinalizedAlerts.map((a) => ({
      type: 'alert',
      id: `final-alert-${a.id}`,
      created_date: a.created_date,
      data: a
    })),
    ...mockMyFinalizedAlerts.map((a) => ({
      type: 'alert',
      id: `final-mock-alert-${a.id}`,
      created_date: a.created_date,
      data: a
    })),
    ...myFinalizedAsSellerTx.map((t) => ({
      type: 'transaction',
      id: `final-tx-${t.id}`,
      created_date: t.created_date,
      data: t
    }))
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

  const reservationsActiveAll = [...myReservationsReal, ...mockReservationsActive].sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  // mocks caducadas (para que pasen a Finalizadas sin tocar BD)
  const mockExpiredFromActive = reservationsActiveAll
    .filter((a) => String(a.id).startsWith('mock-'))
    .map((a) => {
      const createdTs = getCreatedTs(a) || nowTs;
      const waitUntilTs = getWaitUntilTs(a);
      const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;
      const remainingMs = hasExpiry ? Math.max(0, waitUntilTs - nowTs) : null;
      if (!hasExpiry || remainingMs === null) return null;
      if (remainingMs > 0) return null;

      return {
        type: 'alert',
        id: `res-final-mock-expired-${a.id}`,
        created_date: a.created_date,
        data: { ...a, status: 'expired' }
      };
    })
    .filter(Boolean);

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
    })),
    ...mockExpiredFromActive
  ];

  const reservationsFinalAll = reservationsFinalAllBase.sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  const isLoading = loadingAlerts || loadingTransactions;

  // ====== Mutations ======
  const cancelAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
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
    <div className="min-h-screen bg-black text-white">
      <Header title="Alertas" showBackButton={true} backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          {/* FIX: sin borde negro debajo */}
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
          {/* FIX: más aire abajo para que la última tarjeta se vea entera */}
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

                         // Si no podemos calcular los timestamps, skip esta alerta
                         if (!createdTs || !waitUntilTs) {
                           console.warn('Alert sin timestamps válidos:', alert.id);
                           return null;
                         }

                         const remainingMs = Math.max(0, waitUntilTs - nowTs);
                         const waitUntilLabel = new Date(waitUntilTs).toLocaleString('es-ES', { 
                           timeZone: 'Europe/Madrid', 
                           hour: '2-digit', 
                           minute: '2-digit', 
                           hour12: false 
                         });
                         const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : 'EXPIRADA';

                         // Auto-finalizar si expiró
                         if (remainingMs <= 0 && alert.status === 'active') {
                           const isMock = String(alert.id).startsWith('mock-');
                           if (!isMock && !autoFinalizedRef.current.has(alert.id)) {
                             autoFinalizedRef.current.add(alert.id);
                             base44.entities.ParkingAlert
                               .update(alert.id, { status: 'expired' })
                               .finally(() => {
                                 queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                               });
                           }
                           return null;
                         }

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
                            {alert.status === 'reserved' ? (
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
                                  <span className="text-purple-400 leading-5">
                                    Debes esperar hasta las: {waitUntilLabel}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <CountdownButton text={countdownText} dimmed={countdownText === 'EXPIRADA'} />
                                </div>
                              </>
                            ) : (
                              <>
                                <CardHeaderRow
                                  left={
                                    <Badge
                                      className={`bg-green-500/25 text-green-300 border border-green-400/50 ${badgePhotoWidth} ${labelNoClick}`}
                                    >
                                      Activa
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
                                  <CountdownButton text={countdownText} dimmed={countdownText === 'EXPIRADA'} />
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
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

                            <div className="flex items-start gap-1.5 text-xs mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
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
                                {isSeller ? (
                                  <MoneyChip
                                    mode="green"
                                    showUpIcon
                                    amountText={`${(tx.seller_earnings ?? 0).toFixed(2)}€`}
                                  />
                                ) : (
                                  <MoneyChip
                                    mode="red"
                                    showDownIcon
                                    amountText={`${(tx.amount ?? 0).toFixed(2)}€`}
                                  />
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
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ===================== TUS RESERVAS ===================== */}
          {/* FIX: más aire abajo para que la última tarjeta se vea entera */}
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
                                className={`bg-green-500/25 text-green-300 border border-green-400/50 ${badgePhotoWidth} ${labelNoClick}`}
                              >
                                Activa
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
                                    amountText={`${(alert.price ?? 0).toFixed(2)}€`}
                                  />
                                ) : (
                                  <MoneyChip
                                    mode="neutral"
                                    amountText={`${(alert.price ?? 0).toFixed(2)}€`}
                                  />
                                )}

                                <Button
                                  size="icon"
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
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
                                      message: `He cancelado mi reserva de ${(alert.price ?? 0).toFixed(2)}€`,
                                      read: false
                                    });

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
                              ts ? new Date(ts).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'
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