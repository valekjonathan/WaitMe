import React from 'react';
import { MapPin, Clock, MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserAlertCard({
  alert,
  isEmpty,
  onBuyAlert,
  onChat,
  onCall,
  isLoading,
}) {
  if (isEmpty) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        Selecciona una alerta en el mapa
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-3 flex flex-col gap-2 h-full">
      {/* CABECERA */}
      <div className="flex items-center justify-between">
        <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">
          Info usuario
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span>{alert?.distance || '0.1km'}</span>
          <span className="bg-purple-600 px-2 py-0.5 rounded-full text-white">
            {alert?.price || '5.00€'}
          </span>
        </div>
      </div>

      {/* USUARIO */}
      <div className="flex items-center gap-3">
        <img
          src={alert?.avatar}
          alt="avatar"
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="text-white font-semibold leading-tight">
            {alert?.name}
          </p>
          <p className="text-xs text-gray-400 leading-tight">
            {alert?.car}
          </p>
          <p className="text-xs text-purple-400 leading-tight">
            {alert?.plate}
          </p>
        </div>
      </div>

      {/* DIRECCIÓN */}
      <div className="flex items-start gap-2 text-xs text-gray-300">
        <MapPin size={14} className="mt-0.5 shrink-0" />
        <span className="leading-tight">
          {alert?.address}
        </span>
      </div>

      {/* TIEMPO */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock size={14} />
        <span className="leading-tight">
          Se va en {alert?.minutes || '10'} min · Te espera hasta las ----
        </span>
      </div>

      {/* ACCIONES */}
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="icon"
          className="border-gray-700 h-9 w-9"
          onClick={onChat}
        >
          <MessageCircle size={16} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="border-gray-700 h-9 w-9"
          onClick={onCall}
        >
          <Phone size={16} />
        </Button>

        <Button
          className="flex-1 h-9 bg-green-600 hover:bg-green-700"
          onClick={onBuyAlert}
          disabled={isLoading}
        >
          WaitMe!
        </Button>
      </div>
    </div>
  );
}