import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, MapPin } from 'lucide-react';

export default function ReservationRequestModal({ 
  notification, 
  onAccept, 
  onReject,
  isProcessing = false 
}) {
  if (!notification) return null;

  const fixedAvatars = {
    Sofía: 'https://randomuser.me/api/portraits/women/68.jpg',
    Hugo: 'https://randomuser.me/api/portraits/men/32.jpg',
    Nuria: 'https://randomuser.me/api/portraits/women/44.jpg',
    Iván: 'https://randomuser.me/api/portraits/men/75.jpg',
    Marco: 'https://randomuser.me/api/portraits/men/12.jpg'
  };

  const getAvatar = (name) => fixedAvatars[String(name || '').trim()] || null;

  const carColors = [
    { value: 'blanco', fill: '#FFFFFF' },
    { value: 'negro', fill: '#1a1a1a' },
    { value: 'rojo', fill: '#ef4444' },
    { value: 'azul', fill: '#3b82f6' },
    { value: 'amarillo', fill: '#facc15' },
    { value: 'gris', fill: '#6b7280' }
  ];

  const getCarFill = (colorValue) => {
    const c = carColors.find((x) => x.value === (colorValue || '').toLowerCase());
    return c?.fill || '#6b7280';
  };

  const formatPlate = (plate) => {
    const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
    if (!p) return '0000 XXX';
    const a = p.slice(0, 4);
    const b = p.slice(4);
    return `${a} ${b}`.trim();
  };

  const CarIcon = ({ color, size = 'w-14 h-9' }) => (
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

  const PlateDisplay = ({ plate }) => (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-6">
      <div className="bg-blue-600 h-full w-4 flex items-center justify-center">
        <span className="text-white text-[7px] font-bold">E</span>
      </div>
      <span className="px-1.5 text-black font-mono font-bold text-xs tracking-wider">
        {formatPlate(plate)}
      </span>
    </div>
  );

  const senderName = notification.sender_name || 'Usuario';
  const senderPhoto = notification.sender_photo || getAvatar(senderName);
  const buyerCar = notification.buyer_car || 'Coche desconocido';
  const buyerPlate = notification.buyer_plate || '0000XXX';
  const buyerCarColor = notification.buyer_car_color || 'gris';
  const alertAddress = notification.alert_address || 'Ubicación';
  const alertPrice = notification.amount || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-purple-900/95 to-purple-950/95 rounded-2xl p-6 max-w-md w-full border-2 border-purple-500/50 shadow-2xl"
        >
          {/* Título con animación */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              🚗 ¡WaitMe! Nuevo
            </h2>
            <p className="text-purple-300 text-sm">
              <span className="font-bold text-white">{senderName}</span> quiere reservar tu alerta
            </p>
          </motion.div>

          {/* Contenido del usuario */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-black/30 rounded-xl p-4 mb-6 border border-purple-400/30"
          >
            {/* Foto y nombre */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400/50 flex-shrink-0">
                {senderPhoto ? (
                  <img src={senderPhoto} alt={senderName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{senderName}</h3>
                <p className="text-purple-300 text-sm">{buyerCar}</p>
              </div>
            </div>

            {/* Coche y matrícula */}
            <div className="flex items-center justify-between bg-black/40 rounded-lg p-3 mb-3">
              <PlateDisplay plate={buyerPlate} />
              <CarIcon color={getCarFill(buyerCarColor)} />
            </div>

            {/* Información de la alerta */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-purple-200">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="line-clamp-1">{alertAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-200">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Ahora mismo</span>
                </div>
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                  <span className="text-green-400 font-bold">{alertPrice.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3"
          >
            <Button
              onClick={onReject}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6 mr-2" />
              Rechazar
            </Button>
            <Button
              onClick={onAccept}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50"
            >
              <Check className="w-6 h-6 mr-2" />
              Aceptar
            </Button>
          </motion.div>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 text-purple-300 text-sm"
            >
              Procesando...
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}