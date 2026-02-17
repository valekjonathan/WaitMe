import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

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
  const [hydrated, setHydrated] = useState(false);

  const [formData, setFormData] = useState({
    display_name: '',
    car_brand: '',
    car_model: '',
    car_color: 'gris',
    vehicle_type: 'car',
    car_plate: '',
    photo_url: '',
    phone: '',
    allow_phone_calls: false
  });

  useEffect(() => {
    if (!user || hydrated) return;

    setFormData({
      display_name: user.display_name || user.full_name?.split(' ')[0] || '',
      car_brand: user.car_brand || '',
      car_model: user.car_model || '',
      car_color: user.car_color || 'gris',
      vehicle_type: user.vehicle_type || 'car',
      car_plate: user.car_plate || '',
      photo_url: user.photo_url || '',
      phone: user.phone || '',
      allow_phone_calls: user.allow_phone_calls || false
    });

    setHydrated(true);
  }, [user, hydrated]);

  const autoSave = async (data) => {
    try {
      await base44.auth.updateMe(data);
    } catch (e) {
      console.error(e);
    }
  };

  const updateField = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    autoSave(newData);
  };

  // FOTO INSTANTÁNEA
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, photo_url: localPreview }));

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateField('photo_url', file_url);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedColor = carColors.find(c => c.value === formData.car_color);

  const VehicleIcon = ({ type, color }) => {
    if (type === 'suv') {
      return (
        <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
          <path d="M6 16 L8 10 L16 7 L32 7 L40 10 L44 14 L44 18 L6 18 Z"
            fill={color} stroke="white" strokeWidth="1.5" />
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
        </svg>
      );
    }

    if (type === 'van') {
      return (
        <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
          <path d="M4 18 V11 L14 11 L20 7 H36 L44 11 V18 H4 Z"
            fill={color} stroke="white" strokeWidth="1.5"/>
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
          fill={color} stroke="white" strokeWidth="1.5"/>
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
      </svg>
    );
  };

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <Header title="Mi Perfil" showBackButton={true} backTo="Home" />

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto h-screen overflow-hidden">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* TARJETA */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
            <div className="flex gap-4">

              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Perfil"
                      loading="eager"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                      👤
                    </div>
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                </label>
              </div>

              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold">
                  {formData.display_name || user?.full_name?.split(' ')[0]}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {formData.car_brand || 'Sin'} {formData.car_model || 'coche'}
                    </p>
                  </div>
                  <VehicleIcon type={formData.vehicle_type} color={selectedColor?.fill}/>
                </div>

                <div className="mt-2 bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7 w-fit">
                  <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">E</span>
                  </div>
                  <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                    {formData.car_plate || '0000 XXX'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="space-y-3">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-sm">Nombre</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => updateField('display_name', e.target.value.slice(0, 15))}
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800 flex justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400"/>
                <p className="text-sm">Permitir llamadas</p>
              </div>
              <Switch
                checked={formData.allow_phone_calls}
                onCheckedChange={(checked) => updateField('allow_phone_calls', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <Label className="text-gray-400 text-sm">Marca</Label>
                <Input
                  value={formData.car_brand}
                  onChange={(e) => updateField('car_brand', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>

              <div>
                <Label className="text-gray-400 text-sm">Modelo</Label>
                <Input
                  value={formData.car_model}
                  onChange={(e) => updateField('car_model', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>

            </div>

            <div>
              <Label className="text-gray-400 text-sm">Vehículo</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => updateField('vehicle_type', value)}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white"/>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="car">Coche normal</SelectItem>
                  <SelectItem value="suv">Coche voluminoso</SelectItem>
                  <SelectItem value="van">Furgoneta</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </motion.div>
      </main>

      <BottomNav/>
    </div>
  );
}