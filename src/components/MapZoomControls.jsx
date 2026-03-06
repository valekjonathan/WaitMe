/**
 * Botones de zoom (+/-) para el mapa.
 * 10px debajo del menú superior; left alineado con borde izquierdo de la tarjeta (4%).
 * Estilo morado como botón reubicar.
 */
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

export default function MapZoomControls({ mapRef, className = '' }) {
  return (
    <div
      className={`absolute z-20 flex flex-col gap-1 pointer-events-auto ${className}`.trim()}
      style={{ top: 10, left: 'calc(4% + 1rem)' }}
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
