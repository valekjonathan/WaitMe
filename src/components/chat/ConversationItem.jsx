import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageCircle, MapPin, Clock, Car, Star, Archive, MoreVertical, Scissors, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const carColorMap = {
  'blanco': '#FFFFFF',
  'negro': '#1a1a1a',
  'rojo': '#ef4444',
  'azul': '#3b82f6',
  'amarillo': '#facc15',
  'gris': '#6b7280'
};

const VehicleIcon = ({ color, type = 'car' }) => {
  return (
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );
};

export default function ConversationItem({ 
  conv, 
  user, 
  alert, 
  otherUser, 
  unreadCount, 
  distanceText, 
  index,
  onToggleImportant,
  onToggleArchive 
}) {
  const isP1 = conv.participant1_id === user?.id;
  const hasUnread = unreadCount > 0;
  const isImportant = isP1 ? conv.important_for_p1 : conv.important_for_p2;

  return (
    <motion.div
      key={conv.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className={`bg-gray-900 rounded-2xl p-4 transition-all relative
        ${hasUnread ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : 'border-2 border-gray-800'}
      `}>
        {/* Menú de opciones */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={onToggleImportant}
                className="text-white hover:bg-gray-700 cursor-pointer"
              >
                <Star className={`w-4 h-4 mr-2 ${isImportant ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {isImportant ? 'Quitar de importantes' : 'Marcar como importante'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onToggleArchive}
                className="text-white hover:bg-gray-700 cursor-pointer"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archivar conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Indicador de importante */}
        {isImportant && (
          <div className="absolute top-2 left-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          </div>
        )}

        <div className="flex items-start gap-3 flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 w-full">
            <p className="text-[13px] text-purple-400 font-medium">Info del usuario:</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {distanceText && (
                <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <span className="text-purple-400 font-bold text-xs whitespace-nowrap">{distanceText}</span>
                </div>
              )}
              {alert && (
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <span className="text-purple-400 font-bold text-xs whitespace-nowrap">{Math.round(alert.price)}€</span>
                </div>
              )}
            </div>
          </div>

          {/* Foto + Info derecha */}
          <div className="flex gap-3 w-full">
            {/* Foto + botones + info debajo */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                <div className="w-[92px] h-20 rounded-lg overflow-hidden border-2 border-purple-500 bg-gray-800 flex items-center justify-center">
                  {otherUser.photo ? (
                    <img src={otherUser.photo} className="w-full h-full object-cover" alt={otherUser.name} />
                  ) : (
                    <span className="text-3xl font-bold text-purple-400">{otherUser.initial}</span>
                  )}
                </div>
              </Link>

              {/* Dirección */}
              {alert?.address && (
                <div className="flex items-center gap-1.5 text-gray-500 text-xs w-full">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate flex-1">{alert.address}</span>
                </div>
              )}

              {/* Tiempo restante */}
              {alert?.available_in_minutes !== undefined && (
                <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Se va en {alert.available_in_minutes} min</span>
                  <span className="text-purple-400">
                    • Te espera hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}
                  </span>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2 items-center">
                <div>
                  <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
                    <Button size="icon" className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px] relative">
                      <MessageCircle className="w-4 h-4" />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`border-gray-700 h-8 w-[42px] ${alert?.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
                    onClick={() => alert?.allow_phone_calls && alert?.phone && (window.location.href = `tel:${alert.phone}`)}
                    disabled={!alert?.allow_phone_calls}
                  >
                    {alert?.allow_phone_calls ? (
                      <Phone className="w-4 h-4 text-green-400" />
                    ) : (
                      <Phone className="w-4 h-4 text-gray-600" />
                    )}
                  </Button>
                </div>

                {alert && (
                  <div className="flex-1">
                    <CountdownTimer availableInMinutes={alert.available_in_minutes} />
                  </div>
                )}
              </div>
            </div>

            {/* Info derecha */}
            <div className="flex-1 flex flex-col gap-1 min-w-0 -ml-[140px] -mt-1">
              <p className="font-bold text-xl text-white mb-1.5">
                {otherUser.name}
              </p>

              {alert && (
                <div className="flex items-center justify-between -mt-2.5 mb-1.5">
                  <p className="text-sm text-gray-400">
                    {alert.car_brand} {alert.car_model}
                  </p>
                  <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              )}

              {alert && (
                <div className="-mt-[7px] bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                  <div className="bg-blue-600 h-full w-5 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-white">E</span>
                  </div>
                  <span className="flex-1 text-center font-mono font-bold text-xs tracking-wider text-black">
                    {alert.car_plate ? alert.car_plate.replace(/\s/g, '').toUpperCase().slice(0, 4) + ' ' + alert.car_plate.replace(/\s/g, '').toUpperCase().slice(4) : 'XXXX XXX'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Último mensaje */}
          <div className="flex-1 min-w-0 w-full">
            <p className="text-xs text-purple-400 font-medium mb-1">Últimos mensajes:</p>
            <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)}>
              <p className={`text-sm truncate ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                {conv.last_message_text || 'Sin mensajes'}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}