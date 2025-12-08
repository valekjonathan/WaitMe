import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const carColorMap = {
  'blanco': '#FFFFFF',
  'negro': '#1a1a1a',
  'rojo': '#ef4444',
  'azul': '#3b82f6',
  'amarillo': '#facc15',
  'gris': '#6b7280'
};

const CarIconSmall = ({ color }) => (
  <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
    <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
    <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
  </svg>
);

export default function UserCard({ 
  userName, 
  userPhoto, 
  carBrand, 
  carModel, 
  carColor, 
  carPlate,
  address,
  availableInMinutes,
  price,
  showLocationInfo = true
}) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-purple-500/30">
      {/* Header con precio */}
      {showLocationInfo && price && (
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs text-purple-400">Información del usuario</p>
          <span className="text-purple-400 font-bold text-lg">{price}€</span>
        </div>
      )}

      {/* Tarjeta de usuario */}
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex-shrink-0">
          {userPhoto ? (
            <img src={userPhoto} className="w-full h-full object-cover" alt={userName} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
              👤
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <p className="font-bold text-white">{userName}</p>

          <div className="flex items-center gap-2">
            <CarIconSmall color={carColorMap[carColor] || '#6b7280'} />
            <p className="text-white text-xs font-medium">{carBrand} {carModel}</p>
          </div>

          <div className="bg-white rounded px-2 py-0.5 flex items-center w-fit">
            <div className="bg-blue-600 h-4 w-3 flex items-center justify-center mr-1">
              <span className="text-white text-[6px] font-bold">E</span>
            </div>
            <span className="text-black font-mono font-bold text-[10px] tracking-wide">
              {carPlate || '0000 XXX'}
            </span>
          </div>
        </div>
      </div>

      {/* Información de ubicación */}
      {showLocationInfo && (
        <div className="space-y-2 pt-2 border-t border-gray-700">
          {address && (
            <div className="flex items-start gap-2 text-gray-400 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
          )}
          
          {availableInMinutes !== undefined && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Clock className="w-3 h-3" />
              <span>Se va en {availableInMinutes} min</span>
              <span className="text-purple-400">
                • Hasta las {format(new Date(new Date().getTime() + availableInMinutes * 60000), 'HH:mm', { locale: es })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}