import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X, SlidersHorizontal, Clock, Euro, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MapFilters({ filters, onFilterChange, onClose, alertsCount }) {
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="absolute top-4 left-4 z-[1000] bg-black/95 backdrop-blur-lg rounded-2xl p-5 border-2 border-purple-500 shadow-2xl w-72 max-h-[85vh] overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-purple-400" />
          <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 px-3 flex items-center justify-center rounded-md">
            Filtros
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white h-8 w-8"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-5">
        {/* Precio máximo */}
        <div>
          <label className="text-sm text-white mb-2 block font-medium">
            <Euro className="w-4 h-4 text-purple-400 inline-block mr-1" /> Precio máximo: <span className="text-purple-400 font-bold">{Math.round(filters.maxPrice)}€</span>
          </label>
          <Slider
            value={[filters.maxPrice]}
            onValueChange={([value]) => onFilterChange({ ...filters, maxPrice: value })}
            max={30}
            min={1}
            step={1}
            className="w-full [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
          />
        </div>

        {/* Disponibilidad */}
        <div>
          <label className="text-sm text-white mb-2 block font-medium">
            <Clock className="w-4 h-4 text-purple-400 inline-block mr-1" /> Disponible en: <span className="text-purple-400 font-bold">{filters.maxMinutes} min</span>
          </label>
          <Slider
            value={[filters.maxMinutes]}
            onValueChange={([value]) => onFilterChange({ ...filters, maxMinutes: value })}
            max={60}
            min={5}
            step={5}
            className="w-full [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
          />
        </div>

        {/* Distancia máxima */}
        <div>
          <label className="text-sm text-white mb-2 block font-medium">
            <MapPin className="w-4 h-4 text-purple-400 inline-block mr-1" /> Distancia máxima: <span className="text-purple-400 font-bold">{filters.maxDistance} km</span>
          </label>
          <Slider
            value={[filters.maxDistance]}
            onValueChange={([value]) => onFilterChange({ ...filters, maxDistance: value })}
            max={5}
            min={0.5}
            step={0.5}
            className="w-full [&_[data-orientation=horizontal]]:bg-gray-700 [&_[data-orientation=horizontal]>span]:bg-purple-500 [&_[role=slider]]:border-purple-400 [&_[role=slider]]:bg-purple-500"
          />
        </div>

        {/* Resultados */}
        <div className="pt-3 border-t border-gray-700">
          <p className="text-center text-sm text-gray-400">
            <span className="text-purple-400 font-bold">{alertsCount}</span> plazas encontradas
          </p>
        </div>

        {/* Reset */}
        <Button
          onClick={() => onFilterChange({ maxPrice: 7, maxMinutes: 25, maxDistance: 1 })}
          variant="outline"
          className="w-full border-gray-700 text-gray-900 hover:bg-gray-800 hover:text-white bg-white"
        >
          Restablecer filtros
        </Button>
      </div>
    </motion.div>
  );
}