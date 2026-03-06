/**
 * Overlay "¿Dónde quieres aparcar?" — CON StreetSearch arriba.
 * Pin fijo entre buscador y tarjeta. Mapa arrastrable. Zoom controls.
 */
import { useEffect, useRef, useState } from 'react';
import StreetSearch from '@/components/StreetSearch';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';

const PIN_HEIGHT = 54;

export default function SearchMapOverlay({
  onStreetSelect,
  mapRef,
  filtersButton,
  filtersContent,
  alertCard,
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
      const midPoint = (searchBottom + cardTop) / 2;
      const pinTopFromOverlay = midPoint - overlayRect.top - PIN_HEIGHT;
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
      className="fixed inset-0 top-[60px] flex flex-col pointer-events-none"
      style={{ overflow: 'hidden', height: 'calc(100dvh - 60px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      {/* Botón filtros */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-auto">
        {filtersButton}
        {filtersContent}
      </div>

      {/* StreetSearch */}
      <div
        ref={searchRef}
        className="px-4 pt-3 pb-2 flex-shrink-0 pointer-events-auto"
      >
        <StreetSearch
          onSelect={onStreetSelect}
          placeholder="Buscar calle o dirección..."
        />
      </div>

      {/* Área UserAlertCard */}
      <div
        ref={cardRef}
        className="flex-1 px-4 pt-2 pb-3 min-h-0 overflow-hidden flex items-start pointer-events-auto"
      >
        <div className="w-full h-full">{alertCard}</div>
      </div>

      {/* Pin fijo */}
      {pinTop != null && <CenterPin top={pinTop} />}

      {/* Zoom controls */}
      <MapZoomControls mapRef={mapRef} />
    </div>
  );
}
