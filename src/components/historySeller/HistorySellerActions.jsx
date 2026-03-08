/**
 * Botones de acción para thinking: Aceptar, Me lo pienso, Rechazar.
 */

import { Button } from '@/components/ui/button';

export default function HistorySellerActions({ onAccept, onDismiss, onReject }) {
  return (
    <div className="px-3 pb-4 grid grid-cols-3 gap-2">
      <Button className="bg-purple-600 hover:bg-purple-700 font-semibold" onClick={onAccept}>
        Aceptar
      </Button>
      <Button
        variant="outline"
        className="border-gray-600 text-white font-semibold"
        onClick={onDismiss}
      >
        Me lo pienso
      </Button>
      <Button className="bg-red-600/80 hover:bg-red-700 font-semibold" onClick={onReject}>
        Rechazar
      </Button>
    </div>
  );
}
