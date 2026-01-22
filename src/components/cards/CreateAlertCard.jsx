import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, Euro, Navigation } from 'lucide-react';

export default function CreateAlertCard({
  initialAddress = '',
  onPublish = () => {}
}) {
  const [address, setAddress] = useState(initialAddress);
  const [minutes, setMinutes] = useState(10);
  const [price, setPrice] = useState(3);

  const profit = useMemo(() => {
    // ejemplo: plataforma 20%
    const p = price * 0.8;
    return Math.max(0, p).toFixed(2);
  }, [price]);

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-2 border-2 border-purple-500 shadow-xl">
      <div className="space-y-2">
        {/* Dirección */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <MapPin className="w-5 h-5 text-purple-400" />
            <span className="text-sm">Calle</span>
          </div>

          <div className="bg-gray-900/60 border border-purple-500/30 rounded-xl px-3 py-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Escribe la dirección…"
              className="bg-transparent border-none text-gray-200 placeholder:text-gray-500 focus-visible:ring-0"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-purple-500/40 text-purple-200 hover:bg-purple-500/10"
            onClick={() => {
              // demo: no geolocalización real
              setAddress(initialAddress || 'Ubicación actual');
            }}
          >
            <Navigation className="w-4 h-4 mr-2 text-purple-300" />
            Ubicación actual
          </Button>
        </div>

        {/* Tiempo */}
        <div className="space-y-2 pt-2 border-t border-purple-500/20">
          <div className="flex items-center gap-2 text-white font-bold">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-sm">Me voy en: {minutes} min</span>
          </div>

          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Precio */}
        <div className="space-y-2 pt-2 border-t border-purple-500/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Euro className="w-5 h-5 text-purple-400" />
              <span className="text-sm">Precio: {price}€</span>
            </div>
            <div className="text-xs text-green-400 font-bold">
              (Ganarás {profit}€)
            </div>
          </div>

          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value, 10))}
            className="w-full accent-purple-500"
          />
        </div>

        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl font-extrabold"
          onClick={onPublish}
        >
          Publicar mi WaitMe!
        </Button>
      </div>
    </div>
  );
}