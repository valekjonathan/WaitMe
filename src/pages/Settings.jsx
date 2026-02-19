import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  User,
  Coins,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Star,
  Instagram,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';

export default function Settings() {
  const { user, isLoadingAuth, logout } = useAuth();


  // Foto instantánea (caché local) para que NO tarde en cargar
  const [photoSrc, setPhotoSrc] = React.useState('');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const cacheKey = `waitme_settings_photo_cache_${user?.id || 'default'}`;
    let cached = '';
    try {
      cached = window.localStorage.getItem(cacheKey) || '';
      if (cached) setPhotoSrc(cached);
    } catch (_) {}

    const url = user?.photo_url || '';
    if (!url) return;

    const img = new Image();
    img.decoding = 'sync';
    img.src = url;
    img.onload = () => {
      if (!cached) setPhotoSrc(url);
      fetch(url)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        )
        .then((dataUrl) => {
          if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
            try { window.localStorage.setItem(cacheKey, dataUrl); } catch (_) {}
          }
        })
        .catch(() => null);
    };
  }, [user?.id, user?.photo_url]);


  // Precarga real para que la foto salga instantánea
  useEffect(() => {
    if (!user?.photo_url) return;
    const img = new Image();
    img.src = user.photo_url;
  }, [user?.photo_url]);

  const handleLogout = () => {
    logout?.(true);
  };

  const instagramUrl = user?.instagram_url || user?.instagram || '';
  const webUrl = user?.website_url || user?.web || '';

  const openExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const displayName =
    user?.display_name || user?.full_name?.split(' ')?.[0] || 'Usuario';

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      <Header title="Ajustes" showBackButton={true} backTo="Home" />

      <main className="pt-20 pb-24 px-4 w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Perfil resumen */}
          <Link to={createPageUrl('Profile')}>
            <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
              {user?.photo_url ? (
                <img
                  src={photoSrc || user.photo_url}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-purple-500 bg-gray-800"
                  alt=""
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-purple-500 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-gray-400">{user?.email || ''}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </Link>

          {/* Créditos */}
          <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-5 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-purple-400" />
                <span className="font-medium">Mis créditos</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {(user?.credits || 0).toFixed(2)}€
              </span>
            </div>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoadingAuth}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Añadir créditos
            </Button>
          </div>

          {/* Opciones */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
            <Link
              to={createPageUrl('NotificationSettings')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Notificaciones</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Privacidad</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Star className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Valorar la app</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Ayuda</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Instagram y Web - cajas individuales estilo Créditos */}
          <div className="flex justify-center gap-6">
            
            <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-4 border-2 border-purple-500 w-32 flex flex-col items-center">
              <button
                onClick={() => openExternal(instagramUrl)}
                disabled={!instagramUrl}
                className="flex flex-col items-center gap-2 disabled:opacity-40"
              >
                <Instagram className="w-7 h-7 text-purple-300" />
                <span className="text-sm font-medium">Instagram</span>
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-2xl p-4 border-2 border-purple-500 w-32 flex flex-col items-center">
              <button
                onClick={() => openExternal(webUrl)}
                disabled={!webUrl}
                className="flex flex-col items-center gap-2 disabled:opacity-40"
              >
                <Globe className="w-7 h-7 text-purple-300" />
                <span className="text-sm font-medium">Web</span>
              </button>
            </div>

          </div>

          {/* Cerrar sesión */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoadingAuth}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>

          {/* Footer */}
          <div className="text-center pt-4">
            <Logo size="sm" />
            <p className="text-xs text-gray-500 mt-2">Versión 1.0.0</p>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}