import React from 'react';
import ParkingMap from '@/components/map/ParkingMap';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      <Header />

      {/* ===== MAPA FORZADO MÁS GRANDE ===== */}
      <div className="w-full mt-3 px-4">
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ height: "360px" }}   // 30px más grande real
        >
          <ParkingMap
            className="w-full h-full"
            style={{ height: "100%" }}
          />
        </div>
      </div>

      {/* CONTENIDO TARJETA */}
      <div className="px-4 mt-4 flex-1">
        <div className="rounded-2xl border border-purple-600 p-6 space-y-6">
          
          <div className="space-y-4">
            <input
              className="w-full h-12 rounded-lg bg-gray-800 px-4"
              placeholder="Calle Campoamor, 13"
            />

            <button className="w-full h-12 rounded-lg bg-purple-700">
              Ubicación actual
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p>Me voy en: 10 min</p>
              <input type="range" className="w-full h-6" />
            </div>

            <div>
              <p>Precio: 3€</p>
              <input type="range" className="w-full h-6" />
            </div>
          </div>

          <button className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800">
            Publicar mi WaitMe!
          </button>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
