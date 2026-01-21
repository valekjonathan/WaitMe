import React from 'react';
import { Car } from 'lucide-react';

export function ActiveAlertCard() {
  return (
    <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="bg-purple-600 p-2 rounded-lg">
          <Car className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Tu alerta está activa</h3>
          <p className="text-purple-300 text-xs">Esperando a que dejes el sitio...</p>
        </div>
      </div>
    </div>
  );
}