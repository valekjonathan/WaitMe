
import React from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function Notifications() {
  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <Header title="Notificaciones" showBackButton={true} backTo="Home" />

      <main className="pt-20 pb-24 px-4 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Ejemplo mezcla tarjetas estilo app */}

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400">Hace un momento</p>
            <p className="mt-1">
              Un usuario quiere tu <span className="text-purple-500 font-semibold">WaitMe!</span>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400">Hoy</p>
            <p className="mt-1">
              Tu alerta ha expirado.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400">Ayer</p>
            <p className="mt-1">
              Has recibido una nueva reserva.
            </p>
          </div>

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
