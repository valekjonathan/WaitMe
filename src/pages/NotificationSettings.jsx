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
          {/* Info Box */}
          <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-300">
              Gestiona qué notificaciones quieres recibir en tu smartphone. Los cambios se guardan automáticamente.
            </p>
          </div>

          {/* Notificaciones de Reservas */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl">
                <Bell className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Reservas</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Recibe alertas cuando alguien solicita, acepta o rechaza tu oferta de plaza
                </p>
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                  <span className="text-sm">Activar notificaciones de reservas</span>
                  <Switch
                    checked={settings.notify_reservations}
                    onCheckedChange={(checked) => updateSetting('notify_reservations', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notificaciones de Pago */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Pagos</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Recibe alertas cuando un pago se completa con éxito y ganas dinero
                </p>
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                  <span className="text-sm">Activar notificaciones de pagos</span>
                  <Switch
                    checked={settings.notify_payments}
                    onCheckedChange={(checked) => updateSetting('notify_payments', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alertas de Proximidad */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl">
                <MapPin className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Proximidad</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Recibe alertas cuando el comprador está cerca de tu ubicación
                </p>
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                  <span className="text-sm">Activar alertas de proximidad</span>
                  <Switch
                    checked={settings.notify_proximity}
                    onCheckedChange={(checked) => updateSetting('notify_proximity', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Promociones y Novedades */}
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/30 p-5">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-xl">
                <Megaphone className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Promociones y Novedades</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Entérate de nuevas funciones, ofertas especiales y actualizaciones de WaitMe!
                </p>
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                  <span className="text-sm">Activar promociones</span>
                  <Switch
                    checked={settings.notify_promotions}
                    onCheckedChange={(checked) => updateSetting('notify_promotions', checked)}
                  />
                </div>
              </div>
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