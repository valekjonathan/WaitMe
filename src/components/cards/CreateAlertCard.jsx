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
  isLoading = false 
}) {
  const [price, setPrice] = useState(3);
  const [minutes, setMinutes] = useState(10);

  const handleCreate = () => {
    onCreateAlert({ price, minutes });
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-800 shadow-xl">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-purple-500" />
        ¿Dónde estás aparcado?
      </h3>

      {/* Dirección */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Calle, número..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
          <Button
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-500/20 whitespace-nowrap"
            onClick={onUseCurrentLocation}
          >
            <Navigation className="w-4 h-4 mr-1" />
            Ubicación actual
          </Button>
        </div>

        {/* Tiempo */}
        <div className="space-y-2">
          <Label className="text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Me voy en: <span className="text-purple-400 font-bold">{minutes} minutos</span>
          </Label>
          <Slider
            value={[minutes]}
            onValueChange={(v) => setMinutes(v[0])}
            min={5}
            max={60}
            step={5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5 min</span>
            <span>30 min</span>
            <span>60 min</span>
          </div>
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <Label className="text-gray-400 flex items-center gap-2">
            <Euro className="w-4 h-4" />
            Precio: <span className="text-purple-400 font-bold">{price}€</span>
          </Label>
          <Slider
            value={[price]}
            onValueChange={(v) => setPrice(v[0])}
            min={1}
            max={15}
            step={0.5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1€</span>
            <span>Hora punta</span>
            <span>Evento especial</span>
          </div>
        </div>

        {/* Info de ganancias */}
        <div className="bg-gray-800/50 rounded-lg p-3 mt-4">
          <p className="text-gray-400 text-sm">
            Ganarás <span className="text-green-400 font-bold">{(price * 0.8).toFixed(2)}€</span> 
            <span className="text-gray-500 text-xs ml-1">(WaitMe! se lleva 20%)</span>
          </p>
        </div>
      </div>

      <Button
        className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6"
        onClick={handleCreate}
        disabled={isLoading || !address}
      >
        {isLoading ? 'Creando alerta...' : 'Publicar mi plaza'}
      </Button>
    </div>
  );
}