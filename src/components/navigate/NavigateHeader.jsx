/**
 * Cabecera flotante con distancia y ETA (solo cuando navegando a alerta).
 */

import { Navigation, Clock } from 'lucide-react';

export default function NavigateHeader({ distLabel, etaMinutes }) {
  return (
    <div className="fixed left-0 right-0 z-40 px-4 flex gap-2" style={{ top: 'calc(56px + 15px)' }}>
      <div className="flex-1 bg-gray-900/50 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl border border-gray-700/30">
        <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div>
          <p className="text-white font-black text-base leading-none">{distLabel}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">Distancia</p>
        </div>
      </div>
      <div className="flex-1 bg-gray-900/50 backdrop-blur-md rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xl border border-gray-700/30">
        <Clock className="w-4 h-4 text-green-400 flex-shrink-0" />
        <div>
          <p className="text-white font-black text-base leading-none">
            {etaMinutes != null ? `${etaMinutes} min` : '--'}
          </p>
          <p className="text-gray-400 text-[10px] mt-0.5">Tiempo estimado</p>
        </div>
      </div>
    </div>
  );
}
