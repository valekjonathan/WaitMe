import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Navigation, MessageCircle, Phone, PhoneOff } from 'lucide-react';

export default function UserAlertCard({
  alert,
  isEmpty = false,
  onBuyAlert,
  onChat,
  onCall,
  isLoading = false,
  userLocation
}) {
  const toMs = (d) => {
    if (!d) return null;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : null;
  };

  const formatCardDate = (ms) => {
    if (!ms) return '--';
    const d = new Date(ms);
    const day = format(d, 'd', { locale: es });
    const month = format(d, 'MMMM', { locale: es });
    const hm = format(d, 'HH:mm', { locale: es });
    const m = month.charAt(0).toUpperCase() + month.slice(1);
    return `${day} ${m} - ${hm}`;
  };

  const formatPlate = (plate) => {
    const raw = String(plate || '').replace(/\s+/g, '').toUpperCase();
    if (!raw) return '---- ---';
    // simple split: 4 nums + 3 letras
    const nums = raw.slice(0, 4);
    const letters = raw.slice(4);
    return `${nums} ${letters}`.trim();
  };

  const phoneEnabled = Boolean(alert?.phone && alert?.allow_phone_calls !== false);
  const isFinalized = ['finalized', 'finalizada', 'finished', 'done'].includes(
    String(alert?.status || '').toLowerCase()
  );

  const calculateDistanceLabel = (lat, lng) => {
    try {
      if (!userLocation || !lat || !lng) return null;
      const [uLat, uLng] = userLocation;
      if (!Number.isFinite(uLat) || !Number.isFinite(uLng)) return null;

      const R = 6371;
      const dLat = ((lat - uLat) * Math.PI) / 180;
      const dLon = ((lng - uLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((uLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      if (!Number.isFinite(dist)) return null;
      if (dist < 1) return `${Math.round(dist * 1000)}m`;
      return `${dist.toFixed(1)}km`;
    } catch {
      return null;
    }
  };

  // Pega bien los nombres para iconos de coche (solo visual)
  const carIcon = (
    <svg width="46" height="26" viewBox="0 0 48 30">
      <path d="M8 20 L10 14 L16 12 L32 12 L38 14 L42 18 L42 24 L8 24 Z" fill="#6b7280" stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="24" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="14" cy="24" r="2" fill="#666" />
      <circle cx="36" cy="24" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="24" r="2" fill="#666" />
    </svg>
  );

  const PlateProfile = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8 w-[128px]">
      <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
        <span className="text-white text-[9px] font-bold">E</span>
      </div>
      <span className="flex-1 text-center text-black font-mono font-bold text-base tracking-wider">
        {formatPlate(plate)}
      </span>
    </div>
  );

  const CardHeaderRow = ({ left, dateText, right }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-shrink-0">{left}</div>
      <div className="flex-1 text-center text-xs text-white">{dateText}</div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );

  const distanceLabel = useMemo(
    () => calculateDistanceLabel(alert?.latitude, alert?.longitude),
    [alert?.latitude, alert?.longitude, userLocation]
  );

  const createdTs = useMemo(
    () => toMs(alert?.created_date) || toMs(alert?.created_at) || Date.now(),
    [alert?.created_date, alert?.created_at]
  );

  const dateText = useMemo(() => formatCardDate(createdTs), [createdTs]);

  const getWaitUntilTs = (a) => {
    if (!a) return null;
    const created = toMs(a.created_date) || toMs(a.created_at);
    if (!created) return null;

    // intenta varios campos
    const candidates = [
      a.wait_until,
      a.waitUntil,
      a.expires_at,
      a.ends_at,
      a?.endsAt
    ].filter(Boolean);

    for (const v of candidates) {
      const t = toMs(v);
      if (typeof t === 'number' && t > 0) return t;
    }

    const mins = Number(a?.available_in_minutes ?? a?.availableInMinutes);
    if (Number.isFinite(mins) && mins > 0) return created + mins * 60000;
    return null;
  };

  const waitUntilTs = useMemo(() => getWaitUntilTs(alert), [alert]);
  const waitUntilLabel = useMemo(() => {
    if (!waitUntilTs) return '--:--';
    return format(new Date(waitUntilTs), 'HH:mm', { locale: es });
  }, [waitUntilTs]);

  const priceText = useMemo(() => {
    const p = Number(alert?.price ?? 0);
    if (!Number.isFinite(p)) return '0.00€';
    return `${p.toFixed(2)}€`;
  }, [alert?.price]);

  if (isEmpty) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/40">
        <div className="text-center text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: '#A855F7' }} strokeWidth={2.5} />
          <p className="text-xs">Toca un coche en el mapa para ver sus datos</p>
        </div>
      </div>
    );
  }

  const carLabel = `${alert?.car_brand || ''} ${alert?.car_model || ''}`.trim() || 'Sin datos';

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative">
      {/* Header: Info usuario + Fecha + Distancia + Precio */}
      <CardHeaderRow
        left={
          <div className="bg-purple-500/20 border border-purple-400/50 text-purple-300 rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs text-center cursor-default select-none pointer-events-none">
            Info usuario
          </div>
        }
        dateText={dateText}
        right={
          <div className="flex items-center gap-1">
            {distanceLabel ? (
              <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                <Navigation className="w-3 h-3 text-purple-400" />
                <span className="text-white font-bold text-xs">{distanceLabel}</span>
              </div>
            ) : null}
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-md px-4 h-7 flex items-center justify-center">
              <span className="text-purple-300 font-bold text-xs">{priceText}</span>
            </div>
          </div>
        }
      />

      <div className="border-t border-gray-700/80 mb-2" />

      {/* Contenido (idéntico al look de “Sofía”, pero con WaitMe abajo) */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
          {alert?.user_photo ? (
            <img src={alert.user_photo} alt={alert.user_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">👤</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xl text-white leading-tight">{alert?.user_name || 'Usuario'}</div>
          </div>

          <div className="text-gray-300 text-sm mt-0.5">{carLabel}</div>

          <div className="flex items-center justify-between mt-2">
            <PlateProfile plate={alert?.car_plate} />
            <div className="flex items-center justify-center w-12 h-10 rounded-md bg-gray-800 border border-purple-500/20">
              {carIcon}
            </div>
          </div>

          {alert?.address ? (
            <div className="flex items-start gap-1.5 text-xs mt-2">
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

      {/* Footer: Chat + Llamar + WaitMe (en vez de contador) */}
      <div className="mt-2">
        <div className="flex gap-2">
          <Button
            size="icon"
            className={
              isFinalized
                ? 'bg-gray-700 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]'
            }
            onClick={() => onChat(alert)}
            disabled={isFinalized}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {phoneEnabled ? (
            <Button
              size="icon"
              className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
              onClick={() => onCall(alert)}
              disabled={isFinalized}
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

          <div className="flex-1">
            <Button
              className={
                isFinalized
                  ? 'w-full h-8 rounded-lg bg-gray-700 text-white font-semibold border-2 border-gray-600/60 opacity-70 cursor-not-allowed'
                  : 'w-full h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold border-2 border-green-400/40'
              }
              onClick={() => onBuyAlert(alert)}
              disabled={isFinalized || isLoading}
            >
              {isLoading ? 'Procesando...' : 'WaitMe!'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}