// ================================
// FILE: src/components/cards/UserAlertCard.jsx
// ================================
import React, { useMemo } from 'react';
import { MapPin, Clock, Navigation, MessageCircle, Phone, PhoneOff, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function UserAlertCard({
  alert,
  onBuyAlert,
  onChat,
  onCall,
  onReject,
  isLoading = false,
  isEmpty = false,
  userLocation,
  buyLabel = 'WaitMe!',
  hideBuy = false,
  showDistanceInMeters = false,
  showCountdownTimer = false,
}) {
  // Normaliza userLocation para evitar errores cuando llega como array u objeto
  // Formatos aceptados: [lat, lng] | { latitude, longitude } | { lat, lng }
  const normalizedUserLocation = useMemo(() => {
    if (!userLocation) return null;

    if (Array.isArray(userLocation) && userLocation.length === 2) {
      const lat = Number(userLocation[0]);
      const lng = Number(userLocation[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
      return null;
    }

    const lat = Number(userLocation.latitude ?? userLocation.lat);
    const lng = Number(userLocation.longitude ?? userLocation.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
    return null;
  }, [userLocation]);

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

  const calculateDistanceLabel = (lat, lng) => {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng) || !normalizedUserLocation) return null;

    const R = 6371e3;
    const φ1 = normalizedUserLocation.latitude * (Math.PI / 180);
    const φ2 = nLat * (Math.PI / 180);
    const Δφ = (nLat - normalizedUserLocation.latitude) * (Math.PI / 180);
    const Δλ = (nLng - normalizedUserLocation.longitude) * (Math.PI / 180);

    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;
    const distanceKm = meters / 1000;

    if (!Number.isFinite(distanceKm)) return null;
    
    // Si showDistanceInMeters es true, mostrar en metros
    if (showDistanceInMeters && meters < 1000) {
      return { value: Math.round(meters), unit: ' m' };
    }
    
    return { value: distanceKm.toFixed(1), unit: 'km' };
  };

  const formatPlate = (plate) => {
    const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
    if (!p) return '0000 XXX';
    const a = p.slice(0, 4);
    const b = p.slice(4);
    return `${a} ${b}`.trim();
  };

  const waitUntilTs = alert?.wait_until ? toMs(alert.wait_until) : null;
  const waitUntilLabel = useMemo(() => {
    if (!waitUntilTs) return '--:--';
    try {
      return format(new Date(waitUntilTs), 'HH:mm', { locale: es });
    } catch {
      return '--:--';
    }
  }, [waitUntilTs]);

  const priceText = useMemo(() => {
    const n = Number(alert?.price);
    if (!Number.isFinite(n)) return '--';
    return `${n}€`;
  }, [alert?.price]);

  const phoneEnabled = Boolean(alert?.phone && alert?.allow_phone_calls !== false);

  const isDemo = Boolean(alert?.is_demo);
  const handleChat = () => {
    onChat?.(alert);
  };
  const handleCall = () => {
    onCall?.(alert);
  };
  const handleBuy = () => {
    if (isLoading) return;
    onBuyAlert?.(alert);
  };

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

  const CardHeaderRow = ({ left, dateText, right }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-shrink-0">{left}</div>
      <div className="flex-1 text-center text-xs text-white">{dateText}</div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );

  const distanceLabel = useMemo(
    () => calculateDistanceLabel(alert?.latitude, alert?.longitude),
    [alert?.latitude, alert?.longitude, normalizedUserLocation]
  );

  const dateText = useMemo(() => {
    if (!alert?.created_date) return '';
    try {
      const ms = toMs(alert.created_date);
      if (!ms) return '';
      const d = new Date(ms);
      const datePart = format(d, "d MMMM", { locale: es });
      const timePart = format(d, "HH:mm", { locale: es });
      return `${datePart.charAt(0).toUpperCase() + datePart.slice(1)} - ${timePart}`;
    } catch {
      return '';
    }
  }, [alert?.created_date]);

  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-4 border-2 border-purple-500/50 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: '#A855F7' }} strokeWidth={2.5} />
          <p className="text-xs">Toca un coche en el mapa para ver sus datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative">
      <CardHeaderRow
        left={
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 w-[95px] flex items-center justify-center text-center cursor-default select-none pointer-events-none">
            Info usuario
          </Badge>
        }
        dateText={dateText}
        right={
          <div className="flex items-center gap-1">
            {distanceLabel ? (
              <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                <Navigation className="w-3 h-3 text-purple-400" />
                <span className="text-white font-bold text-xs">{distanceLabel.value}{distanceLabel.unit}</span>
              </div>
            ) : null}
            <div className="bg-green-600/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
              <span className="text-green-400 font-bold text-sm flex items-center gap-0.5">
                {priceText.replace('.00', '')} <span className="text-[10px]">↑</span>
              </span>
            </div>
            {onReject ? (
              <button
                onClick={onReject}
                className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        }
      />

      <div className="border-t border-gray-700/80 mb-1" />

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
              <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">E</span>
                </div>
                <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                  {formatPlate(alert?.car_plate)}
                </span>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="flex-shrink-0 relative top-[2px]">
                <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
                  <path
                    d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
                    fill={getCarFill(alert?.car_color)}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-1.5 border-t border-gray-700/80 mt-1">
        <div className="space-y-1.5">
          {alert?.address ? (
            <div className="flex items-start gap-1.5 text-xs">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-gray-200 leading-5 line-clamp-1">{alert.address}</span>
            </div>
          ) : null}

          {alert?.available_in_minutes != null ? (
            <div className="flex items-center gap-1 text-xs overflow-hidden">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
              <span className="truncate">
                <span className="text-purple-400">
                  {alert.isIncomingRequest ? 'Te vas en' : 'Se va en'}{' '}
                  <span className="text-white">{alert.available_in_minutes}</span>{' '}
                  min · {alert.isIncomingRequest ? 'Debes esperar hasta las:' : 'Te espera hasta las:'}
                </span>
                {' '}
                <span className="text-white font-bold text-sm">{waitUntilLabel}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        {hideBuy ? (
          /* Fila de 4 columnas iguales cuando hideBuy está activo */
          <div className="grid grid-cols-4 gap-2">
            {/* 1. Chat */}
            <Button
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-full flex items-center justify-center border border-green-400/50"
              onClick={handleChat}>
              <MessageCircle className="w-4 h-4" />
            </Button>

            {/* 2. Llamada */}
            {phoneEnabled ? (
              <Button
                className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-full flex items-center justify-center border border-gray-300/50"
                onClick={handleCall}>
                <Phone className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-full flex items-center justify-center opacity-70 cursor-not-allowed border border-white/30"
                disabled>
                <PhoneOff className="w-4 h-4 text-white" />
              </Button>
            )}

            {/* 3. Ir – azul parpadeante con animación */}
            <style>{`
              @keyframes pulse-navigate {
                0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.8); }
                50% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2); }
              }
              .btn-navigate { animation: pulse-navigate 2s infinite; }
            `}</style>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-full flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed border border-blue-400/50 btn-navigate"
              disabled={!alert?.latitude || !alert?.longitude}
              onClick={() => {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`, '_blank');
              }}>
              <Navigation className="w-4 h-4" />
              <span className="font-semibold text-sm">Ir</span>
            </Button>

            {/* 4. Contador – estilo ActiveAlertCard */}
            <div className="h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center gap-1 px-1">
              <Clock className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 font-semibold whitespace-nowrap">
                {alert?.available_in_minutes != null ? `${alert.available_in_minutes} min` : '--'}
              </span>
            </div>
          </div>
        ) : (
          /* Fila estándar cuando hay botón WaitMe! */
          <div className="flex gap-2">
            <Button
              size="icon"
              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
              onClick={handleChat}>
              <MessageCircle className="w-4 h-4" />
            </Button>
            {phoneEnabled ? (
              <Button
                size="icon"
                className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
                onClick={handleCall}>
                <Phone className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed"
                disabled>
                <PhoneOff className="w-4 h-4 text-white" />
              </Button>
            )}
            <Button
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-3 flex items-center justify-center gap-1 disabled:opacity-40"
              disabled={!alert?.latitude || !alert?.longitude}
              onClick={() => {
                if (alert?.latitude && alert?.longitude) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`, '_blank');
                }
              }}>
              <Navigation className="w-4 h-4" />
              <span className="font-semibold text-sm">Ir</span>
            </Button>
            <div className="flex-1">
              <Button
                className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold border-2 border-purple-500/40"
                onClick={handleBuy}
                disabled={isLoading}>
                {isLoading ? 'Procesando...' : buyLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>);

}

const carColors = {
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  rojo: '#ef4444',
  azul: '#3b82f6',
  amarillo: '#facc15',
  gris: '#6b7280'
};
const getCarFill = (colorName) => carColors[colorName] || '#CCCCCC';

const CarIconProfile = ({ color, size = 'w-8 h-5' }) => (
  <svg viewBox="0 0 48 24" className={size} fill="none">
    <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill={color} stroke="white" strokeWidth="1.5" />
    <rect x="8" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
    <rect x="12" y="5" width="20" height="4" fill="white" />
    <rect x="2" y="18" width="6" height="2" fill="white" />
    <rect x="40" y="18" width="6" height="2" fill="white" />
  </svg>
);
export default React.memo(UserAlertCard);
