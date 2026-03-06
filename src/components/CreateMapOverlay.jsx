/**
 * Overlay "Estoy aparcado aquí" — SIN buscador de calles.
 * Pin fijo entre top y tarjeta. Mapa arrastrable. Zoom controls.
 */
import { useEffect, useRef, useState } from 'react';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';

const PIN_HEIGHT = 54; // círculo 18px + línea 36px — punta abajo

export default function CreateMapOverlay({
  address,
  onAddressChange,
  onUseCurrentLocation,
  onRecenterTo,
  onCreateAlert,
  isLoading,
  mapRef,
}) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const card = cardRef.current;
    if (!overlay || !card) return;

    const updatePinPosition = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const midPoint = (overlayRect.top + cardRect.top) / 2;
      const pinTopFromOverlay = midPoint - overlayRect.top - PIN_HEIGHT;
      setPinTop(pinTopFromOverlay);
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(overlay);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 top-[60px] pointer-events-none"
      style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)' }}
    >
      {/* Tarjeta — solo este div captura eventos */}
      <div
        ref={cardRef}
        className="absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[460px] min-h-[200px] pointer-events-auto"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
      >
        <CreateAlertCard
          address={address}
          onAddressChange={onAddressChange}
          onUseCurrentLocation={onUseCurrentLocation}
          onRecenterTo={onRecenterTo}
          useCurrentLocationLabel="Ubicación actual"
          onCreateAlert={onCreateAlert}
          isLoading={isLoading}
        />
      </div>

      {/* Pin fijo — pointer-events-none */}
      {pinTop != null && <CenterPin top={pinTop} />}

      {/* Zoom controls — izquierda */}
      <MapZoomControls mapRef={mapRef} />
    </div>
  );
}
