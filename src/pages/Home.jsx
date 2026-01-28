// ================================
// FILE: src/pages/Home.jsx
// ================================
import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import UserAlertCard from '@/components/cards/UserAlertCard';
import ParkingMap from '@/components/map/ParkingMap';

export default function Home() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">

      {/* MAPA */}
      <div className="relative">
        <ParkingMap
          onSelectAlert={setSelectedAlert}
        />
      </div>

      {/* BUSCADOR (MENOS AIRE ARRIBA Y ABAJO) */}
      <div className="px-4 pt-2 pb-1">
        <Input
          placeholder="Buscar dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border-gray-700 text-white"
        />
      </div>

      {/* TARJETA (SUBE, MENOS NEGRO) */}
      <div className="px-4 pb-2">
        <UserAlertCard
          alert={selectedAlert}
          isEmpty={!selectedAlert}
        />
      </div>

    </div>
  );
}