import React from 'react';
import { MapPin, Phone, MessageCircle, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserAlertCard({
  alert,
  isEmpty,
  onBuyAlert,
  onChat,
  onCall,
  isLoading
}) {
  if (!alert || isEmpty) return null;

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] border border-purple-500/60 rounded-2xl p-4 space-y-3 shadow-lg">

      {/* HEADER SUPERIOR */}
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-700 text-white">
          Activa
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {alert.available_in_minutes} min
          </span>
          <span className="px-3 py-1 rounded-lg bg-purple-700 text-white font-bold text-sm">
            {alert.price?.toFixed(2)}€
          </span>
        </div>
      </div>

      {/* INFO USUARIO */}
      <div className="flex gap-3 items-center">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-14 h-14 rounded-xl object-cover border border-purple-500"
        />

        <div className="flex-1">
          <p className="text-white font-bold leading-tight">
            {alert.user_name}
          </p>
          <p className="text-gray-400 text-sm">
            {alert.car_brand} {alert.car_model}
          </p>
        </div>

        <Car className="w-6 h-6 text-gray-400" />
      </div>

      {/* MATRÍCULA */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 w-fit">
        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
          E
        </span>
        <span className="font-mono text-black text-sm">
          {alert.car_plate || 'XXXX XXX'}
        </span>
      </div>

      {/* DIRECCIÓN */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <MapPin className="w-4 h-4 text-purple-400" />
        <span>{alert.address}</span>
      </div>

      {/* TIEMPO */}
      <div className="text-sm text-purple-400">
        Se va en {alert.available_in_minutes} min · Te espera
      </div>

      {/* ACCIONES */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          size="icon"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => onChat?.(alert)}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        <Button
          size="icon"
          className="bg-gray-700 hover:bg-gray-600"
          onClick={() => onCall?.(alert)}
        >
          <Phone className="w-5 h-5" />
        </Button>

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold"
          onClick={() => onBuyAlert?.(alert)}
          disabled={isLoading || alert.is_demo}
        >
          {alert.is_demo ? 'Demo' : 'WaitMe!'}
        </Button>
      </div>
    </div>
  );
}