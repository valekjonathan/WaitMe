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
  const isCreate = mode === 'create';
  const isHome = !mode || mode === 'home';
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: isCreate ? undefined : '100dvh',
        height: isCreate ? 'calc(100dvh - var(--header-h, 69px) - 7px)' : '100%',
      }}
      data-map-viewport-shell
      data-map-mode={mode}
    >
      <MapLayer>{mapNode}</MapLayer>

      <OverlayLayer>{panel}</OverlayLayer>

      {/* Capa tenue en Home: apaga el mapa para foco en logo y botones */}
      {isHome && (
        <div
          className="absolute inset-0 z-[15] pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          aria-hidden="true"
        />
      )}

      {children}
    </div>
  );
}
