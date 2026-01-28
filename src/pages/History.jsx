// ⬇️ ESTE ES TU HISTORY.JSX ORIGINAL CON UN ÚNICO FIX ⬇️

import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useAuth } from '@/components/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function History() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [nowTs, setNowTs] = useState(Date.now());

  // refresco del contador
  useEffect(() => {
    const i = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  // ===== CARGA ALERTAS =====
  const { data: myAlerts = [] } = useQuery({
    queryKey: ['myAlerts', user?.id],
    enabled: !!user?.id,
    refetchInterval: 1000,
    queryFn: async () => {
      const { data } = await base44
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // ===== ACTIVAS (FIX REAL) =====
  const myActiveAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;

      if (
        a.status !== 'created' && // ⬅️ ESTE ERA EL PROBLEMA
        a.status !== 'active' &&
        a.status !== 'reserved'
      ) return false;

      return true;
    });
  }, [myAlerts, user?.id]);

  // ===== FINALIZADAS =====
  const myFinalizedAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;
      return (
        a.status === 'expired' ||
        a.status === 'cancelled' ||
        a.status === 'completed'
      );
    });
  }, [myAlerts, user?.id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Alertas" />
      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full bg-gray-900">
            <TabsTrigger value="alerts" className="flex-1">
              Tus alertas
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1">
              Tus reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <Badge className="bg-green-600 mt-4">Activas</Badge>

            {myActiveAlerts.length === 0 && (
              <div className="mt-3 text-gray-400">
                No tienes ninguna alerta activa.
              </div>
            )}

            {myActiveAlerts.map((a) => (
              <UserCard key={a.id} alert={a} nowTs={nowTs} />
            ))}

            <Badge className="bg-red-600 mt-6">Finalizadas</Badge>

            {myFinalizedAlerts.map((a) => (
              <UserCard key={a.id} alert={a} nowTs={nowTs} />
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
}