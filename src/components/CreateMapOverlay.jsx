/**
 * Overlay "Estoy aparcado aquí" — tarjeta, pin y zoom.
 * Posición vertical: MapScreenPanel (fuente única de verdad).
 */
import { useEffect, useRef, useState } from 'react';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';
import MapScreenPanel from '@/system/map/MapScreenPanel';

const PIN_HEIGHT = 54;
const HEADER_BOTTOM = 69; // --header-h en globals.css
const MAP_TOP_VIEWPORT = 69; // overlay top = main pt = 69

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
      const headerEl = document.querySelector('[data-waitme-header]');
      const panelInner = document.querySelector('[data-map-screen-panel-inner]');
      const headerBottom = headerEl?.getBoundingClientRect()?.bottom ?? HEADER_BOTTOM;
      const cardRect = (panelInner ?? card)?.getBoundingClientRect?.();
      if (!cardRect) return;
      const midPoint = (headerBottom + cardRect.top) / 2;
      const pinTopViewport = midPoint - PIN_HEIGHT;
      const pinTopInOverlay = pinTopViewport - MAP_TOP_VIEWPORT;
      setPinTop(Math.max(0, pinTopInOverlay));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
      <div ref={cardRef} className="pointer-events-none">
        <MapScreenPanel>
          <CreateAlertCard
            address={address}
            onAddressChange={onAddressChange}
            onUseCurrentLocation={onUseCurrentLocation}
            onRecenter={onRecenter}
            mapRef={mapRef}
            useCurrentLocationLabel="Ubicación actual"
            onCreateAlert={onCreateAlert}
            isLoading={isLoading}
          />
        </MapScreenPanel>
      </div>

      {pinTop != null && (
        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: 0 }}>
          <CenterPin top={pinTop} />
        </div>
      )}

      <MapZoomControls mapRef={mapRef} className="left-[4%]" />
    </div>
  );
}
