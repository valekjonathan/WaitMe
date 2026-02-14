import React from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center">
        {/* Pantalla intencionalmente vacía */}
      </div>

      <BottomNav />
    </div>
  );
}
