
import React from "react";
import { MapPin, Clock, Euro } from "lucide-react";

export default function CreateAlertCard({
  address,
  onAddressChange,
  onUseCurrentLocation,
  useCurrentLocationLabel,
  onCreateAlert,
  isLoading
}) {
  return (
    <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-2xl p-4 h-full flex flex-col justify-between">

      <div className="space-y-4">

        {/* Dirección */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-purple-400" />
          <input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="bg-transparent text-white w-full outline-none text-sm"
          />
        </div>

        {/* Tiempo */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white">Me voy en:</span>
        </div>

        {/* Precio */}
        <div className="flex items-center gap-2">
          <Euro className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white">Precio:</span>
        </div>

      </div>

      <button
        disabled={isLoading}
        onClick={() => onCreateAlert({ price: 3, minutes: 10 })}
        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2 text-sm font-semibold"
      >
        Publicar mi WaitMe!
      </button>
    </div>
  );
}
