// FILE: src/pages/Notificaciones.jsx
import React from 'react';
import UserCard from '@/components/cards/UserCard';

export default function Notificaciones() {
  return (
    <div className="p-3 space-y-3">
      <UserCard
        avatar="https://randomuser.me/api/portraits/women/12.jpg"
        name="Laura"
        car="Toyota Yaris"
        plate="9123 LKD"
        location="Calle Uría, Oviedo"
        timeText="Nueva alerta"
        price="3€"
        footer="waitme"
      />
    </div>
  );
}