import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function ActiveAlertCard({ userLocation, onRefresh }) {
  const { user } = useAuth();

  const { data: myActiveAlerts = [] } = useQuery({
    queryKey: ['myActiveAlerts', user?.id],
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.filter({
        user_id: user?.id,
        status: 'active'
      });
      return alerts;
    },
    enabled: !!user?.id,
    refetchInterval: 10000
  });

  const handleCancel = async (alertId) => {
    try {
      await base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Error cancelando alerta:', e);
    }
  };

  if (myActiveAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-300 font-semibold">Tus alertas activas:</p>
      {myActiveAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-3"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-green-600/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1">
                  <span className="text-green-400 font-bold text-sm flex items-center gap-0.5">
                    {(alert.price ?? 0)}€ <span className="text-[10px]">↑</span>
                  </span>
                </div>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-sm text-gray-300">{alert.available_in_minutes} min</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{alert.address || 'Sin ubicación'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                onClick={() => {
                  if (alert.latitude && alert.longitude) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`, '_blank');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-2 flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                <span className="font-semibold text-sm">Ir</span>
                {alert.available_in_minutes != null && (
                  <span className="font-bold text-xs ml-1 bg-black/20 px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.available_in_minutes}m
                  </span>
                )}
              </Button>
              <Button
                size="icon"
                onClick={() => handleCancel(alert.id)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}