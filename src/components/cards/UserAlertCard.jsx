import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, MessageCircle, Navigation, Phone, PhoneOff } from 'lucide-react';

const toMs = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return v > 10_000_000_000 ? v : v * 1000;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
};

const formatPlate = (plate) => {
  const p = String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  if (!p) return '---- ---';
  if (p.length <= 4) return p;
  const a = p.slice(0, Math.max(1, p.length - 3));
  const b = p.slice(-3);
  return `${a} ${b}`.trim();
};

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

export default function UserAlertCard({
  alert,
  isEmpty = false,
  onBuyAlert = () => {},
  onChat = () => {},
  onCall = () => {},
  isLoading = false,
  userLocation = null
}) {
  const normalizedUserLocation = useMemo(() => {
    if (!userLocation) return null;
    if (Array.isArray(userLocation)) {
      const lat = safeNum(userLocation[0]);
      const lng = safeNum(userLocation[1]);
      return lat != null && lng != null ? { latitude: lat, longitude: lng } : null;
    }
    const lat = safeNum(userLocation.latitude ?? userLocation.lat);
    const lng = safeNum(userLocation.longitude ?? userLocation.lng ?? userLocation.lon);
    return lat != null && lng != null ? { latitude: lat, longitude: lng } : null;
  }, [userLocation]);

  const distanceLabel = useMemo(() => {
    const lat = safeNum(alert?.latitude);
    const lng = safeNum(alert?.longitude);
    if (!normalizedUserLocation || lat == null || lng == null) return null;

    const R = 6371e3;
    const φ1 = (normalizedUserLocation.latitude * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - normalizedUserLocation.latitude) * Math.PI) / 180;
    const Δλ = ((lng - normalizedUserLocation.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * (Math.sin(Δλ / 2) ** 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;

    if (!Number.isFinite(meters)) return null;
    if (meters < 1000) return { value: Math.round(meters), unit: 'm' };
    return { value: (meters / 1000).toFixed(1), unit: 'km' };
  }, [alert?.latitude, alert?.longitude, normalizedUserLocation]);

  const dateText = useMemo(() => {
    const ms = toMs(alert?.created_date);
    if (!ms) return '';
    try {
      const d = new Date(ms);
      const datePart = format(d, 'd MMMM', { locale: es });
      const timePart = format(d, 'HH:mm', { locale: es });
      return `${datePart.charAt(0).toUpperCase() + datePart.slice(1)} - ${timePart}`;
    } catch {
      return '';
    }
  }, [alert?.created_date]);

  const waitUntilLabel = useMemo(() => {
    const created = toMs(alert?.created_date);
    const mins = safeNum(alert?.available_in_minutes ?? alert?.availableInMinutes);
    if (!created || !mins) return '';
    const until = new Date(created + mins * 60_000);
    try {
      return format(until, 'HH:mm', { locale: es });
    } catch {
      return '';
    }
  }, [alert?.created_date, alert?.available_in_minutes, alert?.availableInMinutes]);

  const priceText = useMemo(() => {
    const p = safeNum(alert?.price);
    return p == null ? '0.00€' : `${p.toFixed(2)}€`;
  }, [alert?.price]);

  const phoneEnabled = Boolean(alert?.phone && alert?.allow_phone_calls !== false);

  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-4 border-2 border-purple-500/50 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-purple-500" strokeWidth={2.5} />
          <p className="text-xs">Toca un coche en el mapa para ver sus datos</p>
        </div>
      </div>
    );
  }

  const carLabel = `${alert?.car_brand || ''} ${alert?.car_model || ''}`.trim() || 'Sin datos';

  const PlateProfile = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8 w-24">
      <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
        <span className="text-white text-[9px] font-bold">E</span>
      </div>
      <span className="flex-1 text-center text-black font-mono font-bold text-base tracking-wider">
        {formatPlate(plate)}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {/* Info usuario: MISMO ANCHO que la foto */}
        <Badge className="w-[95px] justify-center bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 px-0 select-none pointer-events-none">
          Info usuario
        </Badge>

        <div className="flex-1 text-center text-xs text-white">{dateText}</div>

        <div className="flex items-center gap-1">
          {distanceLabel ? (
            <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
              <Navigation className="w-3 h-3 text-purple-400" />
              <span className="text-white font-bold text-xs">
                {distanceLabel.value}{distanceLabel.unit}
              </span>
            </div>
          ) : null}
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
            <span className="text-purple-300 font-bold text-xs">{priceText}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700/80 mb-2" />

      {/* Contenido */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
          {alert?.user_photo ? (
            <img src={alert.user_photo} alt={alert.user_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">👤</div>
          )}
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p className="font-bold text-xl text-white leading-none min-h-[22px]">
            {(alert?.user_name || '').split(' ')[0] || 'Usuario'}
          </p>

          <p className="text-sm font-medium text-gray-200 leading-none flex-1 flex items-center truncate relative top-[6px]">
            {carLabel}
          </p>

          <div className="flex items-end gap-2 mt-1 min-h-[28px]">
            <div className="flex-shrink-0">
              <PlateProfile plate={alert?.car_plate} />
            </div>

            <div className="flex-1 flex justify-center">
              {/* Icono coche (no lo cambio aquí para no romper tu look actual) */}
              <div className="w-16 h-10 rounded-md border border-white/20 bg-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Líneas pegadas a la izquierda */}
      <div className="pt-1.5 border-t border-gray-700/80 mt-2">
        <div className="space-y-1.5">
          {alert?.address ? (
            <div className="flex items-start gap-1.5 text-xs">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-gray-200 leading-5 line-clamp-1">{alert.address}</span>
            </div>
          ) : null}

          {alert?.available_in_minutes != null ? (
            <div className="flex items-start gap-1.5 text-xs">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-gray-200 leading-5">
                Se va en {alert.available_in_minutes} min ·{' '}
                <span className="text-purple-400">Te espera hasta las {waitUntilLabel}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer: botones siempre encendidos (salvo demo) */}
      <div className="mt-2">
        <div className="flex gap-2">
          <Button
            size="icon"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
            onClick={() => onChat(alert)}
            disabled={Boolean(alert?.is_demo)}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {phoneEnabled ? (
            <Button
              size="icon"
              className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
              onClick={() => onCall(alert)}
              disabled={Boolean(alert?.is_demo)}
            >
              <Phone className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed"
              disabled
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </Button>
          )}

          {/* WaitMe en MORADO */}
          <div className="flex-1">
            <Button
              className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold border-2 border-purple-500/40"
              onClick={() => onBuyAlert(alert)}
              disabled={isLoading || Boolean(alert?.is_demo)}
            >
              {isLoading ? 'Procesando...' : 'WaitMe!'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}