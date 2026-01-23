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

  const calculateDistanceLabel = (lat, lng) => {
    if (!lat || !lng || !userLocation) return null;
    const R = 6371e3;
    const φ1 = userLocation.latitude * (Math.PI / 180);
    const φ2 = lat * (Math.PI / 180);
    const Δφ = (lat - userLocation.latitude) * (Math.PI / 180);
    const Δλ = (lng - userLocation.longitude) * (Math.PI / 180);
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;
    const distanceKm = meters / 1000;
    return { value: distanceKm.toFixed(1), unit: 'km' };
  };

  const formatPlate = (plate) => String(plate || '').toUpperCase().replace(/\s/g, '');

  const waitUntilTs = alert?.wait_until ? toMs(alert.wait_until) : null;
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
          <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: '#A855F7' }} strokeWidth={2.5} />
          <p className="text-xs">Toca un coche en el mapa para ver sus datos</p>
        </div>
      </div>
    );
  }

  const carLabel = `${alert?.car_brand || ''} ${alert?.car_model || ''}`.trim() || 'Sin datos';

  // Componentes internos para licencia y header
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
    [alert?.latitude, alert?.longitude, userLocation]
  );

  const dateText = useMemo(() => {
    if (!alert?.created_at) return '';
    try {
      const d = new Date(toMs(alert.created_at));
      // Formato: "23 Enero - 16:22"
      const datePart = format(d, "d MMMM", { locale: es });
      const timePart = format(d, "HH:mm", { locale: es });
      return `${datePart.charAt(0).toUpperCase() + datePart.slice(1)} - ${timePart}`;
    } catch {
      return '';
    }
  }, [alert?.created_at]);

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative">
      {/* Header: Info usuario + Fecha + Distancia + Precio */}
      <CardHeaderRow
        left={
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 px-4 flex items-center justify-center text-center cursor-default select-none pointer-events-none">
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
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
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
              <div className="flex-shrink-0 relative -top-[1px]">
                <CarIconProfile color={getCarFill(alert?.car_color)} size="w-16 h-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Footer: Chat + Llamar + WaitMe (en vez de contador) */}
      <div className="mt-2">
        <div className="flex gap-2">
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
              className="w-full h-8 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold border-2 border-green-500/40"
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

// Funciones auxiliares para obtener color de vehículo (icono) – pueden estar definidas en otro módulo utilitario
const carColors = {
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  rojo: '#ef4444',
  azul: '#3b82f6',
  amarillo: '#facc15',
  gris: '#6b7280'
};
const getCarFill = (colorName) => carColors[colorName] || '#CCCCCC';

// Componente de icono de vehículo (coche/furgoneta) con color
const CarIconProfile = ({ color, size = 'w-8 h-5' }) => (
  <svg viewBox="0 0 48 24" className={size} fill="none">
    <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill={color} stroke="white" strokeWidth="1.5" />
    <rect x="8" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
    <rect x="12" y="5" width="20" height="4" fill="white" />
    <rect x="2" y="18" width="6" height="2" fill="white" />
    <rect x="40" y="18" width="6" height="2" fill="white" />
  </svg>
);