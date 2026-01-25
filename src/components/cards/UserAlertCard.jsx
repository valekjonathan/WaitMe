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
  // ===== Helpers (mismo look que la tarjeta de “Sofía” en Tus reservas) =====
  const toMs = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isNaN(n) && /^\d+(?:\.\d+)?$/.test(s)) return n < 1e12 ? n * 1000 : n;
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    }
    return null;
  };

  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const raw = format(new Date(ts), 'd MMMM - HH:mm', { locale: es });
    return raw.replace(/^\d+\s+([a-záéíóúñ]+)/i, (m, mon) => {
      const cap = mon.charAt(0).toUpperCase() + mon.slice(1);
      return m.replace(mon, cap);
    });
  };

  const calculateDistanceLabel = (lat, lon) => {
    if (!userLocation || lat == null || lon == null) return null;
    const [lat1, lon1] = userLocation;
    const R = 6371;
    const dLat = (lat - lat1) * Math.PI / 180;
    const dLon = (lon - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getWaitUntilTs = (a) => {
    const created = toMs(a?.created_date) || toMs(a?.created_at) || Date.now();
    const candidates = [
      a?.wait_until,
      a?.waitUntil,
      a?.expires_at,
      a?.expiresAt,
      a?.ends_at,
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

  const carColors = {
    blanco: '#FFFFFF',
    negro: '#1a1a1a',
    rojo: '#ef4444',
    azul: '#3b82f6',
    amarillo: '#facc15',
    gris: '#6b7280',
    verde: '#22c55e'
  };

  const getCarFill = (colorValue) => carColors[String(colorValue || '').toLowerCase()] || '#6b7280';

  const formatPlate = (plate) => {
    const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
    if (!p) return 'XXXX XXX';
    const a = p.slice(0, 4);
    const b = p.slice(4);
    return `${a} ${b}`.trim();
  };

  const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
    <svg viewBox="0 0 48 24" className={size} fill="none">
      <path
        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M16 9 L18 12 L30 12 L32 9 Z"
        fill="rgba(255,255,255,0.3)"
        stroke="white"
        strokeWidth="0.5"
      />
      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="14" cy="18" r="2" fill="#666" />
      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="2" fill="#666" />
    </svg>
  );

  const PlateProfile = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
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

  const waitUntilTs = useMemo(() => getWaitUntilTs(alert), [alert]);
  const waitUntilLabel = useMemo(() => {
    if (!waitUntilTs) return '--:--';
    return format(new Date(waitUntilTs), 'HH:mm', { locale: es });
  }, [waitUntilTs]);

  const priceText = useMemo(() => {
    const n = Number(alert?.price);
    if (!Number.isFinite(n)) return '--';
    return `${n.toFixed(2)}€`;
  }, [alert?.price]);

  const phoneEnabled = Boolean(alert?.phone && alert?.allow_phone_calls !== false);

  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-4 border-2 border-purple-500/50 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: '#A855F7' }} strokeWidth={2} />
          <p className="text-sm">Toca un coche en el mapa para ver sus datos</p>
        </div>
      </div>
    );
  }

  const carLabel = `${alert?.car_brand || ''} ${alert?.car_model || ''}`.trim() || 'Sin datos';

  return (
    <div className="bg-black/70 rounded-xl p-3 pb-2 border border-purple-500/50">
      {/* Header: Info usuario + Fecha + Distancia + Precio */}
      <CardHeaderRow
        left={
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 w-[95px] flex items-center justify-center text-center cursor-default select-none pointer-events-none">
            Info usuario
          </Badge>
        }
        dateText={dateText}
        right={
          <div className="flex items-center gap-1 text-xs text-white">
            {distanceLabel && (
              <>
                <Navigation className="w-3 h-3 text-purple-400" />
                <span className="text-white font-medium">{distanceLabel}</span>
              </>
            )}
            <span className="text-white font-medium">{priceText}</span>
          </div>
        }
      />

      {/* Cuerpo: Foto usuario, datos vehículo */}
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
            {(alert?.user_name || '').split(' ')[0]}
          </p>
          <p className="text-sm font-medium text-gray-200 leading-none flex-1 flex items-center truncate relative top-[6px]">
            {carLabel}
          </p>

          <div className="flex items-center gap-x-2 mt-auto">
            <PlateProfile plate={alert?.car_plate} />
            <div className="flex-1 flex justify-center">
              <div className="flex-shrink-0 relative -top-[1px]">
                <CarIconProfile color={getCarFill(alert?.car_color)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones: Chat, Llamar, WaitMe */}
      <div className="flex items-end gap-2 mt-2">
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
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
            size="icon"
            className="bg-white text-gray-400 rounded-lg h-8 w-[42px]"
            disabled
          >
            <PhoneOff className="w-4 h-4 text-white" />
          </Button>
        )}

        <div className="flex-1">
          <Button
            className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold border-2 border-purple-500/40"
            onClick={() => onBuyAlert(alert)}
            disabled={isLoading || Boolean(alert?.is_demo) || alert?.status !== 'active'}
          >
            {isLoading ? 'Procesando...' : 'WaitMe!'}
          </Button>
        </div>
      </div>
    </div>
  );
}