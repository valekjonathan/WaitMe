import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ParkingMap from '@/components/map/ParkingMap';

// Panel inferior que sube desde abajo y se queda justo encima del BottomNav.
// No toca tu UI existente: es un overlay independiente.

const NAV_HEIGHT_PX = 76; // altura aproximada del BottomNav (sin romper nada)

export default function NavBottomSheet({
  open,
  onClose,
  userLocation,
  sellerLocation,
  userCard
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2147483645] bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: 800 }}
            animate={{ y: 0 }}
            exit={{ y: 800 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed left-0 right-0 z-[2147483646]"
            style={{
              bottom: NAV_HEIGHT_PX,
              height: `calc(100dvh - ${NAV_HEIGHT_PX}px - env(safe-area-inset-top))`
            }}
          >
            <div className="relative w-full h-full bg-black border-t border-purple-500/30 rounded-t-3xl overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.7)]">
              {/* Top handle + close */}
              <div className="absolute top-0 left-0 right-0 z-[1002]">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto" />
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-3 w-9 h-9 rounded-xl bg-black/60 border border-purple-500/25 flex items-center justify-center"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Map */}
              <div className="absolute inset-0">
                <ParkingMap
                  alerts={[]}
                  userLocation={userLocation}
                  sellerLocation={sellerLocation}
                  selectedAlert={sellerLocation ? { latitude: sellerLocation[0], longitude: sellerLocation[1] } : null}
                  showRoute={!!sellerLocation}
                  zoomControl={true}
                  className="h-full"
                />
              </div>

              {/* Bottom user card (pegada abajo) */}
              {userCard && (
                <div
                  className="absolute left-0 right-0 z-[1002] px-4"
                  style={{ bottom: `calc(env(safe-area-inset-bottom) + 12px)` }}
                >
                  {userCard}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
