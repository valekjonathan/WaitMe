import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';

/**
 * Overlay global: aparece en TODAS las pantallas (se monta en App.jsx).
 * Se abre/cierra con eventos window:
 * - waitme:navigationOpen
 * - waitme:navigationClose
 * - waitme:navigationSetTarget (detail: { alert })
 *
 * NOTA: No rompe nada existente: es un overlay fixed por encima.
 */

const NAV_HEIGHT_PX = 60; // altura base del BottomNav
const TOP_BAR_OFFSET_PX = 72; // bajo el header + raya (aprox)

export default function NavigationOverlay() {
  const [open, setOpen] = useState(false);
  const [targetAlert, setTargetAlert] = useState(null);

  const close = useCallback(() => setOpen(false), []);
  const openSheet = useCallback(() => setOpen(true), []);

  // Carga objetivo desde localStorage (para persistir entre pantallas)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('waitme:navTarget');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.alert) setTargetAlert(parsed.alert);
      }
    } catch {}
  }, []);

  // Eventos globales
  useEffect(() => {
    const onOpen = () => openSheet();
    const onClose = () => close();
    const onSetTarget = (e) => {
      const alert = e?.detail?.alert || null;
      setTargetAlert(alert);
      try {
        localStorage.setItem('waitme:navTarget', JSON.stringify({ alert }));
      } catch {}
    };

    window.addEventListener('waitme:navigationOpen', onOpen);
    window.addEventListener('waitme:navigationClose', onClose);
    window.addEventListener('waitme:navigationSetTarget', onSetTarget);
    return () => {
      window.removeEventListener('waitme:navigationOpen', onOpen);
      window.removeEventListener('waitme:navigationClose', onClose);
      window.removeEventListener('waitme:navigationSetTarget', onSetTarget);
    };
  }, [openSheet, close]);

  const userLocation = useMemo(() => {
    // ParkingMap acepta userLocation como array u objeto; aquí dejamos null
    // porque ya lo resuelve internamente (geoloc en otras pantallas).
    return null;
  }, []);

  const sellerLocation = useMemo(() => {
    const lat = Number(targetAlert?.latitude);
    const lng = Number(targetAlert?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }, [targetAlert]);

  const show = open && !!sellerLocation;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2147483645] bg-black/40 backdrop-blur-[2px]"
            onClick={close}
          />

          {/* Panel mapa: fijo, desde debajo del menú superior hasta encima del BottomNav */}
          <motion.div
            initial={{ y: 800 }}
            animate={{ y: 0 }}
            exit={{ y: 800 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed left-0 right-0 z-[2147483646]"
            style={{
              top: TOP_BAR_OFFSET_PX,
              bottom: NAV_HEIGHT_PX,
            }}
          >
            <div className="relative w-full h-full bg-black border-t border-purple-500/20 overflow-hidden">
              {/* Cerrar */}
              <button
                type="button"
                onClick={close}
                className="absolute top-3 right-3 z-[1005] w-10 h-10 rounded-xl bg-black/60 border border-purple-500/25 flex items-center justify-center"
                aria-label="Cerrar navegación"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Mapa */}
              <div className="absolute inset-0">
                <ParkingMap
                  alerts={[]}
                  userLocation={userLocation}
                  sellerLocation={sellerLocation}
                  selectedAlert={sellerLocation ? { ...targetAlert, latitude: sellerLocation[0], longitude: sellerLocation[1] } : null}
                  showRoute={true}
                  showRouteInfoOverlay={true}
                  sellerMarkerVariant="car"
                  sellerCarColor={targetAlert?.car_color}
                  zoomControl={true}
                  className="w-full h-full"
                />
              </div>

              {/* Tarjeta incrustada encima del menú inferior */}
              <div
                className="absolute left-0 right-0 z-[1006] px-3"
                style={{ bottom: 8 }}
              >
                <div className="pointer-events-auto">
                  <div className="bg-black/50 backdrop-blur border border-purple-500/20 rounded-2xl overflow-hidden">
                    <UserAlertCard
                      alert={targetAlert}
                      userLocation={userLocation}
                      hideBuy={true}
                      buyLabel="WaitMe!"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
