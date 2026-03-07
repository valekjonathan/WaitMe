/**
 * Overlay "¿Dónde quieres aparcar?" — misma estructura que CreateMapOverlay.
 * Buscador/filtros en contenedor absolute independiente (no empuja layout).
 */
import { useEffect, useRef, useState } from 'react';
import { Navigation, Clock } from 'lucide-react';
import StreetSearch from '@/components/StreetSearch';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';
import MapScreenPanel from '@/system/map/MapScreenPanel';

const PIN_HEIGHT = 54;
const HEADER_BOTTOM = 69;

export default function SearchMapOverlay({
  onStreetSelect,
  mapRef,
  filtersButton,
  filtersContent,
  alertCard,
  navigateViewState = 'browse',
  arrivalMetrics = { distanceMeters: 0, etaMinutes: 0 },
}) {
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  const isArriving = navigateViewState === 'arriving';

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
      const pinTopInOverlay = pinTopViewport - HEADER_BOTTOM;
      setPinTop(Math.max(0, pinTopInOverlay));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(card);
    return () => ro.disconnect();
  }, [isArriving]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
      {/* Buscador/filtros: absolute, debajo del header, no afecta MapScreenPanel */}
      <div
        className="absolute top-0 left-0 right-0 px-4 pt-[calc(var(--header-h,69px)+8px)] pb-2 flex items-start gap-2 pointer-events-auto z-[1000]"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex-1 min-w-0">
          {isArriving ? (
            <div className="flex gap-3">
              <div className="flex-1 bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-white font-bold text-sm">
                  {arrivalMetrics.distanceMeters} m
                </span>
              </div>
              <div className="flex-1 bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-white font-bold text-sm">
                  {arrivalMetrics.etaMinutes > 0 ? `${arrivalMetrics.etaMinutes} min` : 'Llegando'}
                </span>
              </div>
            </div>
          ) : (
            <StreetSearch onSelect={onStreetSelect} placeholder="Buscar calle o dirección..." />
          )}
        </div>
        {!isArriving && (
          <div className="flex-shrink-0">
            {filtersButton}
            {filtersContent}
          </div>
        )}
      </div>

      {/* Misma estructura que CreateMapOverlay: MapScreenPanel sin offsets */}
      <div ref={cardRef} className="pointer-events-none">
        <MapScreenPanel overflowHidden measureLabel="navigate">
          <div className="pointer-events-auto">{alertCard}</div>
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
