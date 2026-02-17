import React, { useState } from 'react';
import { MapPin, Clock, Euro, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function CreateAlertCard({
  address,
  onAddressChange,
  onUseCurrentLocation,
  onCreateAlert,
  isLoading = false,
  useCurrentLocationLabel = "Ubicación actual"
}) {
  const [price, setPrice] = useState(3);
  const [minutes, setMinutes] = useState(10);

  const handleCreate = () => {
    onCreateAlert({ price, minutes });
  };

  return (
    <div
      className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-2 border-2 border-purple-500 shadow-xl h-full flex flex-col min-h-0"
      style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.2)' }}
    >
      <div className="flex flex-col justify-center gap-3 flex-1 min-h-0">
        {/* Dirección (BAJADA 5px junto con su icono) */}
        <div className="flex items-center gap-2 relative top-[5px]">
          <MapPin className="w-[22px] h-[22px] text-purple-400 flex-shrink-0" />
          <Input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Calle, número..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[22px] flex-shrink-0"></div>
          <Button
            className="flex-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-white h-7 text-[11px] font-semibold"
            onClick={onUseCurrentLocation}
          >
            <Navigation className="w-3 h-3 mr-1" />
            {useCurrentLocationLabel}
          </Button>
        </div>

        <div className="space-y-0.5">
          <Label className="text-white flex items-center gap-2 text-xs font-medium">
            <Clock className="w-[22px] h-[22px] text-purple-400" />
            Me voy en:
            <span className="text-purple-400 font-bold text-[22px] leading-none">
              {minutes} minutos.
            </span>
          </Label>
          <Slider
            value={[minutes]}
            onValueChange={(v) => setMinutes(v[0])}
            min={5}
            max={60}
            step={5}
            className="py-0.5 [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
          />
        </div>

        <div className="space-y-0.5">
          <Label className="text-white flex items-center gap-2 text-xs font-medium">
            <Euro className="w-[22px] h-[22px] text-purple-400" />
            Precio:
            <span className="text-purple-400 font-bold text-[22px] leading-none">
              {price} €
            </span>
            <span className="text-green-400 text-[10px] ml-2 font-semibold">
              (Ganarás {(price * 0.8).toFixed(2)} €)
            </span>
          </Label>
          <Slider
            value={[price]}
            onValueChange={(v) => setPrice(v[0])}
            min={3}
            max={15}
            step={1}
            className="py-0.5 [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
          />
        </div>
      </div>

      <Button
        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8 text-sm"
        onClick={handleCreate}
        disabled={isLoading || !address}
      >
        {isLoading ? 'Publicando...' : 'Publicar mi WaitMe!'}
      </Button>
    </div>
  );
}
