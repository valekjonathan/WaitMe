import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MarcoCard from '@/components/cards/MarcoCard';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getWaitMeRequests, setWaitMeRequestStatus } from '@/lib/waitmeRequests';

export default function Notifications() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener('waitme:requestsChanged', onChange);
    return () => window.removeEventListener('waitme:requestsChanged', onChange);
  }, []);

  const notifications = useMemo(() => {
    return getWaitMeRequests();
  }, [tick]);

  const acceptRequest = async (req) => {
    if (!req?.id) return;
    try {
      const alertId = req.alertId;
      const buyer = req.buyer || {};
      if (alertId) {
        await base44.entities.ParkingAlert.update(alertId, {
          status: 'reserved',
          reserved_by_id: buyer.id || 'mock_buyer',
          reserved_by_name: buyer.name || 'Usuario',
          reserved_by_photo: buyer.photo || null,
          reserved_by_vehicle_type: buyer.vehicle_type || null,
          reserved_by_car_model: buyer.car_model || null,
          reserved_by_car_color: buyer.car_color || null,
          reserved_by_plate: buyer.plate || null,
          reserved_by_phone: buyer.phone || null
        });
        try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
      }
      setWaitMeRequestStatus(req.id, 'accepted', { read: true });
    } catch {
      setWaitMeRequestStatus(req.id, 'accepted', { read: true });
    }
  };

  const rejectRequest = (req) => {
    if (!req?.id) return;
    setWaitMeRequestStatus(req.id, 'rejected', { read: true });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col">
      <Header title="Notificaciones" />

      <main className="pt-[72px] pb-[96px] px-4">
        <div className="max-w-md mx-auto space-y-3">
          {(notifications || []).length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center text-gray-400">
              No tienes notificaciones
            </div>
          ) : (
            (notifications || []).map((n) => {
              const st = String(n?.status || '').toLowerCase();
              const isRejected = st === 'rejected';
              const isAccepted = st === 'accepted';
              const pending = st === 'pending';

              const buyer = n?.buyer || {};

              return (
                <div key={n.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white text-[16px] font-semibold">
                      Usuario quiere tu Wait<span className="text-purple-500">Me!</span>
                    </div>

                    {isRejected && (
                      <Badge className="bg-red-600/20 text-red-300 border border-red-500/30">RECHAZADA</Badge>
                    )}
                    {isAccepted && (
                      <Badge className="bg-green-600/20 text-green-300 border border-green-500/30">ACEPTADA</Badge>
                    )}
                    {pending && (
                      <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30">PENDIENTE</Badge>
                    )}
                  </div>

                  <div className="mt-3">
                    <MarcoCard
                      photoUrl={buyer.photo}
                      name={buyer.name || 'Usuario'}
                      carLabel={buyer.car_model || 'Vehículo'}
                      plate={buyer.plate || '--'}
                      carColor={buyer.car_color || 'gris'}
                      address={'Oviedo'}
                      timeLine={{ main: 'Ahora', sub: 'Solicitud de WaitMe' }}
                      priceChip={{ text: '-- €', mode: 'green' }}
                      statusText={pending ? 'ACTIVA' : isRejected ? 'RECHAZADA' : 'COMPLETADA'}
                      statusEnabled
                      phoneEnabled={false}
                      role="buyer"
                    />
                  </div>

                  {pending && (
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        onClick={() => rejectRequest(n)}
                        className="flex-1 bg-white text-black hover:bg-gray-200"
                      >
                        Rechazar
                      </Button>
                      <Button
                        onClick={() => acceptRequest(n)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Aceptar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
