import { useState } from 'react';
import { MapPin, Clock, Euro, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function CreateAlertCard({
  address,
  onAddressChange,
  onUseCurrentLocation,
  onRecenter,
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
      className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-purple-500/70 shadow-xl flex flex-col"
      style={{
        boxShadow:
          '0 0 30px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.15)',
      }}
    >
      <div className="flex flex-col justify-between flex-1 min-h-0 gap-y-6">
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
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70 flex items-center justify-center"
            onClick={() => {
              onUseCurrentLocation?.((coords) => onRecenter?.(coords));
            }}
            type="button"
          >
            <LocateFixed className="w-5 h-5" />
          </Button>
        </div>

        {/* Tiempo */}
        <div className="flex items-center gap-2">
          <Clock className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[4px]" />

          <div className="flex-1 space-y-0.5 mt-2">
            <Label className="text-white text-xs font-medium">
              Me voy en:
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-2">
                {minutes} minutos
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

        {/* Precio */}
        <div className="flex items-center gap-2">
          <Euro className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[4px]" />

          <div className="flex-1 space-y-0.5 mt-2">
            <Label className="text-white text-xs font-medium">
              Precio:
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-[42px]">
                {price} euros
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

        {/* Botón publicar — self-center evita stretch del padre flex */}
        <Button
          className="inline-flex px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8 text-sm self-center w-fit"
          onClick={handleCreate}
          disabled={isLoading || !address}
        >
          {isLoading ? 'Publicando...' : 'Publicar mi WaitMe!'}
        </Button>
      </div>
    </div>
  );
}