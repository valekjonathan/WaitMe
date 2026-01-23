// FILE: src/pages/Historia.jsx
import React from 'react';
import UserCard from '@/components/cards/UserCard';

export default function Historia() {
  return (
    <div className="p-3 space-y-3">

      {/* ACTIVA */}
      <UserCard
        avatar="https://randomuser.me/api/portraits/women/44.jpg"
        name="Sofía"
        car="Seat Ibiza"
        plate="7780 KLP"
        location="Calle Gran Vía, Oviedo"
        timeText="Se va en 6 min"
        price="2,50€"
        footer="countdown"
        countdownText="09:51"
      />

      {/* FINALIZADA */}
      <UserCard
        avatar="https://randomuser.me/api/portraits/men/65.jpg"
        name="Hugo"
        car="BMW Serie 1"
        plate="2847 BNM"
        location="Av. Galicia, Oviedo"
        timeText="Finalizada"
        price="4€"
        footer="actions"
      />

    </div>
  );
}