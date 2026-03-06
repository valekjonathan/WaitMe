/**
 * Shell unificado para pantallas con mapa.
 * Estructura: MapLayer + OverlayLayer.
 * BottomNav permanece en Layout (global).
 */
import MapLayer from '@/system/layout/MapLayer';
import OverlayLayer from '@/system/layout/OverlayLayer';

export default function MapScreenShell({ mode = 'home', panel, children, mapNode }) {
  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden">
      <MapLayer>{mapNode}</MapLayer>

      <OverlayLayer>
        {panel}
      </OverlayLayer>

      {children}
    </div>
  );
}
