import React from 'react';

export default function MapFilters({
  filters = {
    minPrice: 0,
    maxPrice: 10,
    maxDistance: 500,
  },
  onFilterChange = () => {},
  onClose = () => {},
  alertsCount = 0,
}) {
  const safeFilters = {
    minPrice: filters?.minPrice ?? 0,
    maxPrice: filters?.maxPrice ?? 10,
    maxDistance: filters?.maxDistance ?? 500,
  };

  return (
    <div className="px-3 mt-2">
      <div className="bg-gray-900 rounded-xl p-3 border border-purple-500/30 text-white">
        <div className="text-sm mb-2">
          Alertas disponibles: <b>{alertsCount}</b>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            Precio máximo: <b>{safeFilters.maxPrice}€</b>
          </div>
          <div>
            Distancia máxima: <b>{safeFilters.maxDistance} m</b>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full bg-purple-600 rounded-md py-2 font-semibold"
        >
          Cerrar filtros
        </button>
      </div>
    </div>
  );
}