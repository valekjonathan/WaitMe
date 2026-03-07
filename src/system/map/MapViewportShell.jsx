/**
 * MapViewportShell — Fuente única de verdad para el mapa en Home.
 *
 * Responsabilidades:
 * - Alto real de pantalla (100dvh)
 * - Safe area top/bottom (via CSS vars)
 * - Posición del mapa (MapLayer)
 * - Posición base de overlays (OverlayLayer)
 * - Relación con bottom nav (--bottom-nav-h)
 *
 * Usado por:
 * - "Dónde quieres aparcar" (SearchMapOverlay + UserAlertCard)
 * - "Estoy aparcado aquí" (CreateMapOverlay + CreateAlertCard)
 *
 * Ambos flujos montan SOBRE el mismo mapa base con la misma geometría.
 */
import MapLayer from '@/system/layout/MapLayer';
import OverlayLayer from '@/system/layout/OverlayLayer';

export default function MapViewportShell({ mode = 'home', panel, children, mapNode }) {
  const isHome = !mode || mode === 'home';
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '100dvh',
        height: '100%',
      }}
      data-map-viewport-shell
      data-map-mode={mode}
    >
      <MapLayer>
        {mapNode}
        {/* Capa amoratada solo sobre el mapa (Home): no afecta logo, header ni nav */}
        {isHome && (
          <div
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{ background: 'rgba(91, 39, 122, 0.22)' }}
            aria-hidden="true"
          />
        )}
      </MapLayer>

      <OverlayLayer>{panel}</OverlayLayer>

      {children}
    </div>
  );
}
