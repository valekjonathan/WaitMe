import React from 'react';
import { MapPin, Clock, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserAlertCard({
  alert,
  isEmpty,
  onBuyAlert,
  onChat,
  onCall,
  isLoading
}) {
  if (isEmpty || !alert) {
    return (
      <div className="border border-purple-500/30 rounded-2xl p-6 text-center text-gray-400">
        Selecciona una alerta en el mapa
      </div>
    );
  }

  return (
    <div className="border border-purple-500/40 rounded-2xl p-4 bg-gradient-to-b from-gray-900 to-black shadow-lg">
      {/* CABECERA – IGUAL QUE MIS RESERVAS */}
      <div className="flex items-center gap-3 pb-3 border-b border-purple-500/20">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-14 h-14 rounded-xl object-cover border border-purple-500/40"
        />

        <div className="flex-1">
          <div className="text-white font-semibold text-lg leading-tight">
            {alert.user_name}
          </div>
          <div className="text-sm text-gray-400">
            {alert.car_brand} {alert.car_model}
          </div>
        </div>

        <div className="text-purple-400 font-bold text-lg">
          {alert.price}€
        </div>
      </div>

      {/* MATRÍCULA + COCHE */}
      <div className="flex items-center gap-3 py-3 border-b border-purple-500/20">
        <span className="bg-white text-black text-sm font-mono px-3 py-1 rounded-md">
          {alert.car_plate || 'XXXX XXX'}
        </span>
        <Car className="w-5 h-5 text-gray-400" />
      </div>

      {/* INFO */}
      <div className="py-3 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin className="w-4 h-4 text-purple-400" />
          {alert.address}
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4 text-purple-400" />
          Se va en {alert.available_in_minutes} min
        </div>
      </div>

      {/* BOTONES – SOLO DIFERENCIA POR PANTALLA */}
      <div className="flex gap-2 pt-3">
        <Button
          size="icon"
          variant="outline"
          className="border-green-500 text-green-500 hover:bg-green-500/10"
          onClick={() => onChat?.(alert)}
        >
          💬
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="border-gray-500 text-gray-400 hover:bg-gray-500/10"
          onClick={() => onCall?.(alert)}
        >
          📞
        </Button>

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          disabled={isLoading || alert.is_demo}
          onClick={() => onBuyAlert?.(alert)}
        >
          {alert.is_demo ? 'Demo' : 'WaitMe!'}
        </Button>
      </div>
    </div>
  );
}