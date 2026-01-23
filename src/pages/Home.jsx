// FILE: src/pages/Hogar.jsx
import React from 'react';
import UserCard from '@/components/UserCard';

export default function Hogar() {
  return (
    <div className="p-3 space-y-3">

      {/* MAPA – NO TOCAR */}
      <div className="h-64 rounded-xl overflow-hidden bg-black" />

      {/* TARJETA HOME */}
      <UserCard
        avatar="https://randomuser.me/api/portraits/women/44.jpg"
        name="Sofía"
        car="Seat Ibiza"
        plate="1234 KLM"
        location="Calle Uría, Oviedo"
        timeText="Se va en 6 min"
        distance="80 m"
        price="3€"
        footer="waitme"
      />

    </div>
  );
}