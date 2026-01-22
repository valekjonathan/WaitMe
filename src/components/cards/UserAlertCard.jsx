import React from 'react';
import { MapPin, Clock, MessageCircle, Phone, Car } from 'lucide-react';
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
    <div className="border border-purple-500/40 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 p-4 space-y-3">

      {/* ───── CABECERA ───── */}
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 text-xs rounded-full bg-purple-600/20 text-purple-300 font-medium">
          Activa
        </span>
        <span className="text-purple-400 font-bold">
          {alert.price}€
        </span>
      </div>

      {/* ───── USUARIO ───── */}
      <div className="flex gap-3 items-center">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-16 h-16 rounded-xl object-cover border border-purple-500/40"
        />

        <div className="flex-1">
          <p className="text-white font-semibold leading-tight">
            {alert.user_name}
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            <Car className="w-4 h-4" />
            {alert.car_brand} {alert.car_model}
          </p>
        </div>

        <div className="text-xs bg-gray-800 px-2 py-1 rounded-lg font-mono">
          {alert.car_plate}
        </div>
      </div>

      {/* ───── SEPARADOR ───── */}
      <div className="h-px bg-purple-500/20" />

      {/* ───── INFO ───── */}
      <div className="space-y-1 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span>{alert.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>
            Se va en {alert.available_in_minutes} min
          </span>
        </div>
      </div>

      {/* ───── BOTONES (IGUAL FORMATO) ───── */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => onChat?.(alert)}
          className="w-12 h-12 p-0 bg-green-600 hover:bg-green-700 rounded-xl"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onCall?.(alert)}
          className="w-12 h-12 p-0 bg-gray-700 hover:bg-gray-600 rounded-xl"
        >
          <Phone className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onBuyAlert?.(alert)}
          disabled={isLoading || alert.is_demo}
          className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl text-base font-semibold"
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
}