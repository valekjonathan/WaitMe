import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  const [phone, setPhone] = useState('');
  const [allowCalls, setAllowCalls] = useState(false);
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(() => {
    try { return localStorage.getItem('waitme_demo_mode') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    setPhone(user?.phone || '');
    setAllowCalls(user?.allow_phone_calls || false);
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
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Ajustes" showBackButton={true} backTo="Home" />

      <main className="pt-20 pb-24 px-4 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

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
                <p className="font-semibold">{user?.display_name || user?.full_name?.split(' ')[0]}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </Link>

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
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Añadir créditos
            </Button>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800">
            <Link
              to={createPageUrl('NotificationSettings')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-purple-500" />
              <span className="flex-1">Notificaciones</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>


            <div className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors">
              <Bell className="w-5 h-5 text-purple-500" />
              <div className="flex-1">
                <div className="font-medium">Modo demo</div>
                <div className="text-xs text-gray-400">Activa eventos simulados (push + flujo)</div>
              </div>
              <Switch checked={demoMode} onCheckedChange={setDemoMode} />
            </div>

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

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>

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