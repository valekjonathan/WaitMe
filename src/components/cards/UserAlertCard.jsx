import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserAlertCard({
  alert,
  isEmpty,
  onBuyAlert,
  onChat,
  onCall,
  isLoading
}) {
  if (!alert || isEmpty) {
    return (
      <div className="border border-purple-500/30 rounded-2xl bg-gray-900/40 p-6 text-center text-gray-400">
        Selecciona una alerta en el mapa
      </div>
    );
  }

  return (
    <div className="bg-gray-900/70 border border-purple-500/40 rounded-2xl p-4 space-y-3">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-14 h-14 rounded-xl object-cover border border-purple-500/30"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-base">
              {alert.user_name}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">
                {alert.available_in_minutes} min
              </span>
              <span className="text-sm font-bold text-purple-400">
                {alert.price}€
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-400 flex items-center gap-1">
            <Car className="w-4 h-4 text-purple-400" />
            {alert.car_brand} {alert.car_model}
          </p>
        </div>
      </div>

      {/* MATRÍCULA */}
      <div className="bg-white text-black rounded-md px-3 py-1 font-mono text-sm inline-flex items-center gap-2">
        <span className="bg-blue-600 text-white px-2 rounded-sm text-xs">E</span>
        {alert.car_plate}
      </div>

      {/* UBICACIÓN */}
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-purple-400" />
        {alert.address}
      </div>

      {/* TIEMPO */}
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Se va en {alert.available_in_minutes} min
      </div>

      {/* BOTONES (IGUALES A MIS RESERVAS) */}
      <div className="flex gap-2 pt-2">
        <Button
          size="icon"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => onChat(alert)}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>

        <Button
          size="icon"
          className="bg-gray-700 hover:bg-gray-600"
          onClick={() => onCall(alert)}
        >
          <Phone className="w-5 h-5" />
        </Button>

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          disabled={isLoading}
          onClick={() => onBuyAlert(alert)}
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
}