import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, MapPin, TrendingUp, TrendingDown, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';

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

  // Mis alertas creadas
  const { data: myAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['myAlerts', user?.id],
    queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  // Mis transacciones (compras y ventas)
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.id],
    queryFn: async () => {
      const [asSeller, asBuyer] = await Promise.all([
        base44.entities.Transaction.filter({ seller_id: user?.id }),
        base44.entities.Transaction.filter({ buyer_id: user?.id })
      ]);
      return [...asSeller, ...asBuyer].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!user?.id
  });

  const activeAlerts = myAlerts.filter(a => a.status === 'active' || a.status === 'reserved');
  const completedAlerts = myAlerts.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'expired');

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
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-purple-600">
              Activas
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-purple-600">
              Transacciones
            </TabsTrigger>
          </TabsList>

          {/* Alertas Activas */}
          <TabsContent value="active" className="space-y-4">
            {loadingAlerts ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tienes alertas activas</p>
              </div>
            ) : (
              activeAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(alert.status)}
                      {alert.status === 'reserved' && alert.reserved_by_name && (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                          <CarIconTiny color={carColorMap[alert.reserved_by_car?.split(' ').pop()] || '#6b7280'} />
                          {alert.reserved_by_name.split(' ')[0]}
                        </span>
                      )}
                      {alert.status === 'active' && alert.user_id === user?.id && (
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Tu alerta
                        </Badge>
                      )}
                    </div>
                    <span className="text-purple-400 font-bold text-lg">{alert.price}€</span>
                  </div>

                  <div className="flex items-start gap-2 text-gray-400 text-sm mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{alert.address || 'Ubicación marcada'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{alert.user_id === user?.id ? 'Te vas' : 'Se va'} en {alert.available_in_minutes} min</span>
                    <span className="text-purple-400"> • Te espera hasta las: {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}</span>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Transacciones */}
          <TabsContent value="transactions" className="space-y-4">
            {loadingTransactions ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tienes transacciones</p>
              </div>
            ) : (
              transactions.map((tx, index) => {
                const isSeller = tx.seller_id === user?.id;
                
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900 rounded-xl p-4 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSeller ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-bold ${isSeller ? 'text-green-400' : 'text-red-400'}`}>
                          {isSeller ? '+' : '-'}{isSeller ? tx.seller_earnings?.toFixed(2) : tx.amount?.toFixed(2)}€
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {format(new Date(tx.created_date), "d MMM, HH:mm", { locale: es })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      {isSeller 
                        ? `${tx.buyer_name} pagó por tu plaza`
                        : `Pagaste a ${tx.seller_name}`
                      }
                    </p>
                    
                    {tx.address && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {tx.address}
                      </p>
                    )}
                  </motion.div>
                );
              })
            )}
          </TabsContent>

        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}