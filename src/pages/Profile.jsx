import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const carColors = [
  { value: 'negro', label: 'Negro', fill: '#1a1a1a' },
  { value: 'blanco', label: 'Blanco', fill: '#ffffff' },
  { value: 'azul', label: 'Azul', fill: '#3b82f6' },
  { value: 'rojo', label: 'Rojo', fill: '#ef4444' },
  { value: 'gris', label: 'Gris', fill: '#6b7280' }
];

export default function Profile() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    display_name: '',
    car_brand: '',
    car_model: '',
    car_color: 'negro',
    vehicle_type: 'car',
    car_plate: '',
    photo_url: '',
    phone: '',
    allow_phone_calls: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      setFormData({
        display_name: currentUser.display_name || '',
        car_brand: currentUser.car_brand || '',
        car_model: currentUser.car_model || '',
        car_color: currentUser.car_color || 'negro',
        vehicle_type: currentUser.vehicle_type || 'car',
        car_plate: currentUser.car_plate || '',
        photo_url: currentUser.photo_url || '',
        phone: currentUser.phone || '',
        allow_phone_calls: currentUser.allow_phone_calls || false
      });

      setLoading(false);
    };

    fetchUser();
  }, []);

  const updateField = async (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    await base44.auth.updateMe(newData);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('photo_url', file_url);
  };

  const selectedColor = carColors.find(c => c.value === formData.car_color);

  const CarIcon = () => (
    <svg viewBox="0 0 48 24" className="w-14 h-8" fill="none">
      <path
        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
        fill="transparent"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="14" cy="18" r="3" fill="white" />
      <circle cx="36" cy="18" r="3" fill="white" />
    </svg>
  );

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Mi Perfil" showBackButton backTo="Home" />

      <div className="pt-[70px] pb-28 px-4 max-w-md mx-auto space-y-6">

        {/* TARJETA SUPERIOR EXACTA */}
        <div className="relative rounded-3xl p-[1px] bg-purple-600">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-6 flex gap-6 items-center">

            {/* FOTO */}
            <div className="relative">
              <div className="w-32 h-36 rounded-2xl overflow-hidden border-2 border-purple-500">
                {formData.photo_url ? (
                  <img src={formData.photo_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl">👤</div>
                )}
              </div>

              <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* INFO */}
            <div className="flex-1 space-y-3">

              <h2 className="text-3xl font-bold tracking-wide">
                {formData.display_name || 'JONATHAN'}
              </h2>

              <p className="text-lg text-gray-300">
                {formData.car_brand || 'Porsche'} {formData.car_model || 'Macan'}
              </p>

              {/* MATRÍCULA */}
              <div className="flex items-center">
                <div className="bg-white rounded-md overflow-hidden border border-gray-300 flex items-center h-9">
                  <div className="bg-blue-700 w-8 h-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <span className="px-4 text-black font-mono font-bold tracking-widest text-base">
                    {formData.car_plate || '2026 VSR'}
                  </span>
                </div>
              </div>

            </div>

            {/* ICONO */}
            <CarIcon />

          </div>
        </div>

        {/* FORMULARIO EXACTO */}
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Nombre</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400">Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-purple-400">
              <Phone className="w-4 h-4" />
              Permitir llamadas
            </div>
            <Switch
              checked={formData.allow_phone_calls}
              onCheckedChange={(checked) => updateField('allow_phone_calls', checked)}
              className="data-[state=checked]:bg-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Marca</Label>
              <Input
                value={formData.car_brand}
                onChange={(e) => updateField('car_brand', e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400">Modelo</Label>
              <Input
                value={formData.car_model}
                onChange={(e) => updateField('car_model', e.target.value)}
                className="bg-[#0f172a] border-gray-700 text-white"
              />
            </div>
          </div>

        </div>

      </div>

      <BottomNav />
    </div>
  );
}