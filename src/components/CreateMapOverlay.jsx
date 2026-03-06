/**
 * Overlay de la pantalla "Estoy aparcado aquí".
 * Usa refs + ResizeObserver para posicionar el pin exactamente entre
 * el borde inferior del buscador y el borde superior de la tarjeta.
 * El pin es UI fija; el mapa se mueve por debajo.
 */
import { useEffect, useRef, useState } from 'react';
import StreetSearch from '@/components/StreetSearch';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import CenterPin from '@/components/CenterPin';

export default function CreateMapOverlay({
  onStreetSelect,
  address,
  onAddressChange,
  onUseCurrentLocation,
  onRecenterTo,
  onCreateAlert,
  isLoading,
}) {
  const overlayRef = useRef(null);
  const searchRef = useRef(null);
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const search = searchRef.current;
    const card = cardRef.current;
    if (!overlay || !search || !card) return;

    const updatePinPosition = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const searchRect = search.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      const searchBottom = searchRect.bottom;
      const cardTop = cardRect.top;
      const midPointViewport = (searchBottom + cardTop) / 2;
      const PIN_HEIGHT = 54; // círculo 18px + línea 36px — la punta queda abajo
      const pinTopFromOverlay = midPointViewport - overlayRect.top - PIN_HEIGHT;

      setPinTop(pinTopFromOverlay);
    };

    updatePinPosition();

    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(overlay);
    ro.observe(search);
    ro.observe(card);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 top-[60px] pointer-events-none"
      style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)' }}
    >
      {/* Buscador — solo este div captura eventos */}
      <div
        ref={searchRef}
        className="absolute top-3 left-4 right-4 z-20 pointer-events-auto"
      >
        <StreetSearch
          onSelect={onStreetSelect}
          placeholder="Buscar calle para centrar mapa..."
        />
      </div>

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

      {/* Pin fijo — pointer-events-none para que el mapa reciba gestos */}
      {pinTop != null && <CenterPin top={pinTop} />}
    </div>
  );
}
