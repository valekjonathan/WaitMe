// FILE: src/pages/Chats.jsx
import React from 'react';
import UserCard from '@/components/cards/UserCard';

export default function Chats() {
  return (
    <div className="p-3 space-y-3">
      <UserCard
        avatar="https://randomuser.me/api/portraits/men/32.jpg"
        name="Marco"
        car="Volkswagen Golf"
        plate="5678 HJP"
        location="Calle Fray Ceferino, Oviedo"
        timeText="Chat activo"
        price="5€"
        footer="actions"
      />
    </div>
  );
}