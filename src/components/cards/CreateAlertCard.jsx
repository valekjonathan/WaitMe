import React, { useState } from 'react';
import { MapPin, Clock, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

function SimplePinDotIcon() {
  return (
    <span className="relative w-[12px] h-[18px] inline-block">
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[12px] rounded-full"
        style={{ background: '#ef4444' }}
      />
      <span
        className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full"
        style={{ background: '#ef4444' }}
      />
    </span>
  );
}

export default function CreateAlertCard({
  address,
  onAddressChange,
  onUseCurrentLocation,
  onCreateAlert,
  isLoading = false,
}) {
  const [price, setPrice] = useState(3);
  const [minutes, setMinutes] = useState(10);

  const handleCreate = () => {
    onCreateAlert({ price, minutes });
  };

  return (
    <div
      className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-2 border-2 border-purple-500 shadow-xl h-full flex flex-col min-h-0"
      style={{
        boxShadow:
          '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.2)',
      }}
    >
      <div className="flex flex-col justify-between flex-1 min-h-0">

        {/* Ubicación */}
        <div className="flex items-center gap-2">
          <MapPin className="w-[22px] h-[22px] text-purple-400 flex-shrink-0" />

          <AddressAutocompleteInput
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="C/ Campoamor, 13"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1 h-8 text-xs"
            idPrefix="waitme-address"
          />

          <Button
            className="h-8 px-1 text-[11px] font-semibold whitespace-nowrap border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/50 flex items-center justify-center gap-1"
            onClick={onUseCurrentLocation}
            type="button"
          >
            <SimplePinDotIcon />
            <span className="leading-none">Ubicate</span>
          </Button>
        </div>

        {/* Tiempo - icono alineado verticalmente con texto + slider */}
        <div className="flex items-center gap-2">
          <Clock className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[2px]" />

          <div className="flex-1 space-y-0.5">
            <Label className="text-white text-xs font-medium">
              Me voy en:
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-2">
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
        </div>

        {/* Precio - icono alineado verticalmente con texto + slider */}
        <div className="flex items-center gap-2">
          <Euro className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[2px]" />

          <div className="flex-1 space-y-0.5">
            <Label className="text-white text-xs font-medium">
              Precio:
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-2">
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
              max={20}
              step={1}
              className="py-0.5 [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
            />
          </div>
        </div>

        {/* Botón publicar */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8 text-sm"
          onClick={handleCreate}
          disabled={isLoading || !address}
        >
          {isLoading ? 'Publicando...' : 'Publicar mi WaitMe!'}
        </Button>
      </div>
    </div>
  );
}
