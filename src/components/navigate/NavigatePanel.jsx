/**
 * Panel inferior colapsable con UserAlertCard.
 */

import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAlertCard from '@/components/cards/UserAlertCard';
import { createPageUrl } from '@/utils';

export default function NavigatePanel({
  panelCollapsed,
  setPanelCollapsed,
  sellerName,
  sellerPhoto,
  alertForCard,
  isBrowseMode,
  isSeller,
  isBuyer,
  displayAlert,
  userLocation,
  isTracking,
  paymentReleased,
  alertId,
  startTracking,
  stopTracking,
  setShowCancelWarning,
  setForceRelease,
}) {
  return (
    <div className="fixed left-0 right-0 z-50" style={{ bottom: 'var(--bottom-nav-h)' }}>
      <div className="bg-gray-950 rounded-t-3xl shadow-2xl border-t border-gray-800">
        <button
          onClick={() => setPanelCollapsed((c) => !c)}
          className="w-full flex items-center justify-center py-2 focus:outline-none"
        >
          {panelCollapsed ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {panelCollapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 pb-3"
            >
              <div className="w-10 h-10 rounded-[6px] overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
                {sellerPhoto ? (
                  <img src={sellerPhoto} alt={sellerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-purple-400">
                    {sellerName.charAt(0)}
                  </div>
                )}
              </div>
              <p className="font-bold text-white">{sellerName}</p>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 pb-3"
            >
              {alertForCard && (
                <div className="relative">
                  {!isBrowseMode && isSeller && displayAlert?.status === 'reserved' && (
                    <button
                      onClick={() => setShowCancelWarning(true)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <UserAlertCard
                    alert={alertForCard}
                    hideBuy={true}
                    userLocation={userLocation}
                    showDistanceInMeters={true}
                    buyLabel={isSeller ? 'He desaparcado ✓' : !isTracking ? '▶ IR' : 'Detener'}
                    onBuyAlert={() => {
                      if (isSeller) {
                        window.location.href = createPageUrl('History');
                      } else if (!isTracking) {
                        startTracking();
                      } else {
                        stopTracking();
                      }
                    }}
                    onChat={() => {
                      window.location.href = createPageUrl(
                        `Chat?alertId=${alertId}&userId=${displayAlert?.user_email || displayAlert?.user_id}`
                      );
                    }}
                    onCall={() => {
                      const phone = isBuyer ? displayAlert?.phone : null;
                      if (phone) window.location.href = `tel:${phone}`;
                    }}
                  />
                  {isBrowseMode && (
                    <a
                      href={createPageUrl('/')}
                      className="block w-full mt-3 py-2.5 rounded-xl bg-purple-600/50 border border-purple-500/50 text-center text-sm font-semibold text-purple-200 hover:bg-purple-600/70 transition-colors"
                    >
                      Ir a Mapa para reservar
                    </a>
                  )}
                </div>
              )}
              {!isSeller &&
                displayAlert &&
                String(displayAlert.id).startsWith('demo_') &&
                !paymentReleased && (
                  <button
                    onClick={() => setForceRelease(true)}
                    className="w-full mt-2 h-7 rounded-xl border border-dashed border-amber-500/50 text-amber-400 text-xs hover:bg-amber-500/10 transition-colors"
                  >
                    Simular llegada (demo)
                  </button>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
