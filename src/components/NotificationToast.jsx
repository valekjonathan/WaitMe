import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'reservation_request':
        return '🚗';
      case 'reservation_accepted':
        return '✅';
      case 'reservation_rejected':
        return '❌';
      case 'buyer_nearby':
        return '📍';
      case 'payment_completed':
        return '💰';
      default:
        return '🔔';
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'reservation_request':
        return 'Nueva solicitud de reserva';
      case 'reservation_accepted':
        return 'Reserva aceptada';
      case 'reservation_rejected':
        return 'Reserva rechazada';
      case 'buyer_nearby':
        return 'Comprador cerca';
      case 'payment_completed':
        return 'Pago completado';
      default:
        return 'Nueva notificación';
    }
  };

  const getMessage = () => {
    switch (notification.type) {
      case 'reservation_request':
        return `${notification.sender_name} quiere reservar tu plaza por ${notification.amount}€`;
      case 'reservation_accepted':
        return `${notification.sender_name} aceptó tu solicitud`;
      case 'reservation_rejected':
        return `${notification.sender_name} rechazó tu solicitud`;
      case 'buyer_nearby':
        return `${notification.sender_name} está cerca de tu ubicación`;
      case 'payment_completed':
        return `Has recibido ${notification.amount}€`;
      default:
        return 'Tienes una nueva notificación';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.95 }}
        className="fixed top-16 left-4 right-4 z-[9999] pointer-events-auto"
      >
        <div
          className="bg-gray-900/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden"
          onClick={onClose}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="text-3xl flex-shrink-0">{getIcon()}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-white font-bold text-sm leading-tight">
                  {getTitle()}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-300 text-xs leading-snug">
                {getMessage()}
              </p>
              
              <div className="mt-2 text-[10px] text-purple-400 font-medium">
                WaitMe! · Ahora
              </div>
            </div>

            {notification.sender_photo && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/40 flex-shrink-0">
                <img
                  src={notification.sender_photo}
                  alt={notification.sender_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}