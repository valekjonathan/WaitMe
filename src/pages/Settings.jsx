import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Instagram, Globe } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';

export default function Configuracion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoSrc, setPhotoSrc] = useState('');

  // ✅ FOTO INSTANTÁNEA
  useEffect(() => {
    if (!user?.photo_url) return;

    const img = new Image();
    img.src = user.photo_url;
    img.onload = () => {
      setPhotoSrc(user.photo_url);
    };
  }, [user?.photo_url]);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate('/Login');
  };

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <Header title="Configuración" showBackButton={true} backTo="Home" />

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto h-screen overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* FOTO PERFIL */}
          <div className="flex flex-col items-center mt-4">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-purple-500 bg-gray-800">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                  👤
                </div>
              )}
            </div>
          </div>

          {/* ICONOS REDES */}
          <div className="flex justify-center gap-8 pt-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-white hover:text-purple-400 transition-colors"
            >
              <Instagram className="w-7 h-7" />
              <span className="text-sm">Instagram</span>
            </a>

            <a
              href="https://waitme.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-white hover:text-purple-400 transition-colors"
            >
              <Globe className="w-7 h-7" />
              <span className="text-sm">Web</span>
            </a>
          </div>

          {/* BOTÓN CERRAR SESIÓN */}
          <div className="pt-6">
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Cerrar sesión
            </Button>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}