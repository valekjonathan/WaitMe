import { MapPin, Clock, MessageCircle, Phone } from 'lucide-react';
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
      <div className="text-center text-gray-500 mt-8">
        Selecciona una alerta del mapa
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/40 rounded-2xl p-4 space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <span className="bg-green-600/20 text-green-400 text-xs px-3 py-1 rounded-full">
          Activa
        </span>
        <span className="text-purple-400 font-bold">
          {alert.price}€
        </span>
      </div>

      {/* USER */}
      <div className="flex gap-3 items-center">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-14 h-14 rounded-xl object-cover border border-purple-500/30"
        />
        <div className="flex-1">
          <p className="text-white font-semibold">{alert.user_name}</p>
          <p className="text-sm text-gray-400">
            {alert.car_brand} {alert.car_model}
          </p>
          <div className="mt-1 inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
            <span className="bg-blue-600 text-xs px-2 py-0.5 rounded">E</span>
            <span className="font-mono text-sm text-white">
              {alert.car_plate}
            </span>
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="space-y-1 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span>{alert.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>Se va en {alert.available_in_minutes} min</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => onChat?.(alert)}
          className="bg-green-600 hover:bg-green-700 w-12 h-12 p-0"
        >
          <MessageCircle />
        </Button>

        {alert.phone && (
          <Button
            onClick={() => onCall?.(alert)}
            className="bg-gray-700 hover:bg-gray-600 w-12 h-12 p-0"
          >
            <Phone />
          </Button>
        )}

        <Button
          onClick={() => onBuyAlert?.(alert)}
          disabled={isLoading || alert.is_demo}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
}
