/**
 * Overlay "Estoy aparcado aquí" — SIN wrapper fullscreen.
 * Solo tarjeta, pin y zoom. La zona libre queda sin elementos → canvas recibe gestos.
 */
import { useEffect, useRef, useState } from 'react';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';

const PIN_HEIGHT = 54;
const HEADER_BOTTOM = 60;
/** MapboxMap container top from viewport (Layout main pt-[69px]) */
const MAP_TOP_VIEWPORT = 69;

export default function CreateMapOverlay({
  address,
  onAddressChange,
  onUseCurrentLocation,
  onRecenter,
  onCreateAlert,
  isLoading,
  mapRef,
}) {
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updatePinPosition = () => {
      const cardRect = card.getBoundingClientRect();
      const midPoint = (HEADER_BOTTOM + cardRect.top) / 2;
      const pinTopViewport = midPoint - PIN_HEIGHT;
      const pinTopInMap = pinTopViewport - MAP_TOP_VIEWPORT;
      setPinTop(Math.max(0, pinTopInMap));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {/* Tarjeta — único elemento que captura en su área */}
      <div
        ref={cardRef}
        className="absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[460px] min-h-[200px] z-20 pointer-events-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
      >
        <CreateAlertCard
          address={address}
          onAddressChange={onAddressChange}
          onUseCurrentLocation={onUseCurrentLocation}
          onRecenter={onRecenter}
          useCurrentLocationLabel="Ubicación actual"
          onCreateAlert={onCreateAlert}
          isLoading={isLoading}
        />
      </div>

      {/* Pin — pointer-events-none para que pase al canvas */}
      {pinTop != null && (
        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: 0 }}>
          <CenterPin top={pinTop} />
        </div>
      )}

      {/* Zoom — alineado con borde izquierdo de tarjeta */}
      <MapZoomControls mapRef={mapRef} />
    </>
  );
}
