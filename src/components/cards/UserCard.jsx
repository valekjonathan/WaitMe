import React from 'react';
import { MapPin, Clock, Navigation, MessageCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const carColorMap = {
  'blanco': '#FFFFFF',
  'negro': '#1a1a1a',
  'rojo': '#ef4444',
  'azul': '#3b82f6',
  'amarillo': '#facc15',
  'gris': '#6b7280'
};

const VehicleIcon = ({ color, type = 'car' }) => {
  if (type === 'van') {
    return (
      <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
        <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill={color} stroke="white" strokeWidth="1.5" />
        <rect x="8" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
        <rect x="18" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
        <rect x="28" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
        <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="34" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      </svg>
    );
  }

  if (type === 'suv') {
    return (
      <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
        <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
        <rect x="12" y="7" width="10" height="6" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
        <rect x="24" y="7" width="10" height="6" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );
};

export default function UserCard({
  userName,
  userPhoto,
  carBrand,
  carModel,
  carColor,
  carPlate,
  vehicleType = 'car',
  address,
  availableInMinutes,
  price,
  showLocationInfo = true,
  showContactButtons = false,
  onChat,
  onCall,
  latitude,
  longitude,
  allowPhoneCalls = false,
  muted = false,
  isReserved = false,
  userLocation,
  actionButtons
}) {
  const calculateDistance = () => {
    if (!userLocation || !latitude || !longitude) return null;

    const R = 6371;
    const dLat = (latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (longitude - userLocation[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
  };

  const distance = calculateDistance();

  const formatPlate = (plate) => {
    if (!plate) return 'XXXX XXX';
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    if (cleaned.length >= 4) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return cleaned;
  };

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 ${muted ? 'border-gray-700' : 'border-purple-500'} flex flex-col h-full`}>
      {showLocationInfo && price && (
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[13px] text-purple-400">Info del usuario:</p>

          <div className="flex items-center gap-2">
            {distance && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5">
                <span className="text-purple-400 font-bold text-xs">{distance}</span>
              </div>
            )}

            <div className="bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-0.5">
              <span className="text-red-400 font-bold text-xs">{price}€</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="text-white font-bold text-lg leading-tight truncate">{userName}</h3>
              <p className="text-gray-400 text-sm truncate">{carBrand} {carModel}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-gray-900/50 rounded-lg px-2 py-1 border border-gray-700">
                <span className="text-white font-mono text-xs">{formatPlate(carPlate)}</span>
              </div>

              <div className="bg-gray-900/50 rounded-lg px-2 py-1 border border-gray-700 flex items-center">
                <VehicleIcon
                  color={carColorMap[(carColor || '').toLowerCase()] || '#6b7280'}
                  type={vehicleType}
                />
              </div>
            </div>
          </div>

          {actionButtons && (
            <div className="mt-2">
              {actionButtons}
            </div>
          )}
        </div>
      </div>

      {showLocationInfo && (
        // AQUÍ: antes era space-y-1.5 (dejaba hueco). Ahora 0.5 (línea pegada)
        <div className="space-y-0.5 pt-1.5 border-t border-gray-700">
          {address && (
            <div className="flex items-start gap-1.5 text-gray-400 text-xs">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}

          {availableInMinutes !== undefined && (
            <div className="flex items-center gap-1 text-gray-500 text-[10px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Se va en {availableInMinutes} min</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}