import React, { useState } from 'react';
import { MapPin, Clock, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

function SimplePinDotIcon() {
  return (
    <span className="relative w-[12px] h-[16px] inline-block">
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[8px] bg-white rounded-full"
        aria-hidden="true"
      />
      <span
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-red-500 rounded-full"
        aria-hidden="true"
      />
    </span>
  );
}

export default function CreateAlertCard({
  onPublish,
  initialAddress = 'Calle Campoamor, 13',
  initialMinutes = 10,
  initialPrice = 3,
  showTitle = true,
}) {
  const [address, setAddress] = useState(initialAddress);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [price, setPrice] = useState(initialPrice);

  const handlePublish = () => {
    onPublish?.({ address, minutes, price });
  };

  return (
    <div className="w-full max-w-[370px] mx-auto rounded-2xl border border-purple-500/50 bg-black/55 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)] p-3">
      {showTitle && (
        <div className="mb-2">
          <div className="text-center text-white text-sm font-semibold">
            ¿Dónde estas aparcado ?
          </div>
          <div className="mt-2 h-[2px] w-full bg-purple-500/50 rounded-full" />
        </div>
      )}

      {/* Dirección + Ubícate */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <AddressAutocompleteInput
            value={address}
            onChange={setAddress}
            placeholder="Calle..."
            className="h-10 rounded-xl bg-[#0f1220] border border-white/10 text-white placeholder:text-white/50"
          />
        </div>

        {/* Botón Ubícate (ancho +10px, icono blanco y algo más pequeño verticalmente) */}
        <Button
          type="button"
          variant="secondary"
          className="h-10 px-4 rounded-xl bg-[#0f1220] border border-white/10 text-white hover:bg-[#141a2e] gap-2"
        >
          <span className="inline-flex items-center justify-center">
            <SimplePinDotIcon />
          </span>
          <span className="text-base font-semibold">Ubicate</span>
        </Button>
      </div>

      {/* Tiempo */}
      <div className="flex items-center gap-2 mb-2">
        {/* Reloj bajado 1px (ya está con translate-y) */}
        <Clock className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[3px]" />

        <div className="flex-1">
          <div className="space-y-0.5">
            <Label className="text-white text-xs font-medium">
              Me voy en:
              {/* NO mover a la derecha: vuelve a ml-2 */}
              <span className="text-purple-400 font-bold text-[22px] leading-none ml-2 relative -top-[3px]">
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
      </div>

      {/* Precio */}
      <div className="flex items-center gap-2">
        {/* € bajado 1px (ya está con translate-y) */}
        <Euro className="w-[22px] h-[22px] text-purple-400 flex-shrink-0 self-center translate-y-[3px]" />

        <div className="flex-1 space-y-0.5">
          <Label className="text-white text-xs font-medium">
            Precio:
            {/* 3€ más a la derecha y a la misma altura visual que el 10 (sin mover 10 minutos) */}
            <span className="text-purple-400 font-bold text-[22px] leading-none ml-6 relative -top-[3px]">
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

      <div className="mt-3">
        <Button
          onClick={handlePublish}
          className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          Publicar mi WaitMe!
        </Button>
      </div>
    </div>
  );
}