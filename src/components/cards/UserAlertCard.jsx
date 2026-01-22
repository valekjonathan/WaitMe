import { MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserAlertCard({ alert, isEmpty }) {
  if (isEmpty || !alert) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Selecciona una alerta del mapa
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] border border-purple-600/40 rounded-2xl p-4 mt-4">
      {/* Estado + precio */}
      <div className="flex justify-between items-center mb-3">
        <span className="bg-green-700 text-white text-xs px-3 py-1 rounded-full">
          Activa
        </span>
        <span className="text-purple-400 font-bold">
          {alert.price?.toFixed(2)}€
        </span>
      </div>

      {/* Usuario */}
      <div className="flex gap-3 items-center mb-3">
        <img
          src={alert.user_photo}
          alt={alert.user_name}
          className="w-14 h-14 rounded-xl object-cover"
        />

        <div className="flex-1">
          <div className="text-lg font-bold">{alert.user_name}</div>
          <div className="text-sm text-gray-400">
            {alert.car_brand} {alert.car_model}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded">
              E
            </span>
            <span className="bg-white text-black text-xs px-2 py-0.5 rounded">
              {alert.car_plate}
            </span>
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="text-sm text-gray-400 mb-1">
        📍 {alert.address}
      </div>
      <div className="text-sm text-purple-300 mb-3">
        Se va en {alert.available_in_minutes} min
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button className="bg-green-600 flex-1">
          <MessageCircle className="w-4 h-4 mr-1" />
          Chat
        </Button>

        <Button className="bg-purple-600 flex-[2]">
          WaitMe!
        </Button>
      </div>
    </div>
  );
}