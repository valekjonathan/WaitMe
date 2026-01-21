import React, { useState, useEffect, useRef } from 'react';
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
  PhoneOff
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
  const queryClient = useQueryClient();

  // ====== UI helpers ======
  const labelNoClick = 'cursor-default select-none pointer-events-none';
  const noScrollBar =
    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  // ====== Fecha: "19 Enero - 21:05" ======
  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const raw = format(new Date(ts), 'd MMMM - HH:mm', { locale: es }); // "19 enero - 21:05"
    return raw.replace(/^\d+\s+([a-záéíóúñ]+)/i, (m, mon) => {
      const cap = mon.charAt(0).toUpperCase() + mon.slice(1);
      return m.replace(mon, cap);
    });
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
    <svg viewBox="0 0 48 24" className={size} fill="none">
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

    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;

    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isNaN(n) && /^\d+(?:\.\d+)?$/.test(s)) return n < 1e12 ? n * 1000 : n;
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
    const createdTs = getCreatedTs(alert);
    if (!createdTs) return null;

    const dateFields = [
      alert.wait_until,
      alert.waitUntil,
      alert.expires_at,
      alert.expiresAt,
      alert.ends_at,
      alert.endsAt,
      alert.available_until,
      alert.availableUntil
    ].filter(Boolean);

    for (const v of dateFields) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) return t;
    }

    const mins =
      Number(alert.available_in_minutes) ||
      Number(alert.availableInMinutes) ||
      Number(alert.duration_minutes) ||
      Number(alert.durationMinutes);

    if (Number.isFinite(mins) && mins > 0) return createdTs + mins * 60000;

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

  const CountdownButton = ({ text }) => (
    <Button
      type="button"
      variant="outline"
      disabled
      className="w-full h-9 border-2 border-purple-500/30 bg-purple-600/10 text-purple-300 hover:bg-purple-600/10 hover:text-purple-300 flex items-center justify-center font-mono font-bold text-sm cursor-default"
    >
      {text}
    </Button>
  );

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
    priceChip
  }) => {
    const isCompleted = String(statusText || '').toUpperCase() === 'COMPLETADA';

    return (
      <>
        {/* FOTO + DATOS */}
        <div className="flex gap-2.5">
          <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600/70 bg-gray-800/30 flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover opacity-40 grayscale"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600 opacity-40">
                👤
              </div>
            )}
          </div>

          <div className="flex-1 h-[85px] flex flex-col">
            <p className="font-bold text-xl text-gray-300 leading-none opacity-70 min-h-[22px]">
              {(name || '').split(' ')[0] || 'Usuario'}
            </p>

            {/* BMW... bajado un poquito (sin mover nombre ni matrícula) */}
            <p className="text-sm font-medium text-gray-400 leading-none opacity-70 flex-1 flex items-center truncate relative top-[2px]">
              {carLabel || 'Sin datos'}
            </p>

            {/* Matrícula + coche (coche centrado en el espacio desde matrícula al borde derecho) */}
            <div className="flex items-end gap-2 mt-1 min-h-[28px]">
              <div className="opacity-45 flex-shrink-0">
                <PlateProfile plate={plate} />
              </div>

              <div className="flex-1 flex justify-center">
                <div className="opacity-45 flex-shrink-0 relative -top-[1px]">
                  <CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rayita + líneas (apagado pero visible) */}
        <div className="pt-1.5 border-t border-gray-800/70 mt-2">
          <div className="space-y-1.5 opacity-80">
            {address ? (
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className="text-gray-300 leading-5 line-clamp-1">{address}</span>
              </div>
            ) : null}

            {timeLine ? (
              <div className="flex items-start gap-1.5 text-xs">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className="text-gray-300 leading-5">{timeLine}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Botonera */}
        <div className="mt-2">
          <div className="flex gap-2">
            {/* CHAT VERDE NORMAL */}
            <Button
              size="icon"
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
              onClick={onChat}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 h-8 w-[42px] opacity-50 cursor-not-allowed"
              disabled
            >
              <PhoneOff className="w-4 h-4 text-gray-600" />
            </Button>

            {/* COMPLETADA encendida como "Alerta finalizada" */}
            <div className="flex-1">
              <div
                className={`w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 ${
                  isCompleted ? 'border-purple-500/30 bg-purple-600/10' : 'border-gray-700 bg-gray-800/60'
                }`}
              >
                <span
                  className={`text-sm font-mono font-bold ${
                    isCompleted ? 'text-purple-300' : 'text-gray-400 opacity-70'
                  }`}
                >
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

  // ====== Data ======
  const { data: myAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['myAlerts', user?.id],
    queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.id],
    queryFn: async () => {
      const [asSeller, asBuyer] = await Promise.all([
        base44.entities.Transaction.filter({ seller_id: user?.id }),
        base44.entities.Transaction.filter({ buyer_id: user?.id })
      ]);
      return [...asSeller, ...asBuyer];
    },
    enabled: !!user?.id
  });

  // Activas (tuyas)
  const myActiveAlerts = myAlerts.filter(
    (a) => a.user_id === user?.id && (a.status === 'active' || a.status === 'reserved')
  );

  // Finalizadas tuyas como alertas
  const myFinalizedAlerts = myAlerts.filter(
    (a) =>
      a.user_id === user?.id &&
      (a.status === 'expired' || a.status === 'cancelled' || a.status === 'completed')
  );

  // Reservas (tuyas como comprador)
  const myReservationsReal = myAlerts.filter(
    (a) => a.reserved_by_id === user?.id && a.status === 'reserved'
  );

  // ====== MOCKS para reservas (5 activas + 5 finalizadas) ======
  const mockReservationsActive = [
    {
      id: 'mock-res-1',
      status: 'reserved',
      reserved_by_id: user?.id,
      user_id: 'seller-1',
      user_email: 'seller1@test.com',
      user_name: 'Sofía',
      user_photo:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_color: 'rojo',
      car_plate: '7780KLP',
      address: 'Plaza de España, 1',
      available_in_minutes: 6,
      price: 2.5,
      created_date: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 10).toISOString()
    },
    {
      id: 'mock-res-2',
      status: 'reserved',
      reserved_by_id: user?.id,
      user_id: 'seller-2',
      user_email: 'seller2@test.com',
      user_name: 'Raúl',
      user_photo:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      car_brand: 'Audi',
      car_model: 'A3',
      car_color: 'azul',
      car_plate: '1209KLP',
      address: 'Calle Uría, 10',
      available_in_minutes: 12,
      price: 3.0,
      created_date: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 18).toISOString()
    },
    {
      id: 'mock-res-3',
      status: 'reserved',
      reserved_by_id: user?.id,
      user_id: 'seller-3',
      user_email: 'seller3@test.com',
      user_name: 'Marta',
      user_photo:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
      car_brand: 'Toyota',
      car_model: 'Yaris',
      car_color: 'gris',
      car_plate: '5678DEF',
      address: 'Avenida del Paseo, 25',
      available_in_minutes: 28,
      price: 4.2,
      created_date: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 30).toISOString()
    },
    {
      id: 'mock-res-4',
      status: 'reserved',
      reserved_by_id: user?.id,
      user_id: 'seller-4',
      user_email: 'seller4@test.com',
      user_name: 'Diego',
      user_photo:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      car_brand: 'Mercedes',
      car_model: 'Clase A',
      car_color: 'negro',
      car_plate: '9812GHJ',
      address: 'Calle Covadonga, 7',
      available_in_minutes: 45,
      price: 5.0,
      created_date: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 50).toISOString()
    },
    {
      id: 'mock-res-5',
      status: 'reserved',
      reserved_by_id: user?.id,
      user_id: 'seller-5',
      user_email: 'seller5@test.com',
      user_name: 'Laura',
      user_photo:
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
      car_brand: 'Renault',
      car_model: 'Clio',
      car_color: 'blanco',
      car_plate: '4444XYZ',
      address: 'Calle Rosal, 4',
      available_in_minutes: 9,
      price: 1.8,
      created_date: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      wait_until: new Date(Date.now() + 1000 * 60 * 12).toISOString()
    }
  ];

  const mockReservationsFinal = [
    {
      id: 'mock-res-fin-1',
      status: 'completed',
      reserved_by_id: user?.id,
      user_id: 'seller-8',
      user_email: 'seller8@test.com',
      user_name: 'Hugo',
      user_photo:
        'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=400&fit=crop',
      car_brand: 'BMW',
      car_model: 'Serie 1',
      car_color: 'gris',
      car_plate: '2847BNM',
      address: 'Calle Gran Vía, 25',
      available_in_minutes: 8,
      price: 4.0,
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      id: 'mock-res-fin-2',
      status: 'cancelled',
      reserved_by_id: user?.id,
      user_id: 'seller-9',
      user_email: 'seller9@test.com',
      user_name: 'Nuria',
      user_photo:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      car_brand: 'Seat',
      car_model: 'León',
      car_color: 'rojo',
      car_plate: '9812GHJ',
      address: 'Calle Pelayo, 3',
      available_in_minutes: 15,
      price: 3.0,
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'mock-res-fin-3',
      status: 'expired',
      reserved_by_id: user?.id,
      user_id: 'seller-10',
      user_email: 'seller10@test.com',
      user_name: 'Iván',
      user_photo:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      car_brand: 'Audi',
      car_model: 'A4',
      car_color: 'azul',
      car_plate: '1209KLP',
      address: 'Calle Campoamor, 15',
      available_in_minutes: 10,
      price: 2.8,
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    },
    {
      id: 'mock-res-fin-4',
      status: 'completed',
      reserved_by_id: user?.id,
      user_id: 'seller-11',
      user_email: 'seller11@test.com',
      user_name: 'Sara',
      user_photo:
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
      car_brand: 'Toyota',
      car_model: 'Corolla',
      car_color: 'blanco',
      car_plate: '4444XYZ',
      address: 'Avenida Galicia, 44',
      available_in_minutes: 20,
      price: 5.5,
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    },
    {
      id: 'mock-res-fin-5',
      status: 'cancelled',
      reserved_by_id: user?.id,
      user_id: 'seller-12',
      user_email: 'seller12@test.com',
      user_name: 'Pablo',
      user_photo:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      car_brand: 'Renault',
      car_model: 'Megane',
      car_color: 'negro',
      car_plate: '7001JRV',
      address: 'Calle Jovellanos, 9',
      available_in_minutes: 25,
      price: 2.0,
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString()
    }
  ];

  // ====== Transacciones mock (para Marco en tus alertas finalizadas) ======
  const mockTransactions = [
    {
      id: 'mock-tx-1',
      seller_id: user?.id,
      seller_name: 'Tu',
      buyer_id: 'buyer-1',
      buyer_name: 'Marco',
      buyer_photo_url:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      buyer_car: 'BMW Serie 3',
      buyer_car_color: 'gris',
      buyer_plate: '2847BNM',
      amount: 5.0,
      seller_earnings: 4.0,
      platform_fee: 1.0,
      status: 'completed',
      address: 'Calle Gran Vía, 25',
      alert_id: 'mock-alert-1',
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    }
  ];

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

  const reservationsFinalAll = [
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
  ].sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0));

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

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Alertas" showBackButton={true} backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mt-4 mb-1">
            <TabsTrigger value="alerts" className="flex-1 data-[state=active]:bg-purple-600">
              Tus alertas
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-purple-600">
              Tus reservas
            </TabsTrigger>
          </TabsList>

          {/* ===================== TUS ALERTAS ===================== */}
          <TabsContent
            value="alerts"
            className={`space-y-1.5 max-h-[calc(100vh-126px)] overflow-y-auto pr-0 ${noScrollBar}`}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                {/* ACTIVAS */}
                <div className="flex justify-center pt-0">
                  <div
                    className={`bg-green-500/20 border border-green-500/30 rounded-md px-4 h-7 flex items-center justify-center text-green-400 font-bold text-xs text-center ${labelNoClick}`}
                  >
                    Activas
                  </div>
                </div>

                {myActiveAlerts.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
                    <div className="h-[110px] flex items-center justify-center">
                      <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {myActiveAlerts
                      .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
                      .map((alert, index) => {
                        const createdTs = getCreatedTs(alert) || nowTs;
                        const waitUntilTs = getWaitUntilTs(alert);
                        const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;

                        const remainingMs = hasExpiry ? Math.max(0, waitUntilTs - nowTs) : null;
                        const waitUntilLabel = hasExpiry
                          ? format(new Date(waitUntilTs), 'HH:mm', { locale: es })
                          : '--:--';

                        if (
                          alert.status === 'active' &&
                          hasExpiry &&
                          remainingMs <= 0 &&
                          !autoFinalizedRef.current.has(alert.id) &&
                          !expireAlertMutation.isPending
                        ) {
                          autoFinalizedRef.current.add(alert.id);
                          expireAlertMutation.mutate(alert.id);
                        }

                        const countdownText =
                          remainingMs === null
                            ? '--:--'
                            : remainingMs > 0
                            ? formatRemaining(remainingMs)
                            : 'Alerta finalizada';

                        const cardKey = `active-${alert.id}`;
                        if (hiddenKeys.has(cardKey)) return null;

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
                                <div className="flex items-center justify-between mb-2">
                                  <Badge
                                    className={`bg-purple-500/20 text-purple-400 border border-purple-500/30 border flex items-center justify-center text-center ${labelNoClick}`}
                                  >
                                    Reservado por:
                                  </Badge>

                                  <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                                    {formatCardDate(createdTs)}
                                  </span>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                      <TrendingUp className="w-4 h-4 text-green-400" />
                                      <span className="text-green-400 font-bold text-sm">
                                        {alert.price.toFixed(2)}€
                                      </span>
                                    </div>
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
                                </div>

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
                                      address={alert.address}
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
                                      onCall={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
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
                                    {alert.address || 'Ubicación marcada'}
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
                                  <CountdownButton text={countdownText} />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <Badge
                                    className={`bg-green-500/20 text-green-400 border border-green-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                                  >
                                    Activa
                                  </Badge>

                                  <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                                    {formatCardDate(createdTs)}
                                  </span>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                      <TrendingUp className="w-4 h-4 text-green-400" />
                                      <span className="text-green-400 font-bold text-sm">
                                        {alert.price.toFixed(2)}€
                                      </span>
                                    </div>
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
                                </div>

                                <div className="flex items-start gap-1.5 text-xs mb-2">
                                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-gray-400 leading-5">
                                    {alert.address || 'Ubicación marcada'}
                                  </span>
                                </div>

                                <div className="flex items-start gap-1.5 text-xs">
                                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-gray-500 leading-5">
                                    Te vas en {alert.available_in_minutes} min ·{' '}
                                  </span>
                                  <span className="text-purple-400 leading-5">
                                    Debes esperar hasta las {waitUntilLabel}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <CountdownButton text={countdownText} />
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                )}

                {/* FINALIZADAS */}
                <div className="flex justify-center pt-2">
                  <div
                    className={`bg-red-500/20 border border-red-500/30 rounded-md px-4 h-7 flex items-center justify-center text-red-400 font-bold text-xs text-center ${labelNoClick}`}
                  >
                    Finalizadas
                  </div>
                </div>

                {myFinalizedAll.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes alertas finalizadas</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {myFinalizedAll.map((item, index) => {
                      const finalizedCardClass =
                        'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';
                      const key = item.id;
                      if (hiddenKeys.has(key)) return null;

                      if (item.type === 'alert') {
                        const a = item.data;
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={finalizedCardClass}
                          >
                            <div className="flex items-center justify-between mb-2 opacity-100">
                              <Badge
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                              >
                                Finalizada
                              </Badge>

                              <span className="text-gray-600 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                                {(() => {
                                  const ts = toMs(a.created_date);
                                  return ts ? formatCardDate(ts) : '--';
                                })()}
                              </span>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <div className="bg-gray-500/10 border border-gray-600 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                  <span className="font-bold text-gray-400 text-sm">
                                    {(a.price ?? 0).toFixed(2)}€
                                  </span>
                                </div>
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
                            </div>

                            <div className="flex items-start gap-1.5 text-xs mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                              <span className="text-gray-400 leading-5">
                                {a.address || 'Ubicación marcada'}
                              </span>
                            </div>

                            <div className="mt-2">
                              <CountdownButton text="Alerta finalizada" />
                            </div>
                          </motion.div>
                        );
                      }

                      // Transacción finalizada (Marco)
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

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={finalizedCardClass}
                        >
                          <div className="flex items-center justify-between mb-2 opacity-100">
                            <Badge
                              className={`bg-red-500/20 text-red-400 border border-red-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                            >
                              Finalizada
                            </Badge>

                            <span className="text-gray-600 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                              {ts ? formatCardDate(ts) : '--'}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isSeller ? (
                                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                  <span className="font-bold text-green-400 text-sm">
                                    {(tx.seller_earnings ?? 0).toFixed(2)}€
                                  </span>
                                </div>
                              ) : (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                  <TrendingDown className="w-4 h-4 text-red-400" />
                                  <span className="font-bold text-red-400 text-sm">
                                    -{(tx.amount ?? 0).toFixed(2)}€
                                  </span>
                                </div>
                              )}

                              <Button
                                size="icon"
                                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                onClick={() => hideKey(key)}
                              >
                                <X className="w-4 h-4" strokeWidth={3} />
                              </Button>
                            </div>
                          </div>

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
          <TabsContent
            value="reservations"
            className={`space-y-1.5 max-h-[calc(100vh-126px)] overflow-y-auto pr-0 ${noScrollBar}`}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                {/* ACTIVAS */}
                <div className="flex justify-center pt-0">
                  <div
                    className={`bg-green-500/20 border border-green-500/30 rounded-md px-4 h-7 flex items-center justify-center text-green-400 font-bold text-xs text-center ${labelNoClick}`}
                  >
                    Activas
                  </div>
                </div>

                {reservationsActiveAll.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
                    <div className="h-[110px] flex items-center justify-center">
                      <p className="text-gray-500 font-semibold">No tienes reservas</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {reservationsActiveAll.map((alert, index) => {
                      const createdTs = getCreatedTs(alert) || nowTs;
                      const waitUntilTs = getWaitUntilTs(alert);
                      const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;
                      const waitUntilLabel = hasExpiry
                        ? format(new Date(waitUntilTs), 'HH:mm', { locale: es })
                        : '--:--';

                      const key = `res-active-${alert.id}`;
                      if (hiddenKeys.has(key)) return null;

                      const carLabel = `${alert.car_brand || ''} ${alert.car_model || ''}`.trim();

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              className={`bg-green-500/20 text-green-400 border border-green-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                            >
                              Activa
                            </Badge>

                            <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                              {formatCardDate(createdTs)}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                                <span className="font-bold text-red-400 text-sm">
                                  -{(alert.price ?? 0).toFixed(2)}€
                                </span>
                              </div>

                              <Button
                                size="icon"
                                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                onClick={async () => {
                                  hideKey(key);

                                  const isMock = String(alert.id).startsWith('mock-');
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
                          </div>

                          <MarcoContent
                            photoUrl={alert.user_photo}
                            name={alert.user_name}
                            carLabel={carLabel || 'Sin datos'}
                            plate={alert.car_plate}
                            carColor={alert.car_color}
                            address={alert.address}
                            timeLine={`Se va en ${alert.available_in_minutes} min · Te espera hasta las ${waitUntilLabel}`}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${alert.id}&userId=${alert.user_email || alert.user_id}`
                              ))
                            }
                            statusText="EN CURSO"
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* FINALIZADAS */}
                <div className="flex justify-center pt-2">
                  <div
                    className={`bg-red-500/20 border border-red-500/30 rounded-md px-4 h-7 flex items-center justify-center text-red-400 font-bold text-xs text-center ${labelNoClick}`}
                  >
                    Finalizadas
                  </div>
                </div>

                {reservationsFinalAll.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes reservas finalizadas</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {reservationsFinalAll.map((item, index) => {
                      const key = item.id;
                      if (hiddenKeys.has(key)) return null;

                      if (item.type === 'alert') {
                        const a = item.data;
                        const ts = toMs(a.created_date);
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                          >
                            <div className="flex items-center justify-between mb-2 opacity-100">
                              <Badge
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                              >
                                Finalizada
                              </Badge>

                              <span className="text-gray-600 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                                {ts ? formatCardDate(ts) : '--'}
                              </span>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                  <TrendingDown className="w-4 h-4 text-red-400" />
                                  <span className="font-bold text-red-400 text-sm">
                                    -{(a.price ?? 0).toFixed(2)}€
                                  </span>
                                </div>

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
                            </div>

                            <div className="flex items-start gap-1.5 text-xs mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                              <span className="text-gray-400 leading-5">
                                {a.address || 'Ubicación marcada'}
                              </span>
                            </div>

                            <div className="mt-2">
                              <CountdownButton text="Reserva finalizada" />
                            </div>
                          </motion.div>
                        );
                      }

                      // Finalizada como transacción
                      const tx = item.data;
                      const ts = toMs(tx.created_date);

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

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                        >
                          <div className="flex items-center justify-between mb-2 opacity-100">
                            <Badge
                              className={`bg-red-500/20 text-red-400 border border-red-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                            >
                              Finalizada
                            </Badge>

                            <span className="text-gray-600 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                              {ts ? formatCardDate(ts) : '--'}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                                <span className="font-bold text-red-400 text-sm">
                                  -{(tx.amount ?? 0).toFixed(2)}€
                                </span>
                              </div>

                              <Button
                                size="icon"
                                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                onClick={() => hideKey(key)}
                              >
                                <X className="w-4 h-4" strokeWidth={3} />
                              </Button>
                            </div>
                          </div>

                          <MarcoContent
                            photoUrl={sellerPhoto}
                            name={sellerName}
                            carLabel={sellerCarLabel || 'Sin datos'}
                            plate={sellerPlate}
                            carColor={sellerColor}
                            address={tx.address}
                            timeLine={`Transacción completada · ${
                              ts ? format(new Date(ts), 'HH:mm', { locale: es }) : '--:--'
                            }`}
                            onChat={() =>
                              (window.location.href = createPageUrl(
                                `Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`
                              ))
                            }
                            statusText="COMPLETADA"
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

      {/* Tracker para reservadas (tus alertas) */}
      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}
    </div>
  );
}