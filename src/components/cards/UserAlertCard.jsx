import React from 'react';
import { MapPin, Clock, Car, MessageCircle, Phone } from 'lucide-react';
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
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        Selecciona una alerta
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-purple-500/40 rounded-2xl p-4 mb-4 shadow-lg">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-3 py-1 text-xs rounded-full bg-green-900/40 text-green-400 border border-green-500/30">
          Activa
        </span>

        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold text-sm">
            {alert.price?.toFixed(2)}€
          </span>
        </div>
      </div>

      {/* USUARIO */}
      <div className="flex gap-3 items-center border-b border-purple-500/20 pb-3 mb-3">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-14 h-14 rounded-xl object-cover"
        />

        <div className="flex-1">
          <p className="font-semibold text-white leading-tight">
            {alert.user_name}
          </p>
          <p className="text-sm text-gray-400">
            {alert.car_brand} {alert.car_model}
          </p>
        </div>

        <Car className="w-6 h-6 text-purple-400" />
      </div>

      {/* MATRÍCULA */}
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
          E
        </span>
        <span className="bg-white text-black text-sm font-mono px-3 py-1 rounded">
          {alert.car_plate}
        </span>
      </div>

      {/* UBICACIÓN */}
      <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
        <MapPin className="w-4 h-4 text-purple-400" />
        <span>{alert.address}</span>
      </div>

      {/* TIEMPO */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Clock className="w-4 h-4 text-purple-400" />
        <span>
          Se va en {alert.available_in_minutes} min
        </span>
      </div>

      {/* BOTONES */}
      <div className="flex gap-2">
        <Button
          onClick={() => onChat(alert)}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 p-0"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onCall(alert)}
          variant="outline"
          className="w-12 h-12 border-gray-600 p-0"
        >
          <Phone className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onBuyAlert(alert)}
          disabled={isLoading}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
}