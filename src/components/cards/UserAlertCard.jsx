// ================================
// FILE: src/components/cards/UserAlertCard.jsx
// ================================
import React, { useMemo } from 'react';
import {
  MapPin,
  Clock,
  Navigation,
  MessageCircle,
  Phone,
  PhoneOff
} from 'lucide-react';
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
  const isDemo = Boolean(alert?.is_demo);

  // ---------------- helpers ----------------
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

  const normalizedUserLocation = useMemo(() => {
    if (!userLocation) return null;
    if (Array.isArray(userLocation)) {
      return { latitude: userLocation[0], longitude: userLocation[1] };
    }
    return {
      latitude: userLocation.latitude ?? userLocation.lat,
      longitude: userLocation.longitude ?? userLocation.lng
    };
  }, [userLocation]);

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
      <div className="bg-gray-900/80 rounded-xl px-4 py-4 border-2 border-purple-500/50 flex items-center justify-center">
        <p className="text-xs text-gray-500">Toca un coche en el mapa</p>
      </div>
    );
  }

  const distanceLabel = calculateDistanceLabel(alert.latitude, alert.longitude);
  const waitUntil =
    alert.wait_until
      ? format(new Date(toMs(alert.wait_until)), 'HH:mm', { locale: es })
      : '--:--';

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 text-xs h-7 w-[95px] justify-center">
          Info usuario
        </Badge>

        <div className="flex-1 text-center text-xs text-white">
          {alert.created_date &&
            format(new Date(toMs(alert.created_date)), 'd MMMM - HH:mm', {
              locale: es
            })}
        </div>

        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 h-7 flex items-center">
          <span className="text-purple-300 text-xs font-bold">
            {(alert.price ?? 0).toFixed(2)}€
          </span>
        </div>
      </div>

      <div className="border-t border-gray-700/80 mb-2" />

      {/* INFO */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40">
          {alert.user_photo ? (
            <img src={alert.user_photo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-white font-bold text-xl leading-none">
            {(alert.user_name || '').split(' ')[0]}
          </p>
          <p className="text-gray-300 text-sm">{alert.car_brand} {alert.car_model}</p>

          <div className="flex items-center gap-2 mt-2">
            <div className="bg-white rounded-md border-2 border-gray-400 px-2 text-black font-mono font-bold text-sm">
              {alert.car_plate}
            </div>

            {distanceLabel && (
              <div className="flex items-center gap-1 text-xs text-white">
                <Navigation className="w-3 h-3 text-purple-400" />
                {distanceLabel.value}{distanceLabel.unit}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXTRA */}
      <div className="pt-2 border-t border-gray-700/80 mt-2 space-y-1">
        <div className="flex items-start gap-1.5 text-xs text-gray-200">
          <MapPin className="w-4 h-4 text-purple-400" />
          {alert.address}
        </div>

        <div className="flex items-start gap-1.5 text-xs text-gray-200">
          <Clock className="w-4 h-4 text-purple-400" />
          Se va en {alert.available_in_minutes} min · Te espera hasta las {waitUntil}
        </div>
      </div>

      {/* BOTONES */}
      <div className="mt-2 flex gap-2">
        {/* CHAT — IGUAL QUE SOFÍA */}
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600 text-white h-8 w-[42px]"
          onClick={() => !isDemo && onChat(alert)}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>

        {/* TELÉFONO */}
        {alert.phone ? (
          <Button
            size="icon"
            className="bg-white text-black h-8 w-[42px]"
            onClick={() => !isDemo && onCall(alert)}
          >
            <Phone className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="icon" disabled className="h-8 w-[42px] opacity-40">
            <PhoneOff className="w-4 h-4" />
          </Button>
        )}

        {/* WAITME — ENCENDIDO */}
        <Button
          className="flex-1 h-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          onClick={() => !isDemo && onBuyAlert(alert)}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando…' : 'WaitMe!'}
        </Button>
      </div>
    </div>
  );
}