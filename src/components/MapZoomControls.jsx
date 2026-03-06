/**
 * Botones de zoom (+/-) para el mapa.
 * Mobile-first, posición fija a la izquierda.
 */
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

export default function MapZoomControls({ mapRef, className = '' }) {
  return (
    <div
      className={`absolute left-3 z-20 flex flex-col gap-1 pointer-events-auto ${className}`.trim()}
      style={{ top: '50%', transform: 'translateY(-50%)' }}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600/50"
        onClick={() => mapRef?.current?.zoomIn?.()}
      >
        <Plus className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg bg-black/60 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-purple-600/50"
        onClick={() => mapRef?.current?.zoomOut?.()}
      >
        <Minus className="w-5 h-5" />
      </Button>
    </div>
  );
}
