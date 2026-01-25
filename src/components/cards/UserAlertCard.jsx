import React from 'react';
import { MapPin, Clock, Car, MessageCircle, CreditCard, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserAlertCard({ alert, isEmpty, onBuyAlert, onChat, userLocation }) {
  // 1. GESTIÓN DE ESTADO VACÍO (Para que no se quede en blanco si no hay selección)
  if (isEmpty || !alert) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/40 rounded-3xl border border-dashed border-gray-800 p-6 text-center">
        <div className="bg-gray-800/50 p-4 rounded-full mb-3">
          <Car className="w-8 h-8 opacity-20" />
        </div>
        <p className="text-sm">Selecciona un coche en el mapa para ver los detalles de la plaza</p>
      </div>
    );
  }

  // 2. CÁLCULO DE DISTANCIA SEGURO (Previene errores si userLocation falla)
  const getDistance = () => {
    if (!userLocation || !alert.latitude) return "Distancia N/D";
    const R = 6371; 
    const dLat = (alert.latitude - userLocation[0]) * Math.PI / 180;
    const dLon = (alert.longitude - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(alert.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-full bg-gray-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
    >
      {/* CABECERA: Usuario e Info Principal */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={alert.user_photo || `https://ui-avatars.com/api/?name=${alert.user_name}&background=8b5cf6&color=fff`} 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-500/30"
              alt="User"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-gray-900" />
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight">{alert.user_name || 'Usuario'}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>4.9 (24 avisos)</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-black text-purple-400">{alert.price || 0}€</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pago Seguro</span>
        </div>
      </div>

      {/* CUERPO: Detalles de la plaza */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-3 items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <span>Sale en: <b>{alert.available_in_minutes || '?'} min</b></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Navigation className="w-4 h-4 text-blue-400" />
            </div>
            <span>A unos <b>{getDistance()}</b></span>
          </div>
        </div>

        <div className="bg-black/40 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Car className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Vehículo</span>
          </div>
          <p className="text-sm font-medium">{alert.car_brand} {alert.car_model}</p>
          <p className="text-[10px] font-mono text-purple-300 mt-1 bg-purple-500/20 w-fit px-2 py-0.5 rounded-md">
            {alert.car_plate || 'SIN PLACA'}
          </p>
        </div>
      </div>

      {/* ACCIONES: Botones grandes para evitar errores de pulsación */}
      <div className="p-4 pt-0 flex gap-2">
        <Button 
          variant="outline"
          onClick={() => onChat(alert)}
          className="flex-none w-14 h-14 rounded-2xl border-gray-700 hover:bg-gray-800"
        >
          <MessageCircle className="w-6 h-6 text-purple-400" />
        </Button>
        <Button 
          onClick={() => onBuyAlert(alert)}
          className="flex-1 h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-lg font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          RESERVAR PLAZA
        </Button>
      </div>
    </motion.div>
  );
}