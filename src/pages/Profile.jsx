import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Camera, Car, Bell, Phone, Save, Settings, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/lib/AuthContext';

const carColors = [
  { value: 'blanco', label: 'Blanco', fill: '#FFFFFF' },
  { value: 'negro', label: 'Negro', fill: '#1a1a1a' },
  { value: 'rojo', label: 'Rojo', fill: '#ef4444' },
  { value: 'azul', label: 'Azul', fill: '#3b82f6' },
  { value: 'amarillo', label: 'Amarillo', fill: '#facc15' },
  { value: 'gris', label: 'Gris', fill: '#6b7280' }
];

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const navigate = useNavigate();

  // Al montar o cuando el usuario esté disponible, inicializar formulario con sus datos
  useEffect(() => {
    if (user) {
      setInitialValues({
        display_name: user.display_name || user.full_name || '',
        allow_phone_calls: user.allow_phone_calls ?? true,
        car_brand: user.car_brand || '',
        car_model: user.car_model || '',
        car_plate: user.car_plate || '',
        notifications_enabled: user.notifications_enabled ?? true,
        notify_reservations: user.notify_reservations ?? true,
        notify_proximity: user.notify_proximity ?? true,
        notify_payments: user.notify_payments ?? true
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Lógica de guardado: actualizar perfil del usuario en la base de datos
      // (Base44 podría requerir base44.auth.update o base44.entities.User.update)
      // Por ejemplo:
      // await base44.auth.update({...});
      // Tras guardar, podríamos refrescar el contexto de usuario si es necesario.
      alert('Perfil guardado correctamente (simulación)');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      alert('Hubo un error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Tu Perfil" showBackButton={true} backTo="Home" />
      <main className="pt-[60px] pb-24 px-4">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <img
              src={user?.photo_url || 'https://via.placeholder.com/100?text=Foto'}
              alt="Foto de perfil"
              className="w-28 h-28 rounded-full object-cover border-2 border-purple-500"
            />
            <Button size="icon" className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2">
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="display_name">Nombre</Label>
            <Input
              id="display_name"
              value={initialValues.display_name || ''}
              onChange={(e) => setInitialValues({ ...initialValues, display_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={user?.phone || ''}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">El teléfono se gestiona desde la app de autenticación.</p>
          </div>
          <div>
            <Label htmlFor="car">Tu vehículo</Label>
            <div className="flex gap-2">
              <Input
                id="car_brand"
                placeholder="Marca"
                value={initialValues.car_brand || ''}
                onChange={(e) => setInitialValues({ ...initialValues, car_brand: e.target.value })}
              />
              <Input
                id="car_model"
                placeholder="Modelo"
                value={initialValues.car_model || ''}
                onChange={(e) => setInitialValues({ ...initialValues, car_model: e.target.value })}
              />
            </div>
            <Input
              id="car_plate"
              placeholder="Matrícula"
              className="mt-2"
              value={initialValues.car_plate || ''}
              onChange={(e) => setInitialValues({ ...initialValues, car_plate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="car_color">Color del coche</Label>
            <Select onValueChange={(val) => setInitialValues({ ...initialValues, car_color: val })} value={user?.car_color || ''}>
              <SelectTrigger id="car_color">
                <SelectValue placeholder="Selecciona un color" />
              </SelectTrigger>
              <SelectContent>
                {carColors.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded-full border border-gray-500" style={{ backgroundColor: color.fill }}></span>
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm">Permitir llamadas directas</span>
            <Switch
              checked={initialValues.allow_phone_calls}
              onCheckedChange={(val) => setInitialValues({ ...initialValues, allow_phone_calls: val })}
            />
          </div>
          <div className="mt-6">
            <p className="text-lg font-semibold mb-2">Notificaciones</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Recibir notificaciones</span>
                <Switch
                  checked={initialValues.notifications_enabled}
                  onCheckedChange={(val) => setInitialValues({ ...initialValues, notifications_enabled: val })}
                />
              </div>
              <div className="flex items-center justify-between pl-6">
                <span className="text-sm">Reservas</span>
                <Switch
                  checked={initialValues.notify_reservations}
                  onCheckedChange={(val) => setInitialValues({ ...initialValues, notify_reservations: val })}
                  disabled={!initialValues.notifications_enabled}
                />
              </div>
              <div className="flex items-center justify-between pl-6">
                <span className="text-sm">Comprador cerca</span>
                <Switch
                  checked={initialValues.notify_proximity}
                  onCheckedChange={(val) => setInitialValues({ ...initialValues, notify_proximity: val })}
                  disabled={!initialValues.notifications_enabled}
                />
              </div>
              <div className="flex items-center justify-between pl-6">
                <span className="text-sm">Pagos recibidos</span>
                <Switch
                  checked={initialValues.notify_payments}
                  onCheckedChange={(val) => setInitialValues({ ...initialValues, notify_payments: val })}
                  disabled={!initialValues.notifications_enabled}
                />
              </div>
            </div>
          </div>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-6"
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