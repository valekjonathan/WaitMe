import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function ActiveAlertCard({ userLocation, onRefresh }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myActiveAlerts = [] } = useQuery({
    queryKey: ['myActiveAlerts', user?.id],
    queryFn: async () => {
      const alerts = await base44.entities.ParkingAlert.filter({
        user_id: user?.id,
        status: 'active'
      });
      return alerts;
    },
    enabled: !!user?.id
    // Se elimina refetchInterval para evitar problemas SSE; actualizaremos manualmente cuando sea necesario
  });

  const handleCancel = async (alertId) => {
    try {
      await base44.entities.ParkingAlert.update(alertId, { status: 'cancelled' });
      if (onRefresh) {
        onRefresh();
      } else {
        // Si no hay callback de refresco, invalidar caché para actualizar listas
        queryClient.invalidateQueries({ queryKey: ['myActiveAlerts'] });
        queryClient.invalidateQueries({ queryKey: ['userActiveAlerts'] });
      }
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
                <span className="text-green-400 font-bold text-lg">{(alert.price ?? 0).toFixed(2)}€</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-sm text-gray-300">{alert.available_in_minutes} min</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{alert.address || 'Sin ubicación'}</span>
              </div>
            </div>
            <Button
              size="icon"
              onClick={() => handleCancel(alert.id)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}