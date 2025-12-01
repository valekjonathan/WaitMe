import React from 'react';
import { Phone, PhoneOff, MessageCircle, Clock, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const carColors = {
  negro: 'bg-gray-900',
  blanco: 'bg-gray-100 border border-gray-300',
  gris: 'bg-gray-500',
  rojo: 'bg-red-500',
  azul: 'bg-blue-500',
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  naranja: 'bg-orange-500',
  morado: 'bg-purple-500',
  marron: 'bg-amber-800'
};

export default function UserAlertCard({ 
  alert, 
  onBuyAlert, 
  onChat, 
  onCall,
  isLoading = false,
  isEmpty = false 
}) {
  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-center h-40">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Toca un coche en el mapa para ver sus datos</p>
          </div>
        </div>
      </div>
    );
  }

  const colorClass = carColors[alert.car_color] || 'bg-gray-500';

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-800 shadow-xl">
      {/* Layout tipo DNI */}
      <div className="flex gap-4">
        {/* Foto */}
        <div className="flex-shrink-0">
          {alert.user_photo ? (
            <img 
              src={alert.user_photo} 
              alt={alert.user_name}
              className="w-20 h-24 object-cover rounded-xl border-2 border-purple-500"
            />
          ) : (
            <div className="w-20 h-24 bg-gray-800 rounded-xl border-2 border-gray-700 flex items-center justify-center">
              <span className="text-3xl text-gray-500">👤</span>
            </div>
          )}
          <p className="text-center text-white font-semibold mt-2 text-sm">{alert.user_name}</p>
        </div>

        {/* Datos del coche */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-5 rounded ${colorClass}`}></div>
            <div>
              <p className="text-white font-medium text-sm">{alert.car_brand} {alert.car_model}</p>
              <p className="text-gray-400 text-xs font-mono">{alert.car_plate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Se va en {alert.available_in_minutes} min</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
              {alert.price}€
            </Badge>
            {alert.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm">{alert.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="mt-4 flex items-start gap-2 text-gray-400 text-sm">
        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span className="line-clamp-2">{alert.address || 'Ubicación marcada en el mapa'}</span>
      </div>

      {/* Botones de acción */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="border-gray-700 hover:bg-gray-800"
          onClick={() => onChat(alert)}
        >
          <MessageCircle className="w-5 h-5 text-purple-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={`border-gray-700 ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
          onClick={() => alert.allow_phone_calls && onCall(alert)}
          disabled={!alert.allow_phone_calls}
        >
          {alert.allow_phone_calls ? (
            <Phone className="w-5 h-5 text-green-400" />
          ) : (
            <PhoneOff className="w-5 h-5 text-gray-600" />
          )}
        </Button>

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          onClick={() => onBuyAlert(alert)}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : '¡WaitMe!'}
        </Button>
      </div>
    </div>
  );
}