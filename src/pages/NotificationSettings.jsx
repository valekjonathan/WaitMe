import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Bell, CreditCard, MapPin, Megaphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';

export default function NotificationSettings() {
  const { user } = useAuth();

  // ✅ Sin pantalla negra: valores por defecto y luego se sincroniza en background
  const [masterToggle, setMasterToggle] = useState(true);
  const [settings, setSettings] = useState({
    notify_reservations: true,
    notify_payments: true,
    notify_proximity: true,
    notify_promotions: true
  });

  useEffect(() => {
    // Relleno instantáneo desde user (si existe) sin bloquear render
    if (!user) return;

    setMasterToggle(user.notifications_enabled ?? true);
    setSettings({
      notify_reservations: user.notify_reservations ?? true,
      notify_payments: user.notify_payments ?? true,
      notify_proximity: user.notify_proximity ?? true,
      notify_promotions: user.notify_promotions ?? true
    });
  }, [user]);

  const updateMasterToggle = async (value) => {
    setMasterToggle(value);
    try {
      await base44.auth.updateMe({ notifications_enabled: value });
    } catch (error) {
      console.log('Error guardando preferencia:', error);
    }
  };

  const updateSetting = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await base44.auth.updateMe({ [key]: value });
    } catch (error) {
      console.log('Error guardando preferencia:', error);
    }
  };

  return (
    <div className="min-min-h-[100dvh] bg-black text-white flex flex-col">
      <Header title="Notificaciones" showBackButton={true} backTo="Settings" />

      <main className="pt-20 pb-24 px-4 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Permitir notificaciones:</h2>
            <Switch
              checked={masterToggle}
              onCheckedChange={updateMasterToggle}
              className={masterToggle ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-red-500'}
            />
          </div>

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

          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Promociones</h3>
              </div>
              <Switch
                checked={settings.notify_promotions}
                onCheckedChange={(checked) => updateSetting('notify_promotions', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0"
              />
            </div>
          </div>

          <Link to={createPageUrl('Settings')} className="block pt-2">
            <div className="text-center text-purple-400 underline underline-offset-4">Volver</div>
          </Link>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}