import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ActiveAlertCard({
  user = {},
  onCancel = () => {},
  onOpen = () => {}
}) {
  const {
    address = 'Dirección',
    minutes = 10,
    price = 3,
    expiresAt = '',
    statusLabel = 'Activa'
  } = user;

  return (
    <div className="w-full bg-gray-900/60 border border-purple-500/30 rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="bg-green-500/20 border border-green-500/40 text-green-200 rounded-full px-3 py-1 text-xs font-extrabold">
          {statusLabel}
        </div>
        <div className="text-xs text-gray-400">{expiresAt}</div>
        <div className="bg-purple-600/20 border border-purple-500/30 text-purple-200 rounded-full px-3 py-1 text-xs font-extrabold">
          {price.toFixed ? price.toFixed(2) : price}€
        </div>
        <button
          onClick={onCancel}
          className="bg-red-500 text-white rounded-lg w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-700 mt-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-gray-300 text-xs truncate">{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-gray-400 text-xs">Te espera {minutes} min</span>
        </div>
      </div>

      <Button
        onClick={onOpen}
        className="w-full mt-3 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 font-extrabold rounded-xl"
      >
        VER
      </Button>
    </div>
  );
}

export { ActiveAlertCard };
export default ActiveAlertCard;