import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Phone
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
import { useAuth } from '@/components/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const queryClient = useQueryClient();

  /* =========================
     EFECTOS
  ========================= */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLocation([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* =========================
     🔧 QUERY ALERTAS (CAMBIO)
  ========================= */
  const { data: myAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['myAlerts', user?.id],
    enabled: !!user?.id,
    refetchInterval: 1000,
    queryFn: async () => {
      const key = user?.email || user?.id;

      const [a, b, c] = await Promise.all([
        base44.entities.ParkingAlert.filter({ user_id: key }),
        base44.entities.ParkingAlert.filter({ user_email: key }),
        base44.entities.ParkingAlert.filter({ created_by: key })
      ]);

      const all = [...a, ...b, ...c];
      const seen = new Set();

      return all.filter((x) => {
        if (!x?.id || seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
      });
    }
  });

  /* =========================
     🔧 ACTIVAS (CAMBIO)
  ========================= */
  const myActiveAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
      const isMine =
        a.user_id === user?.id ||
        a.user_email === user?.email ||
        a.created_by === user?.email;

      if (!isMine) return false;

      // 🔧 aceptar created
      if (
        a.status !== 'active' &&
        a.status !== 'reserved' &&
        a.status !== 'created'
      ) return false;

      return true;
    });
  }, [myAlerts, user?.id, user?.email]);

  /* =========================
     FINALIZADAS (SIN CAMBIOS)
  ========================= */
  const myFinalizedAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
      if (
        a.status === 'expired' ||
        a.status === 'cancelled' ||
        a.status === 'completed'
      ) return true;
      return false;
    });
  }, [myAlerts]);

  const isLoading = loadingAlerts;

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Alertas" showBackButton backTo="Home" />

      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          <div className="sticky top-[56px] z-40 bg-black pt-4 pb-1">
            <TabsList className="w-full bg-gray-900 border-0">
              <TabsTrigger value="alerts" className="flex-1">
                Tus alertas
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1">
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="alerts" className="space-y-3 pb-24">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <div className="text-center text-green-400 font-bold">Activas</div>

                {myActiveAlerts.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    No tienes ninguna alerta activa.
                  </div>
                ) : (
                  myActiveAlerts.map((alert) => {
                    const created = new Date(alert.created_date || Date.now()).getTime();
                    const waitUntil = alert.wait_until
                      ? new Date(alert.wait_until).getTime()
                      : created + (alert.available_in_minutes || 0) * 60000;

                    const remaining = Math.max(0, waitUntil - nowTs);
                    const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
                    const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

                    return (
                      <div
                        key={alert.id}
                        className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500/50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Badge className="bg-green-500/20 text-green-300">Activa</Badge>
                          <span className="font-mono text-purple-300">{mm}:{ss}</span>
                        </div>

                        <div className="text-sm text-gray-300">
                          {alert.address || 'Ubicación marcada'}
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="text-center text-red-400 font-bold pt-4">
                  Finalizadas
                </div>

                {myFinalizedAlerts.length === 0 && (
                  <div className="text-center text-gray-500">
                    No tienes alertas finalizadas
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {myActiveAlerts
        .filter((a) => a.status === 'reserved')
        .map((a) => (
          <SellerLocationTracker
            key={a.id}
            alertId={a.id}
            userLocation={userLocation}
          />
        ))}
    </div>
  );
}