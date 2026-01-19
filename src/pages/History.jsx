import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import Header from '@/components/Header';

export default function History() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }
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

  // Reservas (tuyas como comprador)
  const myReservations = myAlerts.filter((a) => a.reserved_by_id === user?.id && a.status === 'reserved');

  // Transacciones finalizadas ficticias (solo para UI)
  const demoCompletedTransactions = [
    {
      id: 'demo_1',
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 5,
      street: 'Calle Uría',
      street_number: '20',
      buyer_name: 'Marta',
      buyer_photo: 'https://i.pravatar.cc/150?img=32',
      buyer_rating: 4.8,
      car_brand: 'BMW',
      car_model: 'Serie 1',
      car_plate: '1234 KLM'
    },
    {
      id: 'demo_2',
      created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 3,
      street: 'Plaza de la Escandalera',
      street_number: '',
      buyer_name: 'Carlos',
      buyer_photo: 'https://i.pravatar.cc/150?img=12',
      buyer_rating: 4.5,
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_plate: '5678 JHG'
    }
  ];

  const isLoading = loadingAlerts || loadingTransactions;

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      reserved: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    const labels = {
      active: 'Activa',
      reserved: 'Reservada',
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
      <Header title="Historial" showBackButton={true} backTo="Home" />

      <main className="pt-16 pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mt-2 mb-2">
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
            className="space-y-2 max-h-[calc(100vh-126px)] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937' }}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                {/* BOTON VERDE RECTANGULAR: ACTIVAS */}
                <div className="flex justify-center pt-1">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-md px-4 py-1 text-green-400 font-bold text-xs">
                    Activas
                  </div>
                </div>

                {/* LISTA ACTIVAS */}
                {myActiveAlerts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes alertas activas</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {myActiveAlerts
                      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                      .map((alert, index) => (
                        <motion.div
                          key={`active-${alert.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
                        >
                          {alert.status === 'reserved' ? (
                            <div className="absolute top-2 right-2">{statusBadge('reserved')}</div>
                          ) : (
                            <div className="absolute top-2 right-2">{statusBadge('active')}</div>
                          )}

                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0">
                              {alert.photo_url ? (
                                <img src={alert.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-6 h-6 text-gray-500" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-white truncate">
                                  {alert.street || 'Calle'} {alert.street_number || ''}
                                </p>
                                <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {alert.created_date ? format(new Date(alert.created_date), 'HH:mm', { locale: es }) : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">
                                  {alert.city || 'Oviedo'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30">
                                  {(Number(alert.price || 0)).toFixed(2)}€
                                </Badge>
                                <Badge className="bg-gray-800 text-gray-300 border border-gray-700">
                                  {alert.minutes_to_leave != null ? `${alert.minutes_to_leave} min` : '—'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}

                {/* BOTON ROJO: FINALIZADAS */}
                <div className="flex justify-center pt-3">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-md px-4 py-1 text-red-400 font-bold text-xs">
                    Finalizadas
                  </div>
                </div>

                {/* LISTA FINALIZADAS (DEMO) */}
                <div className="space-y-1.5 pt-1">
                  {demoCompletedTransactions.map((t, idx) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-gray-900 rounded-xl p-3 border border-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 min-w-0">
                          <img
                            src={t.buyer_photo}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-purple-500/50 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{t.buyer_name}</p>
                            <p className="text-sm text-gray-300 mt-0.5">
                              Pago completado. Has ganado {(Number(t.amount || 0) * 0.8).toFixed(2)}€
                            </p>
                            <div className="mt-2 text-xs text-purple-400 space-y-1">
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Transacción completada
                              </p>
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {t.street}{t.street_number ? `, ${t.street_number}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {t.created_date ? format(new Date(t.created_date), 'HH:mm', { locale: es }) : ''}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white">
                          <PhoneOff className="w-4 h-4 mr-2" />
                          Finalizado
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* TUS RESERVAS */}
          <TabsContent
            value="reservations"
            className="space-y-2 max-h-[calc(100vh-126px)] overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #1f2937' }}
          >
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : myReservations.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>No tienes reservas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myReservations
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map((alert, index) => (
                    <motion.div
                      key={`res-${alert.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-900 rounded-xl p-3 border border-yellow-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">
                          {alert.street || 'Calle'} {alert.street_number || ''}
                        </p>
                        {statusBadge('reserved')}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{alert.city || 'Oviedo'}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30">
                          {(Number(alert.price || 0)).toFixed(2)}€
                        </Badge>
                        <Badge className="bg-gray-800 text-gray-300 border border-gray-700">
                          {alert.minutes_to_leave != null ? `${alert.minutes_to_leave} min` : '—'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav activeTab="Alertas" />
    </div>
  );
}