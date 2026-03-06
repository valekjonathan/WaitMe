/**
 * Botones de zoom (+/-) para el mapa.
 * Usa mapRef.current (instancia visible real). Fallback a easeTo si zoomIn/zoomOut no existen.
 */
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

function zoomIn(map) {
  if (!map) return;
  if (typeof map.zoomIn === 'function') {
    map.zoomIn();
  } else if (typeof map.easeTo === 'function' && typeof map.getZoom === 'function') {
    map.easeTo({ zoom: map.getZoom() + 1 });
  }
}

function zoomOut(map) {
  if (!map) return;
  if (typeof map.zoomOut === 'function') {
    map.zoomOut();
  } else if (typeof map.easeTo === 'function' && typeof map.getZoom === 'function') {
    map.easeTo({ zoom: map.getZoom() - 1 });
  }
}

export default function MapZoomControls({ mapRef, className = '' }) {
  return (
    <div
      className={`absolute z-20 flex flex-col gap-1 pointer-events-auto ${className}`.trim()}
      style={{ top: 70 }}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
        onClick={() => zoomIn(mapRef?.current)}
      >
        <Plus className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
        onClick={() => zoomOut(mapRef?.current)}
      >
        <Minus className="w-5 h-5" />
      </Button>
    </div>
  );
}
