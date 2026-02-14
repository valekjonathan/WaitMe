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
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useAuth } from '@/lib/AuthContext';

export default function History() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [hiddenKeys, setHiddenKeys] = useState(new Set());
  const hideKey = (key) =>
    setHiddenKeys((prev) => new Set(prev).add(key));

  const {
    data: myAlerts = [],
    isLoading: loadingAlerts
  } = useQuery({
    queryKey: ['myAlerts', user?.id],
    enabled: !!user?.id,
    queryFn: async () => []
  });

  const {
    data: transactions = [],
    isLoading: loadingTransactions
  } = useQuery({
    queryKey: ['myTransactions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => []
  });

  const isLoading = loadingAlerts || loadingTransactions;

  const statusLabel = (s) => {
    const st = String(s || '').toLowerCase();
    if (st === 'completed') return 'COMPLETADA';
    if (st === 'cancelled') return 'CANCELADA';
    if (st === 'expired') return 'EXPIRADA';
    if (st === 'reserved') return 'EN CURSO';
    return 'ACTIVA';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Alertas" showBackButton backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts">
          <TabsList className="w-full bg-gray-900">
            <TabsTrigger value="alerts" className="flex-1">
              Tus alertas
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1">
              Tus reservas
            </TabsTrigger>
          </TabsList>

          {/* ALERTAS */}
          <TabsContent value="alerts" className="space-y-4 pt-4">
            {myAlerts.length === 0 ? (
              <div className="bg-gray-900 rounded-xl h-[160px] flex items-center justify-center">
                <p className="text-gray-500 font-semibold">
                  No tienes ninguna alerta.
                </p>
              </div>
            ) : (
              myAlerts.map((alert) => {
                const key = `alert-${alert.id}`;
                if (hiddenKeys.has(key)) return null;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-900 rounded-xl p-3 border border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="bg-purple-600">
                        {statusLabel(alert.status)}
                      </Badge>

                      <div className="flex gap-2">
                        <span className="font-bold">
                          {(alert.price ?? 0).toFixed(2)}€
                        </span>
                        <Button
                          size="icon"
                          className="bg-red-600 h-7 w-7"
                          onClick={() => hideKey(key)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-400">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      {alert.address || 'Sin dirección'}
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* RESERVAS */}
          <TabsContent value="reservations" className="space-y-4 pt-4">
            {transactions.length === 0 ? (
              <div className="bg-gray-900 rounded-xl h-[160px] flex items-center justify-center">
                <p className="text-gray-500 font-semibold">
                  No tienes ninguna reserva.
                </p>
              </div>
            ) : (
              transactions.map((tx) => {
                const key = `tx-${tx.id}`;
                if (hiddenKeys.has(key)) return null;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-900 rounded-xl p-3 border border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="bg-purple-600">
                        {statusLabel(tx.status)}
                      </Badge>

                      <div className="flex gap-2">
                        <span className="font-bold">
                          {(tx.amount ?? 0).toFixed(2)}€
                        </span>
                        <Button
                          size="icon"
                          className="bg-red-600 h-7 w-7"
                          onClick={() => hideKey(key)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-400">
                      <Clock className="inline w-4 h-4 mr-1" />
                      {tx.created_date
                        ? format(new Date(tx.created_date), 'dd MMM yyyy - HH:mm', { locale: es })
                        : '--'}
                    </div>
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