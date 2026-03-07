/**
 * Overlay "¿Dónde quieres aparcar?" — CON StreetSearch arriba.
 * Pin fijo entre buscador y tarjeta. Mapa arrastrable. Zoom controls.
 *
 * Usa MapScreenPanel (fuente única de verdad) para la tarjeta UserAlertCard.
 * Misma geometría que CreateMapOverlay para consistencia web/iOS.
 */
import { useEffect, useRef, useState } from 'react';
import StreetSearch from '@/components/StreetSearch';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';
import MapScreenPanel from '@/system/map/MapScreenPanel';

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
      setPinTop(Math.max(0, pinTopFromOverlay));
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
      className="absolute left-0 right-0 bottom-0 top-[var(--header-h,69px)] flex flex-col pointer-events-none z-10"
      style={{ overflow: 'hidden' }}
      aria-hidden="true"
    >
      {/* Botón filtros */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-auto">
        {filtersButton}
        {filtersContent}
      </div>

      {/* StreetSearch */}
      <div ref={searchRef} className="px-4 pt-3 pb-2 flex-shrink-0 pointer-events-auto">
        <StreetSearch onSelect={onStreetSelect} placeholder="Buscar calle o dirección..." />
      </div>

      {/* Área UserAlertCard — MapScreenPanel (misma geometría que Create) */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-end pointer-events-auto">
        <MapScreenPanel>
          <div ref={cardRef}>{alertCard}</div>
        </MapScreenPanel>
      </div>

      {/* Pin fijo */}
      {pinTop != null && <CenterPin top={pinTop} />}

      {/* Zoom controls — misma posición que CreateMapOverlay (left-[4%]) */}
      <MapZoomControls mapRef={mapRef} className="left-[4%]" />
    </div>
  );
}
