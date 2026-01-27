import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bell, CreditCard, MapPin, Megaphone, Settings as SettingsIcon, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [masterToggle, setMasterToggle] = useState(true);
  const [settings, setSettings] = useState({
    notify_reservations: true,
    notify_payments: true,
    notify_proximity: true,
    notify_promotions: true
  });

  useEffect(() => {
    // Simular carga de configuraciones desde user (si estuviera disponible)
    if (user) {
      setSettings({
        notify_reservations: user.notify_reservations ?? true,
        notify_payments: user.notify_payments ?? true,
        notify_proximity: user.notify_proximity ?? true,
        notify_promotions: user.notify_promotions ?? true
      });
      setMasterToggle(user.notifications_enabled ?? true);
    }
    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Guardar preferencias en la base de datos, por ejemplo:
      // await base44.entities.User.update(user.id, { ...settings, notifications_enabled: masterToggle });
      alert('Preferencias de notificación guardadas (simulación)');
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      alert('No se pudieron guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton={true} backTo="Settings" />
      <main className="pt-[60px] pb-24 px-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Notificaciones activadas</span>
            <Switch checked={masterToggle} onCheckedChange={(val) => setMasterToggle(val)} />
          </div>
          <div className="pl-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Reservas</span>
              <Switch
                checked={settings.notify_reservations}
                onCheckedChange={(val) => setSettings({ ...settings, notify_reservations: val })}
                disabled={!masterToggle}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pagos</span>
              <Switch
                checked={settings.notify_payments}
                onCheckedChange={(val) => setSettings({ ...settings, notify_payments: val })}
                disabled={!masterToggle}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Comprador cerca</span>
              <Switch
                checked={settings.notify_proximity}
                onCheckedChange={(val) => setSettings({ ...settings, notify_proximity: val })}
                disabled={!masterToggle}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Promociones</span>
              <Switch
                checked={settings.notify_promotions}
                onCheckedChange={(val) => setSettings({ ...settings, notify_promotions: val })}
                disabled={!masterToggle}
              />
            </div>
          </div>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}