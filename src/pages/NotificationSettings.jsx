import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bell, CreditCard, MapPin, Megaphone, Settings as SettingsIcon, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterToggle, setMasterToggle] = useState(true);
  const [settings, setSettings] = useState({
    notify_reservations: true,
    notify_payments: true,
    notify_proximity: true,
    notify_promotions: true
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Cargar preferencias guardadas
        setMasterToggle(currentUser.notifications_enabled ?? true);
        setSettings({
          notify_reservations: currentUser.notify_reservations ?? true,
          notify_payments: currentUser.notify_payments ?? true,
          notify_proximity: currentUser.notify_proximity ?? true,
          notify_promotions: currentUser.notify_promotions ?? true
        });
      } catch (error) {
        console.log('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const updateMasterToggle = async (value) => {
    setMasterToggle(value);
    try {
      await base44.auth.updateMe({ notifications_enabled: value });
    } catch (error) {
      console.log('Error guardando preferencia:', error);
    }
  };

  const updateSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      await base44.auth.updateMe({ [key]: value });
    } catch (error) {
      console.log('Error guardando preferencia:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-purple-400 font-bold text-sm">{(user?.credits || 0).toFixed(2)}€</span>
            </div>
            <Link to={createPageUrl('Home')}>
              <h1 className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-white">Wait</span><span className="text-purple-500">Me!</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Chats')} className="relative">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4 h-screen overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-4"
        >
          {/* Master Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Permitir notificaciones:</h2>
            <Switch
              checked={masterToggle}
              onCheckedChange={updateMasterToggle}
              className={masterToggle ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-red-500'}
            />
          </div>

          {/* Notificaciones de Reservas */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Reservas</h3>
              </div>
              <Switch
                checked={settings.notify_reservations}
                onCheckedChange={(checked) => updateSetting('notify_reservations', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          {/* Notificaciones de Pago */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Pagos</h3>
              </div>
              <Switch
                checked={settings.notify_payments}
                onCheckedChange={(checked) => updateSetting('notify_payments', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          {/* Alertas de Proximidad */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Proximidad</h3>
              </div>
              <Switch
                checked={settings.notify_proximity}
                onCheckedChange={(checked) => updateSetting('notify_proximity', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          {/* Novedades */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Novedades</h3>
              </div>
              <Switch
                checked={settings.notify_promotions}
                onCheckedChange={(checked) => updateSetting('notify_promotions', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">
              Las notificaciones push requieren permisos del navegador. Si no las recibes, revisa tu configuración.
            </p>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}