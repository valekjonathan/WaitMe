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

  // Transacciones finalizadas ficticias (solo para UI)
  const mockTransactions = [
    {
      id: 'mock-tx-1',
      seller_id: user?.id,
      seller_name: 'Tu',
      buyer_id: 'buyer-1',
      buyer_name: 'Marco Rossi',
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
      amount: 4.5,
      seller_earnings: 3.6,
      platform_fee: 0.9,
      status: 'completed',
      address: 'Plaza Mayor, 8',
      alert_id: 'mock-alert-3',
      created_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const myFinalizedAsSellerTx = [...transactions.filter((t) => t.seller_id === user?.id), ...mockTransactions].sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  // Finalizadas de vendedor (alertas + transacciones) ORDEN: más reciente arriba
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
  // Si NO hay forma de calcularlo, devolvemos null para NO auto-expirar
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

  // (2) “Activa/Activas/Finalizada/Finalizadas” no deben parecer botones
  const labelNoClick = 'cursor-default select-none pointer-events-none';

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

  // (3) Bloque de coche + matrícula (mismo formato que perfil: placa blanca + banda azul “E”)
  const VehicleBlock = ({ plate, carLabel, muted = false }) => {
    const plateText = (plate || '').toUpperCase().trim() || '---- ---';
    const carText = (carLabel || '').trim() || 'Coche';
    const txt = muted ? 'text-gray-500' : 'text-white';
    const icon = muted ? 'text-gray-500' : 'text-gray-400';

    return (
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`text-sm font-medium ${txt} line-clamp-1`}>{carText}</p>
        <Car className={`w-5 h-5 ${icon} flex-shrink-0`} />
        <div className="flex-1" />
        <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8 w-[150px] flex-shrink-0">
          <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">E</span>
          </div>
          <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-black">
            {plateText}
          </span>
        </div>
      </div>
    );
  };

  const getMyVehicle = (alert) => {
    const brand = alert?.car_brand || user?.car_brand || '';
    const model = alert?.car_model || user?.car_model || '';
    const label = `${brand} ${model}`.trim();
    const plate = alert?.car_plate || user?.car_plate || user?.plate || '';
    return { label: label || 'Coche', plate };
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

                        // Auto-finaliza SOLO si hay expiración válida
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
                          remainingMs === null ? '--:--' : remainingMs > 0 ? formatRemaining(remainingMs) : 'Alerta finalizada';

                        const myVeh = getMyVehicle(alert);

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

                                  {/* fecha en blanco */}
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

                                {/* (3) Coche + matrícula como en perfil */}
                                <VehicleBlock plate={myVeh.plate} carLabel={myVeh.label} />

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

                                  {/* fecha en blanco */}
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

                                {/* (3) Coche + matrícula como en perfil */}
                                <VehicleBlock plate={myVeh.plate} carLabel={myVeh.label} />

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
                      // (1) Apagar borde SOLO en finalizadas: sin borde morado
                      const finalizedCardClass =
                        'bg-gray-900 rounded-xl p-2 border border-transparent relative';

                      if (item.type === 'alert') {
                        const a = item.data;
                        const myVeh = getMyVehicle(a);

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
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                  onClick={() => {}}
                                >
                                  <X className="w-4 h-4" strokeWidth={3} />
                                </Button>
                              </div>
                            </div>

                            {/* (3) Coche + matrícula como en perfil */}
                            <VehicleBlock plate={myVeh.plate} carLabel={myVeh.label} muted />

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
                                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                                onClick={() => {}}
                              >
                                <X className="w-4 h-4" strokeWidth={3} />
                              </Button>
                            </div>
                          </div>

                          {isSeller && tx.buyer_name && (
                            <div className="mb-1.5">
                              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 flex flex-col">
                                <div className="opacity-60">
                                  <div className="flex gap-2.5 mb-1.5 flex-1">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800 flex-shrink-0">
                                        <img
                                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
                                          alt={tx.buyer_name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                      <p className="font-bold text-xl text-white mb-1.5">{tx.buyer_name?.split(' ')[0]}</p>

                                      <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                                        <p className="text-sm font-medium text-white">BMW Serie 3</p>
                                        <Car className="w-5 h-5 text-gray-400" />
                                      </div>

                                      <div className="-mt-[7px] bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                                        <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                                          <span className="text-[9px] font-bold text-white">E</span>
                                        </div>
                                        <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-black">
                                          2847 BNM
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