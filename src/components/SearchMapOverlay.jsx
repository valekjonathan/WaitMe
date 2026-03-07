/**
 * Overlay "¿Dónde quieres aparcar?" — browse (search + filtros) o arriving (distancia + ETA).
 * Pin fijo entre top y tarjeta. Misma geometría que CreateMapOverlay.
 */
import { useEffect, useRef, useState } from 'react';
import { Navigation, Clock } from 'lucide-react';
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
  navigateViewState = 'browse',
  arrivalMetrics = { distanceMeters: 0, etaMinutes: 0 },
}) {
  const overlayRef = useRef(null);
  const topRef = useRef(null);
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  const isArriving = navigateViewState === 'arriving';

  useEffect(() => {
    const overlay = overlayRef.current;
    const top = topRef.current;
    const card = cardRef.current;
    if (!overlay || !top || !card) return;

    const updatePinPosition = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const topRect = top.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const topBottom = topRect.bottom;
      const cardTop = cardRect.top;
      const midPoint = (topBottom + cardTop) / 2;
      const pinTopFromOverlay = midPoint - overlayRect.top - PIN_HEIGHT;
      setPinTop(Math.max(0, pinTopFromOverlay));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(overlay);
    ro.observe(top);
    ro.observe(card);
    return () => ro.disconnect();
  }, [isArriving]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 flex flex-col pointer-events-none z-10"
      style={{ overflow: 'hidden' }}
      aria-hidden="true"
    >
      {/* Filtros: solo en browse */}
      {!isArriving && (
        <div className="absolute top-3 right-3 z-[1000] pointer-events-auto">
          {filtersButton}
          {filtersContent}
        </div>
      )}

      {/* Top: search en browse, distancia+ETA en arriving — misma coordenada que create (pt para no solapar header) */}
      <div
        ref={topRef}
        className="px-4 pt-[calc(var(--header-h,69px)+8px)] pb-2 flex-shrink-0 pointer-events-auto"
      >
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

      {/* Área UserAlertCard — MapScreenPanel (misma geometría que Create: cardShiftUp=10, gap 20px) */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-end pointer-events-auto">
        <MapScreenPanel cardShiftUp={10}>
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
