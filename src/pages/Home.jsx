import React from 'react';
import UserCard from '@/components/cards/UserCard';

export default function Home() {
  return (
    <div className="space-y-4 p-3">

      {/* MAPA SE MANTIENE TAL CUAL (NO SE TOCA) */}
      <div id="map" className="h-64 rounded-xl overflow-hidden" />

      {/* TARJETA — AHORA USA EL MISMO DISEÑO QUE SOFÍA */}
      <UserCard
        avatar="https://randomuser.me/api/portraits/women/44.jpg"
        name="Sofía"
        car="Seat Ibiza"
        plate="1234 KLM"
        location="Calle Uría, Oviedo"
        dateText="Se va en 6 min"
        distance="80 m"
        price="3€"

        headerLeft={
          <span className="px-2 py-0.5 rounded bg-green-600/20 text-green-400 text-xs">
            Activa
          </span>
        }

        headerRight={
          <span className="text-purple-400 font-bold">
            3€
          </span>
        }

        footerType="waitme"
        onWaitMe={() => {}}
      />

    </div>
  );
}