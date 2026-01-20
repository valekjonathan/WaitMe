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
  PhoneOff,
  Car
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

  // ====== Copia exacta del formato "coche + matrícula" de Mi Perfil ======
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

  const Plate = ({ plate }) => (
    <div className="mt-2 flex items-center">
      <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
        <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">E</span>
        </div>
        <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
          {formatPlate(plate)}
        </span>
      </div>
    </div>
  );

  // (2) No clicables: "Activa/Activas/Finalizada/Finalizadas"
  const labelNoClick = 'cursor-default select-none pointer-events-none';

  // Parse robusto de timestamps: algunos backends devuelven segundos (10 dígitos) en vez de ms.
  const toMs = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return v.getTime();

    if (typeof v === 'number') {
      return v < 1e12 ? v * 1000 : v;
    }

    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isNaN(n) && /^\d+(?:\.\d+)?$/.test(s)) {
        return n < 1e12 ? n * 1000 : n;
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

  // Evita updates repetidos cuando el contador llega a 0
  const autoFinalizedRef = useRef(new Set());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }

    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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

  // Finalizadas tuyas como alertas (para que al llegar a 0 “pase” aquí)
  const myFinalizedAlerts = myAlerts.filter(
    (a) =>
      a.user_id === user?.id &&
      (a.status === 'expired' || a.status === 'cancelled' || a.status === 'completed')
  );

  // Reservas (tuyas como comprador)
  const myReservations = myAlerts.filter((a) => a.reserved_by_id === user?.id && a.status === 'reserved');

  // Finalizadas ficticias (solo para UI) -> para ver todos los tipos (SIN activas)
  // Importante: NO tocamos tus alertas reales; solo añadimos mocks extra.
  const mockTransactions = [
    {
      id: 'mock-tx-1',
      seller_id: user?.id,
      seller_name: 'Tu',
      buyer_id: 'buyer-1',
      buyer_name: 'Marco Rossi',
      buyer_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      buyer_car_brand: 'BMW',
      buyer_car_model: 'Serie 3',
      buyer_car_color: 'azul',
      buyer_car_plate: '2847BNM',
      amount: 5.0,
      seller_earnings: 4.0,
      platform_fee: 1.0,
      status: 'completed',
      address: 'Calle Gran Vía, 25',
      alert_id: 'mock-alert-1',
      created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-tx-2',
      seller_id: user?.id,
      seller_name: 'Tu',
      buyer_id: 'buyer-2',
      buyer_name: 'Sofia Gómez',
      buyer_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      buyer_car_brand: 'Seat',
      buyer_car_model: 'Ibiza',
      buyer_car_color: 'rojo',
      buyer_car_plate: '1209KLP',
      amount: 3.5,
      seller_earnings: 2.8,
      platform_fee: 0.7,
      status: 'completed',
      address: 'Avenida Paseo del Prado, 15',
      alert_id: 'mock-alert-2',
      created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-tx-3',
      seller_id: user?.id,
      seller_name: 'Tu',
      buyer_id: 'buyer-3',
      buyer_name: 'Diego López',
      buyer_photo_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=400&fit=crop',
      buyer_car_brand: 'Audi',
      buyer_car_model: 'A3',
      buyer_car_color: 'gris',
      buyer_car_plate: '7001JRV',
      amount: 4.5,
      seller_earnings: 3.6,
      platform_fee: 0.9,
      status: 'completed',
      address: 'Plaza Mayor, 8',
      alert_id: 'mock-alert-3',
      created_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Como comprador (sin foto -> se verá el formato "simple")
    {
      id: 'mock-tx-4',
      seller_id: 'seller-9',
      seller_name: 'Laura',
      buyer_id: user?.id,
      buyer_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Tú',
      amount: 6.0,
      status: 'completed',
      address: 'Calle Uría, 12',
      alert_id: 'mock-alert-4',
      created_date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Otra como vendedor pero sin foto (no debe mostrar matrícula estilo perfil)
    {
      id: 'mock-tx-5',
      seller_id: user?.id,
      seller_name: 'Tu',
      buyer_id: 'buyer-7',
      buyer_name: 'Hugo',
      amount: 2.0,
      seller_earnings: 1.6,
      platform_fee: 0.4,
      status: 'completed',
      address: 'Avenida Galicia, 44',
      alert_id: 'mock-alert-5',
      created_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const mockFinalizedAlerts = [
    {
      id: 'mock-final-a1',
      user_id: user?.id,
      status: 'expired',
      price: 4.0,
      address: 'Calle Pelayo, 3',
      created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-final-a2',
      user_id: user?.id,
      status: 'cancelled',
      price: 2.5,
      address: 'Plaza de España, 1',
      created_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-final-a3',
      user_id: user?.id,
      status: 'completed',
      price: 7.0,
      address: 'Calle Jovellanos, 9',
      created_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-final-a4',
      user_id: user?.id,
      status: 'expired',
      price: 3.0,
      address: 'Avenida de la Constitución, 20',
      created_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-final-a5',
      user_id: user?.id,
      status: 'cancelled',
      price: 5.5,
      address: 'Calle San Francisco, 6',
      created_date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const myFinalizedAsSellerTx = [...transactions.filter((t) => t.seller_id === user?.id), ...mockTransactions].sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  // (2) Borra (oculta en UI) las 4 últimas "sin éxito" (expired/cancelled)
  const successfulFinalAlerts = myFinalizedAlerts.filter((a) => a.status === 'completed');
  const unsuccessfulFinalAlerts = myFinalizedAlerts
    .filter((a) => a.status === 'expired' || a.status === 'cancelled')
    .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
    .slice(4);

  const finalizedAlertsForUI = [...successfulFinalAlerts, ...unsuccessfulFinalAlerts, ...mockFinalizedAlerts];

  // Finalizadas de vendedor (alertas + transacciones) ORDEN: más reciente arriba
  const myFinalizedAll = [
    ...finalizedAlertsForUI.map((a) => ({
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

  const myReservationsItems = [
    ...myReservations.map((a) => ({ type: 'alert', data: a, date: a.created_date })),
    ...transactions
      .filter((t) => t.buyer_id === user?.id)
      .map((t) => ({ type: 'transaction', data: t, date: t.created_date }))
  ].sort((a, b) => (toMs(b.date) || 0) - (toMs(a.date) || 0));

  const isLoading = loadingAlerts || loadingTransactions;

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
      // “Se cancela sola” al llegar a 0 -> la marcamos como expirada
      await base44.entities.ParkingAlert.update(alertId, { status: 'expired' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });

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

  // Más robusto: si el backend guarda otra propiedad de expiración, la usamos.
  // Si NO hay forma de calcularlo, devolvemos null para NO auto-expirar (evita que "aparezca y desaparezca").
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

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      reserved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      expired: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    const labels = {
      active: 'Activa',
      reserved: 'Reservado por:',
      completed: 'Completada',
      cancelled: 'Cancelada',
      expired: 'Expirada'
    };
    return (
      <Badge className={`${styles[status]} border flex items-center justify-center text-center ${labelNoClick}`}>
        {labels[status]}
      </Badge>
    );
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

  // (3) Bloque matricula estilo "perfil" (solo se usa en transacción completada)
  const PlateBlock = ({ plate }) => {
    const raw = String(plate || '').trim();
    if (!raw) return null;
    return <PlateProfile plate={raw} />;
  };

  const getBuyerPlate = (tx) => {
    return (
      tx?.buyer_plate ||
      tx?.buyerPlate ||
      tx?.buyer_car_plate ||
      tx?.buyerCarPlate ||
      tx?.car_plate ||
      tx?.carPlate ||
      ''
    );
  };

  const getBuyerCarLabel = (tx) => {
    const direct =
      tx?.buyer_car ||
      tx?.buyerCar ||
      tx?.vehicle ||
      tx?.car ||
      '';
    const brand = tx?.buyer_car_brand || tx?.buyerCarBrand || '';
    const model = tx?.buyer_car_model || tx?.buyerCarModel || '';
    const built = `${brand} ${model}`.trim();
    return (direct || built || '').trim();
  };

  const getBuyerPhoto = (tx) => {
    return (
      tx?.buyer_photo_url ||
      tx?.buyerPhotoUrl ||
      tx?.buyer_photo ||
      tx?.buyerPhoto ||
      tx?.buyer_photo_image ||
      tx?.buyerPhotoImage ||
      ''
    );
  };

  const getBuyerCarColor = (tx) => {
    return (
      tx?.buyer_car_color ||
      tx?.buyerCarColor ||
      tx?.car_color ||
      tx?.carColor ||
      ''
    );
  };

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

          {/* TUS ALERTAS */}
          <TabsContent
            value="alerts"
            className="space-y-1.5 max-h-[calc(100vh-126px)] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937' }}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                {/* ACTIVAS (no clicable) */}
                <div className="flex justify-center pt-0">
                  <div
                    className={`bg-green-500/20 border border-green-500/30 rounded-md px-4 h-7 flex items-center justify-center text-green-400 font-bold text-xs text-center ${labelNoClick}`}
                  >
                    Activas
                  </div>
                </div>

                {/* LISTA ACTIVAS o tarjeta vacía */}
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
                        const waitUntilLabel = hasExpiry ? format(new Date(waitUntilTs), 'HH:mm', { locale: es }) : '--:--';

                        // Auto-finaliza SOLO si hay expiración válida (evita que "aparezca y desaparezca")
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

                        return (
                          <motion.div
                            key={`active-${alert.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                          >
                            {alert.status === 'reserved' ? (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  {getStatusBadge(alert.status)}

                                  {/* FECHA EN BLANCO */}
                                  <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                                    {format(new Date(createdTs), 'd MMM, HH:mm', { locale: es })}
                                  </span>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                      <TrendingUp className="w-4 h-4 text-green-400" />
                                      <span className="text-green-400 font-bold text-sm">{alert.price.toFixed(2)}€</span>
                                    </div>
                                    <Button
                                      size="icon"
                                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                      onClick={() => cancelAlertMutation.mutate(alert.id)}
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
                                          `Chat?alertId=${alert.id}&userId=${alert.reserved_by_email || alert.reserved_by_id}`
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
                                  <span className="text-gray-400 leading-5">{alert.address || 'Ubicación marcada'}</span>
                                </div>

                                <div className="flex items-start justify-between text-xs">
                                  <div className="flex items-start gap-1.5">
                                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                    <span className="text-gray-500 leading-5">Te vas en {alert.available_in_minutes} min</span>
                                  </div>
                                  <span className="text-purple-400 leading-5">Debes esperar hasta las: {waitUntilLabel}</span>
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

                                  {/* FECHA EN BLANCO */}
                                  <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                                    {format(new Date(createdTs), 'd MMM, HH:mm', { locale: es })}
                                  </span>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                      <TrendingUp className="w-4 h-4 text-green-400" />
                                      <span className="text-green-400 font-bold text-sm">{alert.price.toFixed(2)}€</span>
                                    </div>
                                    <Button
                                      size="icon"
                                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                      onClick={() => cancelAlertMutation.mutate(alert.id)}
                                      disabled={cancelAlertMutation.isPending}
                                    >
                                      <X className="w-4 h-4" strokeWidth={3} />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-start gap-1.5 text-xs mb-2">
                                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-gray-400 leading-5">{alert.address || 'Ubicación marcada'}</span>
                                </div>

                                <div className="flex items-start gap-1.5 text-xs">
                                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-gray-500 leading-5">Te vas en {alert.available_in_minutes} min · </span>
                                  <span className="text-purple-400 leading-5">Debes esperar hasta las {waitUntilLabel}</span>
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

                {/* FINALIZADAS (no clicable) */}
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
                      // (1) Finalizadas SIN borde (apagar borde)
                // Finalizadas: borde exterior mas marcado (gris oscuro pero visible)
                const finalizedCardClass = 'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';

                      if (item.type === 'alert') {
                        const a = item.data;
                        return (
                          <motion.div
                            key={item.id}
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
                                  return ts ? format(new Date(ts), 'd MMM, HH:mm', { locale: es }) : '--';
                                })()}
                              </span>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <div className="bg-gray-500/10 border border-gray-600 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                                  <span className="font-bold text-gray-400 text-sm">{(a.price ?? 0).toFixed(2)}€</span>
                                </div>
                                <Button
                                  size="icon"
                                  disabled
                                  className="bg-gray-800 text-gray-500 rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-700 cursor-not-allowed"
                                  onClick={() => {}}
                                >
                                  <X className="w-4 h-4" strokeWidth={3} />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-start gap-1.5 text-xs mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                              <span className="text-gray-400 leading-5">{a.address || 'Ubicación marcada'}</span>
                            </div>

                            <div className="mt-2">
                              <CountdownButton text="Alerta finalizada" />
                            </div>
                          </motion.div>
                        );
                      }

                      // Transacción finalizada (COMPLETADA)
                      const tx = item.data;
                      const isSeller = tx.seller_id === user?.id;

                      return (
                        <motion.div
                          key={item.id}
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
                                const ts = toMs(tx.created_date);
                                return ts ? format(new Date(ts), 'd MMM, HH:mm', { locale: es }) : '--';
                              })()}
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
                                  <span className="font-bold text-red-400 text-sm">-{(tx.amount ?? 0).toFixed(2)}€</span>
                                </div>
                              )}

                              <Button
                                size="icon"
                                disabled
                                className="bg-gray-800 text-gray-500 rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-700 cursor-not-allowed"
                                onClick={() => {}}
                              >
                                <X className="w-4 h-4" strokeWidth={3} />
                              </Button>
                            </div>
                          </div>

                          {isSeller && tx.buyer_name && (
                            <div className="mb-1.5">
                              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-gray-700/70 flex flex-col">
                                {/* Apagado: foto + datos + matricula + direccion */}
                                <div className="opacity-55">
                                  <div className="flex gap-2.5 mb-1.5 flex-1">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600/70 bg-gray-800/50 flex-shrink-0">
                                        {(() => {
                                          const buyerPhoto = getBuyerPhoto(tx);
                                          return buyerPhoto ? (
                                            <img
                                              src={buyerPhoto}
                                              alt={tx.buyer_name}
                                              className="w-full h-full object-cover grayscale"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">👤</div>
                                          );
                                        })()}
                                      </div>
                                    </div>

                                    {/* Columna derecha: 3 lineas + matricula a la altura del borde inferior de la foto */}
                                    <div className="flex-1 flex flex-col h-[85px]">
                                      <p className="font-bold text-xl text-gray-200 leading-tight">
                                        {tx.buyer_name?.split(' ')[0]}
                                      </p>

                                      <div className="flex items-center justify-between mt-0.5">
                                        <p className="text-sm font-medium text-gray-300 leading-none pr-2 line-clamp-1">
                                          {getBuyerCarLabel(tx) || 'Sin datos'}
                                        </p>
                                        {getBuyerPhoto(tx) ? (
                                          <div className="opacity-70">
                                            <CarIconProfile color={getCarFill(getBuyerCarColor(tx))} size="w-14 h-9" />
                                          </div>
                                        ) : (
                                          <Car className="w-5 h-5 text-gray-500" />
                                        )}
                                      </div>

                                      {/* Misma matricula que en Perfil (mismo tamano). La subimos un poco. */}
                                      <div className="-mt-1 self-start">
                                        {getBuyerPhoto(tx) && <PlateBlock plate={getBuyerPlate(tx)} />}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-1.5 border-t border-gray-700/70">
                                    <div className="space-y-1.5">
                                      {tx.address && (
                                        <div className="flex items-start gap-1.5 text-xs">
                                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                          <span className="text-gray-400 leading-5 line-clamp-1">{tx.address}</span>
                                        </div>
                                      )}

                                      <div className="flex items-start gap-1.5 text-xs">
                                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                        <span className="text-gray-500 leading-5">
                                          Transacción completada ·{' '}
                                          {(() => {
                                            const ts = toMs(tx.created_date);
                                            return ts ? format(new Date(ts), 'HH:mm', { locale: es }) : '--:--';
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4">
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
                                    onClick={() =>
                                      (window.location.href = createPageUrl(
                                        `Chat?alertId=${tx.alert_id}&userId=${tx.buyer_id}`
                                      ))
                                    }
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-gray-700 h-8 w-[42px] opacity-40 cursor-not-allowed"
                                    disabled
                                  >
                                    <PhoneOff className="w-4 h-4 text-gray-600" />
                                  </Button>

                                  <div className="flex-1">
                                    <div className="w-full h-8 rounded-lg border-2 border-purple-500/30 bg-purple-600/10 flex items-center justify-center px-3">
                                      <span className="text-purple-300 text-sm font-mono font-bold">
                                        {tx.status === 'completed' ? 'COMPLETADA' : '--:--'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* TUS RESERVAS */}
          <TabsContent
            value="reservations"
            className="space-y-1.5 max-h-[calc(100vh-126px)] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937' }}
          >
            <p className="text-white text-[11px] mb-1 text-center font-bold">Reservaste a:</p>

            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : myReservationsItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tienes reservas</p>
              </div>
            ) : (
              myReservationsItems.map((item, index) => {
                if (item.type === 'alert') {
                  const alert = item.data;
                  const createdTs = getCreatedTs(alert) || nowTs;
                  const waitUntilTs = getWaitUntilTs(alert);
                  const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;
                  const waitUntilLabel = hasExpiry ? format(new Date(waitUntilTs), 'HH:mm', { locale: es }) : '--:--';

                  return (
                    <motion.div
                      key={`res-alert-${alert.id}`}
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
                        <span className="text-gray-500 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                          {format(new Date(createdTs), 'd MMM, HH:mm', { locale: es })}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-bold text-sm">-{alert.price.toFixed(2)}€</span>
                          </div>
                          <Button
                            size="icon"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                            onClick={async () => {
                              await base44.entities.ParkingAlert.update(alert.id, { status: 'cancelled' });
                              await base44.entities.ChatMessage.create({
                                alert_id: alert.id,
                                sender_id: user?.email || user?.id,
                                sender_name: user?.display_name || user?.full_name?.split(' ')[0] || 'Usuario',
                                receiver_id: alert.user_email || alert.user_id,
                                message: `He cancelado mi reserva de ${alert.price}€`,
                                read: false
                              });
                              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                            }}
                          >
                            <X className="w-4 h-4" strokeWidth={3} />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-1.5 h-[220px]">
                        <UserCard
                          userName={alert.user_name}
                          userPhoto={alert.user_photo}
                          carBrand={alert.car_brand}
                          carModel={alert.car_model}
                          carColor={alert.car_color}
                          carPlate={alert.car_plate}
                          vehicleType={alert.vehicle_type}
                          address={alert.address}
                          availableInMinutes={alert.available_in_minutes}
                          price={alert.price}
                          showLocationInfo={false}
                          showContactButtons={true}
                          onChat={() =>
                            (window.location.href = createPageUrl(
                              `Chat?alertId=${alert.id}&userId=${alert.user_email || alert.user_id}`
                            ))
                          }
                          onCall={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
                          latitude={alert.latitude}
                          longitude={alert.longitude}
                          allowPhoneCalls={alert.allow_phone_calls}
                          isReserved={true}
                        />
                      </div>

                      <div className="flex items-start gap-1.5 text-xs mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                        <span className="text-gray-400 leading-5">{alert.address || 'Ubicación marcada'}</span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs">
                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                        <span className="text-gray-500 leading-5">Se va en {alert.available_in_minutes} min ·</span>
                        <span className="text-purple-400 leading-5">Te espera hasta las {waitUntilLabel}</span>
                      </div>
                    </motion.div>
                  );
                }

                const tx = item.data;

                return (
                  <motion.div
                    key={`res-tx-${tx.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-900/50 rounded-xl p-2 border-2 border-gray-700 relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={`bg-red-500/20 text-red-400 border border-red-500/30 min-w-[85px] h-7 flex items-center justify-center text-center ${labelNoClick}`}
                      >
                        Finalizada
                      </Badge>
                      <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                        {(() => {
                          const ts = toMs(tx.created_date);
                          return ts ? format(new Date(ts), 'd MMM, HH:mm', { locale: es }) : '--';
                        })()}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="font-bold text-red-400 text-sm">-{(tx.amount ?? 0).toFixed(2)}€</span>
                        </div>
                        <Button
                          size="icon"
                          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                          onClick={() => {}}
                        >
                          <X className="w-4 h-4" strokeWidth={3} />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-1.5">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500/30 flex flex-col">
                        <div className="opacity-30">
                          <div className="flex gap-2.5 mb-1.5 flex-1">
                            <div className="flex flex-col gap-1.5">
                              <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800 flex-shrink-0">
                                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">👤</div>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                              <p className="font-bold text-xl text-gray-500 mb-1.5">{tx.seller_name?.split(' ')[0]}</p>

                              <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                                <p className="text-sm font-medium text-gray-500">Sin datos</p>
                                <Car className="w-5 h-5 text-gray-600" />
                              </div>

                              <div className="-mt-[7px] bg-gray-700 rounded-md flex items-center overflow-hidden border-2 border-gray-600 h-8">
                                <div className="bg-gray-600 h-full w-6 flex items-center justify-center">
                                  <span className="text-[9px] font-bold text-gray-500">E</span>
                                </div>
                                <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-gray-600">
                                  XXXX XXX
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-gray-700">
                            <div className="space-y-1.5">
                              {tx.address && (
                                <div className="flex items-start gap-1.5 text-xs">
                                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                  <span className="text-gray-400 leading-5 line-clamp-1">{tx.address}</span>
                                </div>
                              )}

                              <div className="flex items-start gap-1.5 text-xs">
                                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                <span className="text-gray-500 leading-5">
                                  Transacción completada ·{' '}
                                  {(() => {
                                    const ts = toMs(tx.created_date);
                                    return ts ? format(new Date(ts), 'HH:mm', { locale: es }) : '--:--';
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
                              onClick={() =>
                                (window.location.href = createPageUrl(`Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`))
                              }
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              className="border-gray-700 h-8 w-[42px] opacity-40 cursor-not-allowed"
                              disabled
                            >
                              <PhoneOff className="w-4 h-4 text-gray-600" />
                            </Button>

                            <div className="flex-1">
                              <div className="w-full h-8 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-3">
                                <span className="text-gray-500 text-sm font-mono font-bold">--:--</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {/* Tracker para reservadas */}
      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((alert) => (
          <SellerLocationTracker key={alert.id} alertId={alert.id} userLocation={userLocation} />
        ))}
    </div>
  );
}