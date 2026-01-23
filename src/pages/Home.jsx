// FILE: src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ParkingMap from '@/components/map/ParkingMap';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';
import UserCard from '@/components/cards/UserCard'; // ✅ LA TARJETA DE SOFÍA

export default function Home() {
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    maxPrice: 7,
    maxMinutes: 25,
    maxDistance: 1
  });
  const [showFilters, setShowFilters] = useState(false);

  // 🔹 DEMO ALERTA (la que ves debajo del mapa)
  const demoAlert = {
    user_name: 'Sofía',
    user_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    car_brand: 'SEAT',
    car_model: 'Ibiza',
    car_color: 'blanco',
    car_plate: '1234KLM',
    address: 'Calle Uría, Oviedo',
    available_in_minutes: 6,
    price: 3,
    latitude: 43.3623,
    longitude: -5.8437
  };

  return (
    <div className="pb-20">
      <Header title="WaitMe!" />

      {/* MAPA – NO SE TOCA */}
      <div className="px-3 mt-3">
        <ParkingMap />
      </div>

      {/* FILTROS – NO SE TOCAN */}
      {showFilters && (
        <MapFilters
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setShowFilters(false)}
          alertsCount={1}
        />
      )}

      {/* ✅ TARJETA BAJO EL MAPA (MISMA QUE SOFÍA) */}
      <div className="px-3 mt-3">
        <UserCard
          userName={demoAlert.user_name}
          userPhoto={demoAlert.user_photo}
          carBrand={demoAlert.car_brand}
          carModel={demoAlert.car_model}
          carColor={demoAlert.car_color}
          carPlate={demoAlert.car_plate}
          vehicleType="car"
          address={demoAlert.address}
          availableInMinutes={demoAlert.available_in_minutes}
          price={demoAlert.price}
          latitude={demoAlert.latitude}
          longitude={demoAlert.longitude}
          userLocation={userLocation}
          showLocationInfo={true}
          showContactButtons={false}
          isReserved={false}
          actionButtons={
            <button
              onClick={() => alert('WaitMe')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2 font-semibold"
            >
              WaitMe!
            </button>
          }
        />
      </div>

      <NotificationManager />
      <BottomNav />
    </div>
  );
}