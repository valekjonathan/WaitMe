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

  const formatPlate = (plate) => {
    if (!plate) return 'XXXX XXX';
    const cleaned = plate.replace(/\s/g, '').toUpperCase();
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return cleaned;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2.5 border-2 ${hasUnread ? 'border-purple-500' : 'border-gray-800'} flex flex-col h-full relative`}>
        {/* Menú de opciones */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
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
          <div className="absolute top-2 left-2 z-10">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        )}

        {/* Header con precio y distancia */}
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[13px] text-purple-400">Info del usuario:</p>
          <div className="flex items-center gap-1.5">
            {distanceText && (
              <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-purple-400" />
                <span className="text-white font-bold text-xs">{distanceText}</span>
              </div>
            )}
            {alert && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                <span className="text-purple-400 font-bold text-xs">{Math.round(alert.price)}€</span>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de usuario */}
        <div className="flex gap-2.5 mb-1.5 flex-1">
          <div className="flex flex-col gap-1.5">
            <div className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 ${hasUnread ? 'border-purple-500' : 'border-gray-600'} bg-gray-800 flex-shrink-0`}>
              {otherUser.photo ? (
                <img src={otherUser.photo} className="w-full h-full object-cover" alt={otherUser.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                  👤
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <Link to={createPageUrl(`Chat?conversationId=${conv.id}`)} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg border-2 border-gray-700"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 h-8 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg border-2 border-gray-700"
              >
                <Scissors className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg border-2 border-gray-700 font-bold text-sm"
            >
              WaitMe!
            </Button>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <p className={`font-bold text-xl ${hasUnread ? 'text-white' : 'text-gray-400'} mb-1.5`}>
              {otherUser.name?.split(' ')[0]}
            </p>

            <div className="flex items-center justify-between -mt-2.5 mb-1.5">
              <p className={`text-sm font-medium ${hasUnread ? 'text-white' : 'text-gray-400'}`}>
                {alert?.car_brand} {alert?.car_model}
              </p>
              {alert && <VehicleIcon color={carColorMap[alert.car_color] || '#6b7280'} />}
            </div>

            {alert && (
              <div className={`-mt-[7px] ${hasUnread ? 'bg-white' : 'bg-gray-700'} rounded-md flex items-center overflow-hidden border-2 ${hasUnread ? 'border-gray-400' : 'border-gray-600'} h-8`}>
                <div className={`${hasUnread ? 'bg-blue-600' : 'bg-gray-600'} h-full w-6 flex items-center justify-center`}>
                  <span className={`text-[9px] font-bold ${hasUnread ? 'text-white' : 'text-gray-500'}`}>E</span>
                </div>
                <span className={`flex-1 text-center font-mono font-bold text-base tracking-wider ${hasUnread ? 'text-black' : 'text-gray-500'}`}>
                  {formatPlate(alert.car_plate)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Información de ubicación */}
        <div className="space-y-1.5 pt-1.5 border-t border-gray-700">
          {alert?.address && (
            <div className="flex items-start gap-1.5 text-gray-400 text-xs">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{alert.address}</span>
            </div>
          )}
          
          {alert?.available_in_minutes !== undefined && (
            <div className="flex items-center gap-1 text-gray-500 text-[10px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Se va en {alert.available_in_minutes} min</span>
              <span className="text-purple-400">
                • Te espera hasta las {format(new Date(new Date().getTime() + alert.available_in_minutes * 60000), 'HH:mm', { locale: es })}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}