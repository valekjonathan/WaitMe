/**
 * Overlay "¿Dónde quieres aparcar?" — SIN wrapper fullscreen.
 * StreetSearch arriba, UserAlertCard abajo, pin y zoom. Zona libre → canvas recibe gestos.
 */
import { useEffect, useRef, useState } from 'react';
import StreetSearch from '@/components/StreetSearch';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';

const PIN_HEIGHT = 54;
const MAP_TOP_VIEWPORT = 69;

export default function SearchMapOverlay({
  onStreetSelect,
  mapRef,
  filtersButton,
  filtersContent,
  alertCard,
}) {
  const searchRef = useRef(null);
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  useEffect(() => {
    const search = searchRef.current;
    const card = cardRef.current;
    if (!search || !card) return;

    const updatePinPosition = () => {
      const searchRect = search.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const midPoint = (searchRect.bottom + cardRect.top) / 2;
      const pinTopViewport = midPoint - PIN_HEIGHT;
      const pinTopInMap = pinTopViewport - MAP_TOP_VIEWPORT;
      setPinTop(Math.max(0, pinTopInMap));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(search);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {/* Botón filtros — fixed top right */}
      <div className="fixed top-[72px] right-3 z-[1000] pointer-events-auto">
        {filtersButton}
        {filtersContent}
      </div>

      {/* StreetSearch — fixed top */}
      <div
        ref={searchRef}
        className="fixed left-0 right-0 top-[60px] z-20 px-4 pt-3 pb-2 pointer-events-auto"
      >
        <StreetSearch
          onSelect={onStreetSelect}
          placeholder="Buscar calle o dirección..."
        />
      </div>

      {/* UserAlertCard — fixed bottom */}
      <div
        ref={cardRef}
        className="fixed left-0 right-0 bottom-0 z-20 px-4 pt-2 pb-3 pointer-events-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        <div className="w-full max-w-md mx-auto">{alertCard}</div>
      </div>

      {/* Pin — absolute en MapboxMap, pointer-events-none */}
      {pinTop != null && (
        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: 0 }}>
          <CenterPin top={pinTop} />
        </div>
      )}

      {/* Zoom controls */}
      <MapZoomControls mapRef={mapRef} />
    </>
  );
}
