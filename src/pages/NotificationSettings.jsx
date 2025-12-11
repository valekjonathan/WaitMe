import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bell, CreditCard, MapPin, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterToggle, setMasterToggle] = useState(true);
  const [settings, setSettings] = useState({
    notify_reservations: true,
    notify_payments: true,
    notify_proximity: true,
    notify_promotions: false
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
          notify_promotions: currentUser.notify_promotions ?? false
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
          
          <h1 className="text-lg font-semibold">Notificaciones</h1>
          
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Master Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Permitir notificaciones:</h2>
            <Switch
              checked={masterToggle}
              onCheckedChange={updateMasterToggle}
              className={masterToggle ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-red-500'}
            />
          </div>

          {/* Notificaciones de Reservas */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl flex-shrink-0 self-start">
                <Bell className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-semibold text-lg mb-1">Reservas</h3>
                <p className="text-sm text-gray-400 flex-1">
                  Recibe alertas cuando alguien solicita, acepta o rechaza tu oferta de plaza
                </p>
              </div>
              <Switch
                checked={settings.notify_reservations}
                onCheckedChange={(checked) => updateSetting('notify_reservations', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0 self-start"
              />
            </div>
          </div>

          {/* Notificaciones de Pago */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl flex-shrink-0 self-start">
                <CreditCard className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-semibold text-lg mb-1">Pagos</h3>
                <p className="text-sm text-gray-400 flex-1">
                  Recibe alertas cuando un pago se completa con éxito y ganas dinero
                </p>
              </div>
              <Switch
                checked={settings.notify_payments}
                onCheckedChange={(checked) => updateSetting('notify_payments', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0 self-start"
              />
            </div>
          </div>

          {/* Alertas de Proximidad */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl flex-shrink-0 self-start">
                <MapPin className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-semibold text-lg mb-1">Proximidad</h3>
                <p className="text-sm text-gray-400 flex-1">
                  Recibe alertas cuando el comprador está cerca de tu ubicación
                </p>
              </div>
              <Switch
                checked={settings.notify_proximity}
                onCheckedChange={(checked) => updateSetting('notify_proximity', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0 self-start"
              />
            </div>
          </div>

          {/* Promociones y Novedades */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl flex-shrink-0 self-start">
                <Megaphone className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-semibold text-lg mb-1">Promociones y Novedades</h3>
                <p className="text-sm text-gray-400 flex-1">
                  Entérate de nuevas funciones, ofertas especiales y actualizaciones de WaitMe!
                </p>
              </div>
              <Switch
                checked={settings.notify_promotions}
                onCheckedChange={(checked) => updateSetting('notify_promotions', checked)}
                disabled={!masterToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 flex-shrink-0 self-start"
              />
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">
              Las notificaciones push requieren permisos del navegador. Si no recibes notificaciones, revisa la configuración de tu dispositivo.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}