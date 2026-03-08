/**
 * Botón "Ir" para abrir Google Maps con la dirección del parking.
 */

import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

export default function HistoryBuyerActions({ address, formatAddress }) {
  const dest = encodeURIComponent(formatAddress?.(address) || 'Calle Campoamor, n15, Oviedo');

  return (
    <div className="border-t border-gray-700/80 mt-2 pt-2">
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2"
        onClick={() => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
        }}
      >
        Ir
        <Navigation className="w-5 h-5" />
      </Button>
    </div>
  );
}
