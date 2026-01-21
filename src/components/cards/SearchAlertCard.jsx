import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchAlertCard({ alert, onOpen }) {
  if (!alert) return null;

  const carLabel = `${alert.car_brand || ''} ${alert.car_model || ''}`.trim() || 'Vehículo';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full bg-gray-900/60 hover:bg-gray-800/70 border border-purple-500/30 rounded-xl p-3 transition text-left"
    >
      <div className="flex items-start gap-3">
        {/* Foto */}
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-purple-500/30 flex-shrink-0">
          {alert.user_photo ? (
            <img src={alert.user_photo} alt={alert.user_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-800">
              👤
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-white truncate">{alert.user_name || 'Usuario'}</p>
            <span className="text-purple-400 font-bold text-lg ml-2">{(alert.price ?? 0).toFixed(2)}€</span>
          </div>

          <p className="text-sm text-gray-300 truncate mb-1">{carLabel}</p>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{alert.available_in_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{alert.address || 'Sin ubicación'}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
} 