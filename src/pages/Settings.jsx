import React, { useEffect, useState } from 'react';
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
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function Settings() {
  const { user, isLoadingAuth, logout } = useAuth();

  // Mantengo estos estados por si ya los estabas usando en el código (sin bloquear la pantalla)
  const [phone, setPhone] = useState('');
  const [allowCalls, setAllowCalls] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hidrata desde el usuario en cuanto exista (sin pantalla de carga)
  useEffect(() => {
    if (!user) return;
    setPhone(user.phone || '');
    setAllowCalls(user.allow_phone_calls || false);
  }, [user]);

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ phone, allow_phone_calls: allowCalls });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    // Logout “oficial” del contexto (más fiable)
    logout?.(true);
  };

  const displayName = user?.display_name || user?.full_name?.split(' ')?.[0] || 'Usuario';

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Ajustes" showBackButton={true} backTo="Home" />

      <main className="pt-20 pb-24 px-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Perfil resumen */}
          <Link to={createPageUrl('Profile')}>
            <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
              {user?.photo_url ? (
                <img src={user.photo_url} className="w-14 h-14 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
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
            <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoadingAuth}>
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

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors" type="button">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Privacidad</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors" type="button">
              <Star className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Valorar la app</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors" type="button">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Ayuda</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cerrar sesión */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
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
