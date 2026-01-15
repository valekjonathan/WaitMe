import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, MapPin, TrendingUp, TrendingDown, CheckCircle, XCircle, Loader, X, Plus, Settings, MessageCircle, Search, Phone, PhoneOff, Navigation, Car, Star } from 'lucide-react';
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
import RatingDialog from '@/components/RatingDialog';

// Componente de cuenta regresiva
function CountdownTimer({ availableInMinutes, createdDate, alertId, onExpire }) {
  const [timeLeft, setTimeLeft] = React.useState('');
  const [expired, setExpired] = React.useState(false);

  React.useEffect(() => {
    const updateTimer = () => {
      const targetTime = new Date(createdDate).getTime() + availableInMinutes * 60000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      if (remaining === 0 && !expired) {
        setExpired(true);
        onExpire(alertId);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [availableInMinutes, createdDate, alertId, onExpire, expired]);

  return (
    <div className="w-full h-8 rounded-lg border-2 border-gray-700 bg-gray-800 flex items-center justify-center">
      <span className="text-purple-400 text-sm font-mono font-bold">{timeLeft}</span>
    </div>
  );
}

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
  const [ratingDialog, setRatingDialog] = useState({ open: false, alertId: null, transactionId: null, ratedId: null, ratedEmail: null, userName: null, role: null });
  const [dateFilter, setDateFilter] = useState('all'); // all, month, year
  const [showSummary, setShowSummary] = useState(true);
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

  // Obtener valoraciones del usuario
  const { data: userRatings = [] } = useQuery({
    queryKey: ['userRatings', user?.id],
    queryFn: async () => {
      const ratings = await base44.entities.Rating.filter({ rated_id: user?.id });
      return ratings;
    },
    enabled: !!user?.id
  });

  // Calcular valoraciones por rol
  const sellerRatings = userRatings.filter(r => r.role === 'seller');
  const buyerRatings = userRatings.filter(r => r.role === 'buyer');
  const avgSellerRating = sellerRatings.length > 0 
    ? (sellerRatings.reduce((sum, r) => sum + r.rating, 0) / sellerRatings.length).toFixed(1)
    : 0;
  const avgBuyerRating = buyerRatings.length > 0
    ? (buyerRatings.reduce((sum, r) => sum + r.rating, 0) / buyerRatings.length).toFixed(1)
    : 0;

  // Filtrar por fecha
  const filterByDate = (items) => {
    if (dateFilter === 'all') return items;
    
    const now = new Date();
    return items.filter(item => {
      const itemDate = new Date(item.date || item.created_date);
      if (dateFilter === 'month') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'year') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  // Calcular totales
  const totalEarned = transactions
    .filter(t => t.seller_id === user?.id && t.status === 'completed')
    .reduce((sum, t) => sum + (t.seller_earnings || 0), 0);
  
  const totalSpent = transactions
    .filter(t => t.buyer_id === user?.id && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Separar por: Mis alertas creadas vs Mis reservas
  const myActiveAlerts = myAlerts.filter(a => a.user_id === user?.id && (a.status === 'active' || a.status === 'reserved'));
  const myCompletedAlerts = myAlerts.filter(a => a.user_id === user?.id && a.status === 'completed');
  const myReservations = myAlerts.filter(a => a.reserved_by_id === user?.id && a.status === 'reserved');
  
  const myAlertsItems = filterByDate([
    ...myActiveAlerts.map(a => ({ type: 'alert', data: a, date: a.created_date, isActive: a.status === 'active' })),
    ...myCompletedAlerts.map(a => ({ type: 'completed', data: a, date: a.created_date, isActive: false })),
    ...transactions.filter(t => t.seller_id === user?.id).map(t => ({ type: 'transaction', data: t, date: t.created_date, isActive: false }))
  ]).sort((a, b) => new Date(b.date) - new Date(a.date));

  const myReservationsItems = filterByDate([
    ...myReservations.map(a => ({ type: 'alert', data: a, date: a.created_date, isActive: true })),
    ...transactions.filter(t => t.buyer_id === user?.id).map(t => ({ type: 'transaction', data: t, date: t.created_date, isActive: false }))
  ]).sort((a, b) => new Date(b.date) - new Date(a.date));

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

  // Auto-cancelar cuando expire
  const handleExpire = React.useCallback(async (alertId) => {
    await base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
    queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
  }, [queryClient]);

  // Crear valoración
  const createRatingMutation = useMutation({
    mutationFn: async ({ alertId, transactionId, ratedId, ratedEmail, rating, comment, role }) => {
      await base44.entities.Rating.create({
        alert_id: alertId,
        transaction_id: transactionId,
        rater_id: user?.id,
        rater_email: user?.email,
        rated_id: ratedId,
        rated_email: ratedEmail,
        rating,
        comment,
        role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTransactions'] });
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
            <Link to={createPageUrl('Chats')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-[56px] pb-20 px-4">
        {/* Resumen financiero y valoraciones */}
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 space-y-2">
            
            {/* Resumen financiero */}
            <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-xl p-3 border border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">Resumen financiero</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowSummary(false)}>
                  <X className="w-4 h-4 text-white" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
                  <p className="text-green-400 text-xs mb-1">Total ganado</p>
                  <p className="text-green-400 font-bold text-lg">{totalEarned.toFixed(2)}€</p>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                  <p className="text-red-400 text-xs mb-1">Total gastado</p>
                  <p className="text-red-400 font-bold text-lg">{totalSpent.toFixed(2)}€</p>
                </div>
              </div>
            </div>

            {/* Valoraciones */}
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
              <h3 className="text-white font-semibold text-sm mb-2">Mis valoraciones</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2">
                  <p className="text-purple-400 text-xs mb-1">Como vendedor</p>
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${avgSellerRating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    <span className="text-white font-bold">{avgSellerRating}</span>
                    <span className="text-gray-400 text-xs">({sellerRatings.length})</span>
                  </div>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2">
                  <p className="text-blue-400 text-xs mb-1">Como comprador</p>
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${avgBuyerRating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    <span className="text-white font-bold">{avgBuyerRating}</span>
                    <span className="text-gray-400 text-xs">({buyerRatings.length})</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filtros de fecha */}


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
              myAlertsItems.map((item, index) => {
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
                        <span className="text-white text-xs absolute left-1/2 -translate-x-1/2" style={{ textTransform: 'capitalize' }}>
                          {format(new Date(alert.created_date), "d MMMM HH:mm", { locale: es })}
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
                      <div className="flex items-center justify-between mb-2 relative">
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 text-center flex justify-center">
                          Activa
                        </Badge>
                        <span className="text-white text-xs absolute left-1/2 -translate-x-1/2" style={{ textTransform: 'capitalize' }}>
                          {format(new Date(alert.created_date), "d MMMM HH:mm", { locale: es })}
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

                      <div className="flex items-center gap-1 text-xs ml-0.5 mb-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">Te vas en {alert.available_in_minutes} min ·</span>
                        <span className="text-purple-400">Debes esperar hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
                      </div>
                      
                      <CountdownTimer 
                        availableInMinutes={alert.available_in_minutes} 
                        createdDate={alert.created_date}
                        alertId={alert.id}
                        onExpire={handleExpire}
                      />
                    </>
                  )}
                </motion.div>
              );
            } else if (item.type === 'completed') {
              const alert = item.data;
              const hasTransaction = !!alert.reserved_by_name;
              return (
                <motion.div
                  key={`completed-${alert.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative ${!hasTransaction ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2 relative">
                    <Badge className="bg-red-500/20 text-red-400 border-2 border-purple-500/50 px-2 py-1 text-center flex justify-center">
                      Finalizada
                    </Badge>
                    <span className="text-white text-xs absolute left-1/2 -translate-x-1/2" style={{ textTransform: 'capitalize' }}>
                      {format(new Date(alert.created_date), "d MMMM HH:mm", { locale: es })}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`rounded-lg px-2 py-1 flex items-center gap-1 h-7 ${hasTransaction ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/20 border border-gray-700/30'}`}>
                        <TrendingUp className={`w-4 h-4 ${hasTransaction ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className={`font-bold text-sm ${hasTransaction ? 'text-green-400' : 'text-gray-500'}`}>
                          {(alert.price * 0.8).toFixed(2)}€
                        </span>
                      </div>
                      <Button
                        size="icon"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                      </Button>
                    </div>
                  </div>

                  {hasTransaction && alert.reserved_by_name && (
                    <div className="mb-1.5">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500 flex flex-col">
                        <div className="flex gap-2.5 mb-1.5 flex-1">
                          <div className="flex flex-col gap-1.5">
                            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex-shrink-0">
                              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                                👤
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <p className="font-bold text-xl text-white mb-1.5">{alert.reserved_by_name?.split(' ')[0]}</p>

                            <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                              <p className="text-sm font-medium text-white">Sin datos</p>
                              <Car className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="-mt-[7px] bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                              <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white">E</span>
                              </div>
                              <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-black">
                                {alert.reserved_by_plate || 'XXXX XXX'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1.5 border-t border-gray-700">
                          {alert.address && (
                            <div className="flex items-start gap-1.5 text-gray-400 text-xs">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{alert.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-500">Transacción completada · {format(new Date(alert.created_date), 'HH:mm', { locale: es })}</span>
                          </div>
                          
                          <div className="mt-4">
                           <div className="flex gap-2">
                             <div>
                               <Button
                                 size="icon"
                                 className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
                                 onClick={() => window.location.href = createPageUrl(`Chat?alertId=${alert.id}&userId=${alert.reserved_by_email}`)}>
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
                               <Button
                                 className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                                 onClick={() => setRatingDialog({
                                   open: true,
                                   alertId: alert.id,
                                   transactionId: null,
                                   ratedId: alert.reserved_by_email,
                                   ratedEmail: alert.reserved_by_email,
                                   userName: alert.reserved_by_name,
                                   role: 'buyer'
                                 })}>
                                 Valorar
                               </Button>
                             </div>
                           </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            } else if (item.type === 'transaction') {
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
                  <div className="flex items-center justify-between mb-2 relative">
                    <Badge className="bg-red-500/20 text-red-400 border-2 border-purple-500/50 px-2 py-1 text-center flex justify-center">
                      Finalizada
                    </Badge>
                    <span className="text-white text-xs absolute left-1/2 -translate-x-1/2" style={{ textTransform: 'capitalize' }}>
                      {format(new Date(tx.created_date), "d MMMM HH:mm", { locale: es })}
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
                    <div className="mb-1.5">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500 flex flex-col">
                        {/* Tarjeta de usuario */}
                        <div className="flex gap-2.5 mb-1.5 flex-1">
                          <div className="flex flex-col gap-1.5">
                            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex-shrink-0">
                              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                                👤
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <p className="font-bold text-xl text-white mb-1.5">{tx.buyer_name?.split(' ')[0]}</p>

                            <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                              <p className="text-sm font-medium text-white">Sin datos</p>
                              <Car className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="-mt-[7px] bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                              <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white">E</span>
                              </div>
                              <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-black">
                                XXXX XXX
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
                              <div>
                                <Button
                                  size="icon"
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
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
                                <Button
                                  className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                                  onClick={() => setRatingDialog({
                                    open: true,
                                    alertId: tx.alert_id,
                                    transactionId: tx.id,
                                    ratedId: tx.buyer_id,
                                    ratedEmail: tx.buyer_id,
                                    userName: tx.buyer_name,
                                    role: 'buyer'
                                  })}>
                                  Valorar
                                </Button>
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
              myReservationsItems.map((item, index) => {
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
                  <div className="flex items-center justify-between mb-2 relative">
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 text-center flex justify-center">
                      Activa
                    </Badge>
                    <span className="text-white text-xs absolute left-1/2 -translate-x-1/2" style={{ textTransform: 'capitalize' }}>
                      {format(new Date(alert.created_date), "d MMMM HH:mm", { locale: es })}
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
            } else if (item.type === 'transaction') {
              const tx = item.data;
              
              return (
                <motion.div
                  key={`tx-${tx.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900/50 rounded-xl p-2 border-2 border-gray-700 opacity-60 relative"
                >
                  <div className="flex items-center justify-between mb-2 relative">
                    <Badge className="bg-red-500/20 text-red-400 border-2 border-purple-500/50 px-2 py-1 text-center flex justify-center">
                      Finalizada
                    </Badge>
                    <span className="text-white text-xs absolute left-1/2 -translate-x-1/2" style={{ textTransform: 'capitalize' }}>
                      {format(new Date(tx.created_date), "d MMMM HH:mm", { locale: es })}
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

                  <div className="mb-1.5">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 border-purple-500 flex flex-col">
                      {/* Tarjeta de usuario */}
                      <div className="flex gap-2.5 mb-1.5 flex-1">
                        <div className="flex flex-col gap-1.5">
                          <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                              👤
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <p className="font-bold text-xl text-white mb-1.5">{tx.seller_name?.split(' ')[0]}</p>

                          <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                            <p className="text-sm font-medium text-white">Sin datos</p>
                            <Car className="w-5 h-5 text-gray-400" />
                          </div>

                          <div className="-mt-[7px] bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                            <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">E</span>
                            </div>
                            <span className="flex-1 text-center font-mono font-bold text-base tracking-wider text-black">
                              XXXX XXX
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
                            <div>
                              <Button
                                size="icon"
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
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
                              <Button
                                className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                                onClick={() => setRatingDialog({
                                  open: true,
                                  alertId: tx.alert_id,
                                  transactionId: tx.id,
                                  ratedId: tx.seller_id,
                                  ratedEmail: tx.seller_id,
                                  userName: tx.seller_name,
                                  role: 'seller'
                                })}>
                                Valorar
                              </Button>
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

      {/* Dialog de valoración */}
      <RatingDialog
        open={ratingDialog.open}
        onClose={() => setRatingDialog({ ...ratingDialog, open: false })}
        onSubmit={(data) => createRatingMutation.mutate({
          ...data,
          alertId: ratingDialog.alertId,
          transactionId: ratingDialog.transactionId,
          ratedId: ratingDialog.ratedId,
          ratedEmail: ratingDialog.ratedEmail,
          role: ratingDialog.role
        })}
        userName={ratingDialog.userName}
        userRole={ratingDialog.role}
      />
    </div>
  );
}