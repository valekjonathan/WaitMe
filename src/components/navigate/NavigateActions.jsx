/**
 * Modales de acción: pago liberado, aviso abandonar, aviso cancelar.
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function NavigateActions({
  showPaymentSuccess,
  alert,
  showAbandonWarning,
  setShowAbandonWarning,
  showCancelWarning,
  setShowCancelWarning,
  sellerName,
  handleCancelAlert,
}) {
  return (
    <>
      {showPaymentSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 mx-6 text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Pago liberado!</h2>
            <p className="text-green-100 mb-4">Estás a menos de 5 metros</p>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-white font-bold text-2xl">
                {alert?.price != null ? Number(alert.price).toFixed(2) : '0.00'}€
              </p>
              <p className="text-green-100 text-sm">Transacción completada</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showAbandonWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-6 max-w-sm text-center"
          >
            <p className="text-amber-400 font-bold text-lg">Estás abandonando el lugar...</p>
            <p className="text-gray-300 text-sm mt-2">
              Vuelve a menos de 5 m para completar la entrega.
            </p>
            <Button
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setShowAbandonWarning(false)}
            >
              Entendido
            </Button>
          </motion.div>
        </motion.div>
      )}

      {showCancelWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[150] bg-black/70"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[150] flex items-end"
          >
            <div className="w-full bg-gray-950 rounded-t-3xl shadow-2xl border-t border-gray-800 border-b-2 border-b-purple-500">
              <button
                onClick={() => setShowCancelWarning(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 pt-8 flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className="px-4 py-2 rounded-lg bg-red-700/40 border border-red-500/60">
                    <span className="text-white font-semibold text-sm">⚠️ ATENCIÓN</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-white font-bold text-base">La alerta está reservada.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {sellerName} está en camino. Si la cancelas, perderás la reserva.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button
                    onClick={() => setShowCancelWarning(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg h-9"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleCancelAlert}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-9"
                  >
                    Me voy
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
