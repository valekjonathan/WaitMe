import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, MapPin, TrendingUp, TrendingDown, CheckCircle, XCircle, Loader, X, Plus, Settings, MessageCircle, Search, Phone, PhoneOff, Navigation, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';

const CarIconTiny = ({ color }) => (
  <svg viewBox="0 0 48 24" className="w-5 h-3 inline-block" fill="none">
    <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
    <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
  </svg>
);

const carColorMap = {
  'blanco': '#FFFFFF',
  'negro': '#1a1a1a',
  'rojo': '#ef4444',
  'azul': '#3b82f6',
  'amarillo': '#facc15',
  'gris': '#6b7280'
};

export default function History() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error:', error);
      }
    };
    fetchUser();

    // Obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }
  }, []);

  // Obtener todas las alertas y transacciones
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

  // Separar por: Mis alertas creadas vs Mis reservas
   const myActiveAlerts = myAlerts.filter(a => a.user_id === user?.id && (a.status === 'active' || a.status === 'reserved'));
   const myReservations = myAlerts.filter(a => a.reserved_by_id === user?.id && a.status === 'reserved');

   // Transacciones finalizadas ficticias
   const mockTransactions = [
     {
       id: 'mock-tx-1',
       seller_id: user?.id,
       seller_name: 'Tu',
       buyer_id: 'buyer-1',
       buyer_name: 'Marco Rossi',
       amount: 5.00,
       seller_earnings: 4.00,
       platform_fee: 1.00,
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
       amount: 3.50,
       seller_earnings: 2.80,
       platform_fee: 0.70,
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
       amount: 4.50,
       seller_earnings: 3.60,
       platform_fee: 0.90,
       status: 'completed',
       address: 'Plaza Mayor, 8',
       alert_id: 'mock-alert-3',
       created_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
     }
   ];

   const myAlertsItems = [
     ...myActiveAlerts.map(a => ({ type: 'alert', data: a, date: a.created_date, isActive: a.status === 'active' })),
     ...transactions.filter(t => t.seller_id === user?.id).map(t => ({ type: 'transaction', data: t, date: t.created_date, isActive: false })),
     ...mockTransactions.map(t => ({ type: 'transaction', data: t, date: t.created_date, isActive: false }))
   ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const myReservationsItems = [
    ...myReservations.map(a => ({ type: 'alert', data: a, date: a.created_date, isActive: true })),
    ...transactions.filter(t => t.buyer_id === user?.id).map(t => ({ type: 'transaction', data: t, date: t.created_date, isActive: false }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const isLoading = loadingAlerts || loadingTransactions;

  // Cancelar alerta
  const cancelAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    }
  });

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
      <Badge className={`${styles[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
            <h1 className="text-lg font-semibold">Historial</h1>
          </div>
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Profile')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mb-0">
            <TabsTrigger value="alerts" className="flex-1 data-[state=active]:bg-purple-600">
              Tus alertas
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-purple-600">
              Tus reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-1.5 max-h-[calc(100vh-126px)] overflow-y-auto pr-1" style={{scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937'}}>
            <p className="text-white text-[11px] mb-1 text-center font-bold">Estás aparcado en:</p>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : myAlertsItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tienes alertas</p>
              </div>
            ) : (
               <>
                 {myAlertsItems.filter(i => i.type === 'alert').length > 0 && myAlertsItems.filter(i => i.type === 'transaction').length > 0 && (
                   <div className="text-white text-center font-bold py-3 text-sm">
                     Finalizadas:
                   </div>
                 )}
                 {myAlertsItems.map((item, index) => {
                 if (item.type === 'alert') {
              const alert = item.data;
              return (
                <motion.div
                  key={`alert-${alert.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                >
                  {alert.status === 'reserved' ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(alert.status)}
                        <span className="text-gray-500 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                          {format(new Date(alert.created_date), "d MMM, HH:mm", { locale: es })}
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
                              onChat={() => window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.reserved_by_email || alert.reserved_by_id}`)}
                              onCall={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
                              latitude={alert.latitude}
                              longitude={alert.longitude}
                              allowPhoneCalls={alert.allow_phone_calls}
                              isReserved={true}
                            />
                          </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{alert.address || 'Ubicación marcada'}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Te vas en {alert.available_in_minutes} min</span>
                        </div>
                        <span className="text-purple-400">Debes esperar hasta las: {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 min-w-[85px] text-center">
                          Activa
                        </Badge>
                        <span className="text-gray-500 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                          {format(new Date(alert.created_date), "d MMM, HH:mm", { locale: es })}
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

                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{alert.address || 'Ubicación marcada'}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs ml-0.5">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">Te vas en {alert.available_in_minutes} min ·</span>
                        <span className="text-purple-400">Debes esperar hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            } else {
              const tx = item.data;
              const isSeller = tx.seller_id === user?.id;
              
              return (
                <motion.div
                  key={`tx-${tx.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                >
                  <div className="flex items-center justify-between mb-2 opacity-100">
                    <Badge className="bg-red-500/20 text-red-400 border-2 border-purple-500/50 px-2 py-1 min-w-[85px] text-center">
                      Finalizada
                    </Badge>
                    <span className="text-gray-600 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                      {format(new Date(tx.created_date), "d MMM, HH:mm", { locale: es })}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isSeller ? (
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="font-bold text-green-400 text-sm">
                            {tx.seller_earnings?.toFixed(2)}€
                          </span>
                        </div>
                      ) : (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="font-bold text-red-400 text-sm">
                            -{tx.amount?.toFixed(2)}€
                          </span>
                        </div>
                      )}
                      <Button
                        size="icon"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                        onClick={() => {
                          // Funcionalidad de eliminar/ocultar transacción finalizada
                        }}
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                      </Button>
                    </div>
                  </div>

                  {isSeller && tx.buyer_name && (
                    <div className="mb-1.5 opacity-60">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 flex flex-col">
                        {/* Tarjeta de usuario */}
                        <div className="flex gap-2.5 mb-1.5 flex-1">
                          <div className="flex flex-col gap-1.5">
                            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800 flex-shrink-0">
                              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" alt={tx.buyer_name} className="w-full h-full object-cover" />
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

                        {/* Información de ubicación */}
                        <div className="space-y-1.5 pt-1.5 border-t border-gray-700">
                          {tx.address && (
                            <div className="flex items-start gap-1.5 text-gray-400 text-xs">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{tx.address}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-500">Transacción completada · {format(new Date(tx.created_date), 'HH:mm', { locale: es })}</span>
                          </div>

                          {/* Botones de acción */}
                          <div className="mt-4">
                            <div className="flex gap-2">
                              <div className="opacity-100">
                                <Button
                                  size="icon"
                                  className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
                                  onClick={() => window.location.href = createPageUrl(`Chat?alertId=${tx.alert_id}&userId=${tx.buyer_id}`)}>
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              </div>

                              <div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="border-gray-700 h-8 w-[42px] opacity-40 cursor-not-allowed"
                                  disabled>
                                  <PhoneOff className="w-4 h-4 text-gray-600" />
                                </Button>
                              </div>

                              <div className="flex-1">
                                <div className="w-full h-8 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-3">
                                  <span className="text-gray-500 text-sm font-mono font-bold">--:--</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            }
            })
                }
              </>
            )}
            </TabsContent>

          <TabsContent value="reservations" className="space-y-1.5 max-h-[calc(100vh-126px)] overflow-y-auto pr-1" style={{scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937'}}>
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
              <>
                {myReservationsItems.filter(i => i.type === 'alert').length > 0 && myReservationsItems.filter(i => i.type === 'transaction').length > 0 && (
                  <div className="text-white text-center font-bold py-3 text-sm">
                    Finalizadas:
                  </div>
                )}
                {myReservationsItems.map((item, index) => {
                 if (item.type === 'alert') {
              const alert = item.data;
              return (
                <motion.div
                  key={`alert-${alert.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 min-w-[85px] text-center">
                      Activa
                    </Badge>
                    <span className="text-gray-500 text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                      {format(new Date(alert.created_date), "d MMM, HH:mm", { locale: es })}
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
                      onChat={() => window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.user_email || alert.user_id}`)}
                      onCall={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
                      latitude={alert.latitude}
                      longitude={alert.longitude}
                      allowPhoneCalls={alert.allow_phone_calls}
                      isReserved={true}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{alert.address || 'Ubicación marcada'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs ml-0.5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500">Se va en {alert.available_in_minutes} min ·</span>
                    <span className="text-purple-400">Te espera hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
                  </div>
                </motion.div>
              );
            } else {
              const tx = item.data;
              
              return (
                <motion.div
                  key={`tx-${tx.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900/50 rounded-xl p-2 border-2 border-gray-700 opacity-60 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-red-500/20 text-red-400 border-2 border-purple-500/50 px-2 py-1 min-w-[85px] text-center">
                      Finalizada
                    </Badge>
                    <span className="text-white text-xs absolute left-1/2 -translate-x-1/2 -ml-3">
                      {format(new Date(tx.created_date), "d MMM, HH:mm", { locale: es })}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center gap-1 h-7">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="font-bold text-red-400 text-sm">
                          -{tx.amount?.toFixed(2)}€
                        </span>
                      </div>
                      <Button
                        size="icon"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                        onClick={() => {
                          // Funcionalidad de eliminar/ocultar transacción finalizada
                        }}
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-1.5 opacity-30">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500/30 flex flex-col">
                      {/* Tarjeta de usuario */}
                      <div className="flex gap-2.5 mb-1.5 flex-1">
                        <div className="flex flex-col gap-1.5">
                          <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800 flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                              👤
                            </div>
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

                      {/* Información de ubicación */}
                      <div className="space-y-1.5 pt-1.5 border-t border-gray-700">
                        {tx.address && (
                          <div className="flex items-start gap-1.5 text-gray-600 text-xs">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{tx.address}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span className="text-gray-600">Transacción completada · {format(new Date(tx.created_date), 'HH:mm', { locale: es })}</span>
                        </div>

                        {/* Botones de acción */}
                        <div className="mt-4">
                          <div className="flex gap-2">
                            <div className="opacity-100">
                              <Button
                                size="icon"
                                className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
                                onClick={() => window.location.href = createPageUrl(`Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`)}>
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </div>

                            <div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-gray-700 h-8 w-[42px] opacity-40 cursor-not-allowed"
                                disabled>
                                <PhoneOff className="w-4 h-4 text-gray-600" />
                              </Button>
                            </div>

                            <div className="flex-1">
                              <div className="w-full h-8 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center px-3">
                                <span className="text-gray-600 text-sm font-mono font-bold">--:--</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }
            })
            }
              </>
            )}
            </TabsContent>
            </Tabs>
      </main>
      
      <BottomNav />

      {/* Mostrar tracker de comprador para alertas reservadas */}
      {myActiveAlerts
        .filter(a => a.status === 'reserved')
        .map(alert => (
          <SellerLocationTracker 
            key={alert.id}
            alertId={alert.id}
            userLocation={userLocation}
          />
        ))
      }
    </div>
  );
}