import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Camera, Car, Bell, Phone, Settings, MessageCircle } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    display_name: '',
    car_brand: '',
    car_model: '',
    car_color: 'gris',
    vehicle_type: 'car',
    car_plate: '',
    photo_url: '',
    phone: '',
    allow_phone_calls: false,
    notifications_enabled: true,
    email_notifications: true
  });

  // ✅ Relleno instantáneo desde AuthContext (cero pantallas de carga)
  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      display_name: user.display_name || user.full_name?.split(' ')[0] || prev.display_name,
      car_brand: user.car_brand || prev.car_brand,
      car_model: user.car_model || prev.car_model,
      car_color: user.car_color || prev.car_color,
      vehicle_type: user.vehicle_type || prev.vehicle_type,
      car_plate: user.car_plate || prev.car_plate,
      photo_url: user.photo_url || prev.photo_url,
      phone: user.phone || prev.phone,
      allow_phone_calls: user.allow_phone_calls || false,
      notifications_enabled: user.notifications_enabled !== false,
      email_notifications: user.email_notifications !== false
    }));
  }, [user]);

  const autoSave = async (data) => {
    try {
      await base44.auth.updateMe(data);
    } catch (error) {
      console.error('Error guardando:', error);
    }
  };

  const updateField = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    autoSave(newData);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateField('photo_url', file_url);
    } catch (error) {
      console.error('Error subiendo foto:', error);
    }
  };

  const selectedColor = carColors.find((c) => c.value === formData.car_color) || carColors[5];

  const CarIconProfile = ({ color, size = "w-16 h-10" }) =>
    <svg viewBox="0 0 48 24" className={size} fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="14" cy="18" r="2" fill="#666" />
      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="2" fill="#666" />
    </svg>;

  const CarIconSmall = ({ color }) =>
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>;

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <Header title="Mi Perfil" showBackButton={true} backTo="Home" />

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto overflow-hidden h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
            <div className="flex gap-4">
              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold text-white">
                  {formData.display_name || user?.full_name?.split(' ')[0]}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {formData.car_brand || 'Sin'} {formData.car_model || 'coche'}
                    </p>
                  </div>
                  <CarIconProfile color={selectedColor?.fill} />
                </div>

                <div className="mt-2 flex items-center">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                      {formData.car_plate
                        ? `${formData.car_plate.slice(0, 4)} ${formData.car_plate.slice(4)}`.trim()
                        : '0000 XXX'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Nombre</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => updateField('display_name', e.target.value.slice(0, 15))}
                  placeholder="Tu nombre"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+34 600 00 00"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Marca</Label>
                <Input
                  value={formData.car_brand}
                  onChange={(e) => updateField('car_brand', e.target.value)}
                  placeholder="Seat"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Modelo</Label>
                <Input
                  value={formData.car_model}
                  onChange={(e) => updateField('car_model', e.target.value)}
                  placeholder="Ibiza"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Matrícula</Label>
                <Input
                  value={formData.car_plate}
                  onChange={(e) => updateField('car_plate', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="1234ABC"
                  className="bg-gray-900 border-gray-700 text-white h-9 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Color</Label>
                <Select value={formData.car_color} onValueChange={(v) => updateField('car_color', v)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {carColors.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <CarIconSmall color={c.fill} />
                          <span>{c.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Permitir llamadas</p>
                  <p className="text-xs text-gray-500">Otros usuarios podrán llamarte</p>
                </div>
              </div>
              <Switch checked={!!formData.allow_phone_calls} onCheckedChange={(v) => updateField('allow_phone_calls', v)} />
            </div>

            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Notificaciones</p>
                  <p className="text-xs text-gray-500">Activa avisos importantes</p>
                </div>
              </div>
              <Switch checked={!!formData.notifications_enabled} onCheckedChange={(v) => updateField('notifications_enabled', v)} />
            </div>

            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Notificaciones por email</p>
                  <p className="text-xs text-gray-500">Recibir avisos por correo</p>
                </div>
              </div>
              <Switch checked={!!formData.email_notifications} onCheckedChange={(v) => updateField('email_notifications', v)} />
            </div>

            <Link to={createPageUrl('Settings')}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl h-11">
                <Settings className="w-5 h-5 mr-2" />
                Ajustes
              </Button>
            </Link>
          </div>

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}