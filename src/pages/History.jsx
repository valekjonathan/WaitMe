import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, MapPin, TrendingUp, TrendingDown, CheckCircle, XCircle, Loader, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import UserCard from '@/components/cards/UserCard';

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
  
  const myAlertsItems = [
    ...myActiveAlerts.map(a => ({ type: 'alert', data: a, date: a.created_date, isActive: a.status === 'active' })),
    ...transactions.filter(t => t.seller_id === user?.id).map(t => ({ type: 'transaction', data: t, date: t.created_date, isActive: false }))
  ].sort((a, b) => {
    // Activas primero
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  const myReservationsItems = [
    ...myReservations.map(a => ({ type: 'alert', data: a, date: a.created_date })),
    ...transactions.filter(t => t.buyer_id === user?.id).map(t => ({ type: 'transaction', data: t, date: t.created_date }))
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Historial</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-20 pb-24 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mb-4">
            <TabsTrigger value="alerts" className="flex-1 data-[state=active]:bg-purple-600">
              Tus alertas
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-purple-600">
              Tus reservas
            </TabsTrigger>
          </TabsList>

          <Link to={createPageUrl('Home?mode=create')}>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-6 h-12 flex items-center justify-center gap-2">
              <Plus className="w-6 h-6" strokeWidth={3} />
              <span className="font-semibold">Crear alerta</span>
            </Button>
          </Link>

          <TabsContent value="alerts" className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-scroll pr-4" style={{scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937'}}>
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
                  className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50"
                >
                  {alert.status === 'reserved' ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(alert.status)}
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-bold text-sm">{alert.price}€</span>
                        </div>
                      </div>

                      {alert.reserved_by_name && (
                        <div className="mb-2">
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
                          />
                        </div>
                      )}

                      <div className="flex items-start gap-2 text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{alert.address || 'Ubicación marcada'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(alert.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2 flex items-center gap-1">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-bold text-lg">{alert.price}€</span>
                          </div>
                          <Button
                            size="icon"
                            className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-lg border border-red-500"
                            onClick={() => cancelAlertMutation.mutate(alert.id)}
                            disabled={cancelAlertMutation.isPending}
                          >
                            <X className="w-5 h-5" strokeWidth={3} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{alert.address || 'Ubicación marcada'}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Te vas en {alert.available_in_minutes} min</span>
                        </div>
                        <span className="text-purple-400">Te espera hasta las: {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
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
                  className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-3 py-1.5">
                      Finalizada
                    </Badge>
                    <span className="text-gray-500 text-xs">
                      {format(new Date(tx.created_date), "d MMM, HH:mm", { locale: es })}
                    </span>
                    {isSeller ? (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="font-bold text-green-400 text-sm">
                          +{tx.seller_earnings?.toFixed(2)}€
                        </span>
                      </div>
                    ) : (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="font-bold text-red-400 text-sm">
                          -{tx.amount?.toFixed(2)}€
                        </span>
                      </div>
                    )}
                  </div>

                  {isSeller && tx.buyer_name && (
                    <div className="mb-3">
                      <UserCard
                        userName={tx.buyer_name}
                        userPhoto={null}
                        carBrand="Sin"
                        carModel="datos"
                        carColor="gris"
                        carPlate=""
                        vehicleType="car"
                        address={tx.address}
                        showLocationInfo={false}
                        showContactButtons={true}
                        onChat={() => window.location.href = createPageUrl(`Chat?alertId=${tx.alert_id}&userId=${tx.buyer_id}`)}
                        onCall={() => {}}
                        allowPhoneCalls={false}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{tx.address || 'Ubicación'}</span>
                  </div>
                </motion.div>
              );
            }
          })
        )}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-scroll pr-4" style={{scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937'}}>
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
                  className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(alert.status)}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-bold text-lg">{alert.price}€</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-gray-400 text-sm mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{alert.address || 'Ubicación marcada'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Se va en {alert.available_in_minutes} min</span>
                    </div>
                    <span className="text-purple-400">Debes esperar hasta las: {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
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
                  className="bg-gray-900/50 rounded-xl p-4 border-2 border-gray-700 opacity-60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="font-bold text-red-400">
                        -{tx.amount?.toFixed(2)}€
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {format(new Date(tx.created_date), "d MMM, HH:mm", { locale: es })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    Pagaste a {tx.seller_name}
                  </p>
                  
                  {tx.address && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {tx.address}
                    </p>
                  )}
                </motion.div>
              );
            }
          })
        )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}