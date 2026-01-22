import React from 'react';
import { MapPin, Clock, MessageCircle, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* === helpers idénticos a History === */
const formatPlate = (plate) => {
  const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
  if (!p) return '0000 XXX';
  return `${p.slice(0, 4)} ${p.slice(4)}`.trim();
};

const Plate = ({ plate }) => (
  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
      <span className="text-white text-[8px] font-bold">E</span>
    </div>
    <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
      {formatPlate(plate)}
    </span>
  </div>
);

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
      <div className="bg-gray-900 rounded-xl p-4 border-2 border-gray-700 text-center text-gray-500">
        Selecciona una alerta del mapa
      </div>
    );
  }

  const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls !== false);

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div className="bg-green-500/25 text-green-300 border border-green-400/50 rounded-md px-3 h-7 flex items-center text-xs font-bold">
          Activa
        </div>
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 h-7 flex items-center">
          <span className="text-green-400 font-bold text-sm">
            {alert.price?.toFixed(2)}€
          </span>
        </div>
      </div>

      <div className="border-t border-gray-700/80 mb-2" />

      {/* === CONTENIDO IDÉNTICO A “MIS RESERVAS” === */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
          {alert.user_photo ? (
            <img
              src={alert.user_photo}
              alt={alert.user_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
              👤
            </div>
          )}
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p className="font-bold text-xl text-white leading-none">
            {(alert.user_name || 'Usuario').split(' ')[0]}
          </p>
          <p className="text-sm font-medium text-gray-200 leading-none mt-1">
            {alert.car_brand} {alert.car_model}
          </p>

          <div className="flex items-end gap-2 mt-auto">
            <Plate plate={alert.car_plate} />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-700/80 mt-2 space-y-1.5">
        <div className="flex items-start gap-1.5 text-xs">
          <MapPin className="w-4 h-4 text-purple-400 mt-0.5" />
          <span className="text-gray-200 line-clamp-1">{alert.address}</span>
        </div>

        <div className="flex items-start gap-1.5 text-xs">
          <Clock className="w-4 h-4 text-purple-400 mt-0.5" />
          <span className="text-gray-200">
            Se va en <span className="text-purple-400">{alert.available_in_minutes} min</span>
          </span>
        </div>
      </div>

      {/* BOTONES (los únicos que cambian) */}
      <div className="mt-2 flex gap-2">
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600 h-8 w-[42px]"
          onClick={() => onChat?.(alert)}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>

        {phoneEnabled ? (
          <Button
            size="icon"
            className="bg-white hover:bg-gray-200 text-black h-8 w-[42px]"
            onClick={() => onCall?.(alert)}
          >
            <Phone className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            disabled
            className="bg-white/10 border border-white/30 h-8 w-[42px]"
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        )}

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 h-8 font-bold"
          onClick={() => onBuyAlert?.(alert)}
          disabled={isLoading || alert.is_demo}
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
}