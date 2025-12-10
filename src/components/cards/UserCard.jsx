import React from 'react';
import { MapPin, Clock, MessageCircle, Phone, Navigation } from 'lucide-react';
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
  muted = false
}) {
  const formatPlate = (plate) => {
    if (!plate) return 'XXXX XXX';
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return cleaned;
  };
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-purple-500/30">
      {/* Header con precio */}
      {showLocationInfo && price && (
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs text-purple-400">Información del usuario</p>
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
            <span className="text-purple-400 font-bold text-sm">{price.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* Tarjeta de usuario */}
      <div className="flex gap-3 mb-2">
        <div className="flex flex-col gap-2">
          <div className={`w-[92px] h-20 rounded-lg overflow-hidden border-2 ${muted ? 'border-gray-600' : 'border-purple-500'} bg-gray-800 flex-shrink-0`}>
            {userPhoto ? (
              <img src={userPhoto} className="w-full h-full object-cover" alt={userName} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                👤
              </div>
            )}
          </div>

          {showContactButtons && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-[28px] h-7 bg-gray-800 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg border border-gray-700"
                onClick={onChat}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`w-[28px] h-7 rounded-lg border border-gray-700 ${allowPhoneCalls ? 'bg-gray-800 hover:bg-green-600 text-green-400 hover:text-white' : 'bg-gray-800/50 text-gray-600'}`}
                onClick={onCall}
                disabled={!allowPhoneCalls}
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-[28px] h-7 bg-gray-800 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg border border-gray-700"
                onClick={() => {
                  if (latitude && longitude) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
                  }
                }}
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <p className={`font-bold text-lg ${muted ? 'text-gray-600' : 'text-white'}`}>{userName?.split(' ')[0]}</p>

          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${muted ? 'text-gray-600' : 'text-white'}`}>{carBrand} {carModel}</p>
            <VehicleIcon color={carColorMap[carColor] || '#6b7280'} type={vehicleType} />
          </div>

          <div className={`${muted ? 'bg-gray-700' : 'bg-white'} rounded-md flex items-center overflow-hidden border-2 ${muted ? 'border-gray-600' : 'border-gray-400'} h-7`}>
            <div className={`${muted ? 'bg-gray-600' : 'bg-blue-600'} h-full w-5 flex items-center justify-center`}>
              <span className={`text-[8px] font-bold ${muted ? 'text-gray-500' : 'text-white'}`}>E</span>
            </div>
            <span className={`flex-1 text-center font-mono font-bold text-sm tracking-wider ${muted ? 'text-gray-600' : 'text-black'}`}>
              {formatPlate(carPlate)}
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
                • Te espera hasta las {format(new Date(new Date().getTime() + availableInMinutes * 60000), 'HH:mm', { locale: es })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}