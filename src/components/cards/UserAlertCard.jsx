// ================================
// FILE: src/components/cards/UserAlertCard.jsx
// ================================
import React, { useMemo } from 'react';
import { MapPin, Clock, Navigation, MessageCircle, Phone, PhoneOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function UserAlertCard({
  alert,
  onBuyAlert,
  onChat,
  onCall,
  isLoading = false,
  isEmpty = false,
  userLocation
}) {
  const toMs = (v) => {
    if (!v) return null;
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    return new Date(v).getTime();
  };

  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/80 rounded-xl p-4 border-2 border-purple-500/50 flex items-center justify-center">
        <p className="text-xs text-gray-400">Toca un coche en el mapa</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 text-xs h-7 w-[95px] justify-center">
          Info usuario
        </Badge>

        <div className="flex-1 text-center text-xs text-white">
          {alert.created_date &&
            format(new Date(toMs(alert.created_date)), 'd MMMM - HH:mm', { locale: es })}
        </div>

        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 h-7 flex items-center">
          <span className="text-xs text-purple-300 font-bold">
            {(alert.price ?? 0).toFixed(2)}€
          </span>
        </div>
      </div>

      <div className="border-t border-gray-700/80 mb-2" />

      {/* BOTONES */}
      <div className="flex gap-2 mt-2">

        {/* CHAT – ENCENDIDO REAL COMO SOFÍA */}
        <button
          onClick={() => onChat(alert)}
          disabled={alert?.is_demo}
          style={{
            width: 42,
            height: 32,
            borderRadius: 8,
            backgroundColor: '#22c55e',
            boxShadow: '0 0 18px rgba(34,197,94,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: alert?.is_demo ? 0.4 : 1,
            cursor: alert?.is_demo ? 'not-allowed' : 'pointer'
          }}
        >
          <MessageCircle size={16} color="white" />
        </button>

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

        {/* WAITME */}
        <Button
          onClick={() => onBuyAlert(alert)}
          disabled={isLoading || alert?.is_demo}
          className="flex-1 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          {isLoading ? 'Procesando...' : 'WaitMe!'}
        </Button>
      </div>
    </div>
  );
}