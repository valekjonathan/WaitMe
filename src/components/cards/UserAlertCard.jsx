// ================================
// FILE: src/components/cards/UserAlertCard.jsx
// ================================
import React, { useMemo } from 'react';
import { MapPin, Clock, Navigation, MessageCircle, Phone, PhoneOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UserAlertCard({
  alert,
  onBuyAlert,
  onChat,
  onCall,
  isLoading = false,
  isEmpty = false,
  userLocation
}) {
  const normalizedUserLocation = useMemo(() => {
    if (!userLocation) return null;
    if (Array.isArray(userLocation) && userLocation.length === 2) {
      const lat = Number(userLocation[0]);
      const lng = Number(userLocation[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng };
      }
      return null;
    }
    const lat = Number(userLocation.latitude ?? userLocation.lat);
    const lng = Number(userLocation.longitude ?? userLocation.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }, [userLocation]);

  const toMs = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? null : t;
    }
    return null;
  };

  const calculateDistanceLabel = (lat, lng) => {
    if (!normalizedUserLocation) return null;
    const R = 6371e3;
    const φ1 = normalizedUserLocation.latitude * Math.PI / 180;
    const φ2 = lat * Math.PI / 180;
    const Δφ = (lat - normalizedUserLocation.latitude) * Math.PI / 180;
    const Δλ = (lng - normalizedUserLocation.longitude) * Math.PI / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { value: (R * c / 1000).toFixed(1), unit: 'km' };
  };

  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/80 rounded-xl p-4 border-2 border-purple-500/50 flex items-center justify-center">
        <p className="text-xs text-gray-400">Toca un coche en el mapa</p>
      </div>
    );
  }

  const distanceLabel = calculateDistanceLabel(alert.latitude, alert.longitude);
  const waitUntil = alert.wait_until ? format(new Date(toMs(alert.wait_until)), 'HH:mm', { locale: es }) : '--:--';

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 text-xs h-7 w-[95px] justify-center">
          Info usuario
        </Badge>

        <div className="flex-1 text-center text-xs text-white">
          {alert.created_date &&
            format(new Date(toMs(alert.created_date)), "d MMMM - HH:mm", { locale: es })}
        </div>

        <div className="flex gap-1">
          {distanceLabel && (
            <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 h-7 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-white font-bold">
                {distanceLabel.value}{distanceLabel.unit}
              </span>
            </div>
          )}
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 h-7 flex items-center">
            <span className="text-xs text-purple-300 font-bold">
              {(alert.price ?? 0).toFixed(2)}€
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700/80 mb-2" />

      <div className="mt-2 flex gap-2">
        {/* BOTÓN CHAT – ENCENDIDO COMO SOFÍA */}
        <Button
          size="icon"
          onClick={() => onChat(alert)}
          disabled={alert.is_demo}
          className="
            h-8 w-[42px] rounded-lg
            bg-green-500
            hover:bg-green-400
            text-white
            shadow-[0_0_18px_rgba(34,197,94,0.85)]
            ring-2 ring-green-400/70
          "
        >
          <MessageCircle className="w-4 h-4" />
        </Button>

        {/* TELÉFONO */}
        {alert.phone ? (
          <Button
            size="icon"
            onClick={() => onCall(alert)}
            className="h-8 w-[42px] bg-white text-black rounded-lg"
          >
            <Phone className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            disabled
            className="h-8 w-[42px] bg-white/10 text-white rounded-lg opacity-50"
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        )}

        {/* BOTÓN WAITME */}
        <Button
          onClick={() => onBuyAlert(alert)}
          disabled={isLoading || alert.is_demo}
          className="flex-1 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          {isLoading ? 'Procesando...' : 'WaitMe!'}
        </Button>
      </div>
    </div>
  );
}