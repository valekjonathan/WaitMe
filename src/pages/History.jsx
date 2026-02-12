// src/pages/History.jsx
import React from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function History() {

  // Arrays vacíos para asegurar que no renderiza nada aunque alguien reutilice lógica
  const myActiveAlerts = [];
  const myFinalizedAll = [];
  const reservationsFinalAll = [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center">
        {/* Estado vacío real */}
      </div>

      <BottomNav />
    </div>
  );
}