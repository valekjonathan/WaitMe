/**
 * Botones de zoom (+/-) para el mapa.
 * Arriba izquierda: 10px desde barra superior, 10px desde borde.
 * Estilo morado como botón reubicar.
 */
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

export default function MapZoomControls({ mapRef, className = '' }) {
  return (
    <div
      className={`absolute left-[10px] z-20 flex flex-col gap-1 pointer-events-auto ${className}`.trim()}
      style={{ top: 10 }}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
        onClick={() => mapRef?.current?.zoomIn?.()}
      >
        <Plus className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
        onClick={() => mapRef?.current?.zoomOut?.()}
      >
        <Minus className="w-5 h-5" />
      </Button>
    </div>
  );
}
