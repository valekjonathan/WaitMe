import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

function PlateView({ plate }) {
  const safe = (plate || '').replace(/\s+/g, '').toUpperCase();
  const pretty = safe ? `${safe.slice(0, 4)} ${safe.slice(4)}`.trim() : '0000 XXX';

  return (
    <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
      <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
        <span className="text-white text-[8px] font-bold">E</span>
      </div>
      <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
        {pretty}
      </span>
    </div>
  );
}

function VehicleIconWhite({ type }) {
  if (type === 'van') {
    return (
      <svg viewBox="0 0 48 24" className="w-14 h-9" fill="none">
        <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" stroke="white" strokeWidth="2.2" />
        <circle cx="14" cy="18" r="3.4" stroke="white" strokeWidth="2.2" fill="none" />
        <circle cx="34" cy="18" r="3.4" stroke="white" strokeWidth="2.2" fill="none" />
      </svg>
    );
  }

  if (type === 'suv') {
    return (
      <svg viewBox="0 0 48 24" className="w-14 h-9" fill="none">
        <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z" stroke="white" strokeWidth="2.2" />
        <circle cx="14" cy="18" r="3.6" stroke="white" strokeWidth="2.2" fill="none" />
        <circle cx="36" cy="18" r="3.6" stroke="white" strokeWidth="2.2" fill="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 24" className="w-14 h-9" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" stroke="white" strokeWidth="2.2" />
      <circle cx="14" cy="18" r="3.4" stroke="white" strokeWidth="2.2" fill="none" />
      <circle cx="36" cy="18" r="3.4" stroke="white" strokeWidth="2.2" fill="none" />
    </svg>
  );
}

function CarIconTiny({ fill }) {
  return (
    <svg viewBox="0 0 48 24" className="w-7 h-4" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={fill} stroke="white" strokeWidth="1.2" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );
}

function VehicleIconTiny({ type }) {
  if (type === 'van') {
    return (
      <svg viewBox="0 0 48 24" className="w-7 h-4" fill="none">
        <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill="#6b7280" stroke="white" strokeWidth="1.2" />
        <circle cx="14" cy="18" r="2.6" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="34" cy="18" r="2.6" fill="#333" stroke="white" strokeWidth="1" />
      </svg>
    );
  }

  if (type === 'suv') {
    return (
      <svg viewBox="0 0 48 24" className="w-7 h-4" fill="none">
        <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z" fill="#6b7280" stroke="white" strokeWidth="1.2" />
        <circle cx="14" cy="18" r="2.8" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="36" cy="18" r="2.8" fill="#333" stroke="white" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 24" className="w-7 h-4" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="#6b7280" stroke="white" strokeWidth="1.2" />
      <circle cx="14" cy="18" r="2.6" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="2.6" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const [formData, setFormData] = useState({
    display_name: '',
    car_brand: '',
    car_model: '',
    car_color: 'negro',
    vehicle_type: 'car', // car | suv | van
    car_plate: '',
    photo_url: '',
    phone: '',
    allow_phone_calls: false
  });

  useEffect(() => {
    const run = async () => {
      try {
        const currentUser = await base44.auth.me();
        setMe(currentUser);

        setFormData({
          display_name: currentUser.display_name || currentUser.full_name?.split(' ')[0] || '',
          car_brand: currentUser.car_brand || 'Porsche',
          car_model: currentUser.car_model || 'Macan',
          car_color: currentUser.car_color || 'negro',
          vehicle_type: currentUser.vehicle_type || 'car',
          car_plate: currentUser.car_plate || '2026VSR',
          photo_url: currentUser.photo_url || '',
          phone: currentUser.phone || '+34 600 00 00',
          allow_phone_calls: currentUser.allow_phone_calls || false
        });
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const selectedColor = useMemo(() => {
    return carColors.find(c => c.value === formData.car_color) || carColors[1];
  }, [formData.car_color]);

  const autoSave = async (data) => {
    try {
      await base44.auth.updateMe(data);
    } catch (e) {
      console.error('Profile save error:', e);
    }
  };

  const updateField = (field, value) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    autoSave(next);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateField('photo_url', file_url);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-500 animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Mi Perfil" showBackButton={true} backTo="Home" />

      <main className="pt-[69px] pb-28 px-4 max-w-md mx-auto">

        {/* TARJETA SUPERIOR (calcada al PNG) */}
        <div className="border border-purple-500/80 rounded-3xl p-5 bg-gradient-to-br from-[#0b1220] to-[#1f2a44] shadow-[0_0_0_1px_rgba(168,85,247,0.12)]">
          <div className="flex gap-5">

            {/* FOTO */}
            <div className="relative">
              <div className="w-28 h-32 rounded-2xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    alt="Perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                    👤
                  </div>
                )}
              </div>

              <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-xl">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* INFO */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="w-full">
                <div className="text-[28px] font-extrabold tracking-wide text-white text-center leading-tight">
                  {(formData.display_name || me?.full_name?.split(' ')[0] || 'JONATHAN').toUpperCase()}
                </div>

                <div className="text-gray-300 text-[18px] text-center mt-2">
                  {formData.car_brand} {formData.car_model}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <PlateView plate={formData.car_plate} />
                <VehicleIconWhite type={formData.vehicle_type} />
              </div>
            </div>

          </div>
        </div>

        {/* FORM (calcado al PNG) */}
        <div className="mt-6 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-500 text-sm">Nombre</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => updateField('display_name', e.target.value.slice(0, 15))}
                className="bg-[#0b1220] border-gray-700/70 text-white h-11 rounded-xl"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 text-sm">Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="bg-[#0b1220] border-gray-700/70 text-white h-11 rounded-xl"
                type="tel"
              />
            </div>
          </div>

          <div className="bg-[#0b1220] rounded-xl p-4 border border-gray-800/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-400" />
              <span className="text-white">Permitir llamadas</span>
            </div>

            <Switch
              checked={!!formData.allow_phone_calls}
              onCheckedChange={(checked) => updateField('allow_phone_calls', checked)}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-500 text-sm">Marca</Label>
              <Input
                value={formData.car_brand}
                onChange={(e) => updateField('car_brand', e.target.value)}
                className="bg-[#0b1220] border-gray-700/70 text-white h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 text-sm">Modelo</Label>
              <Input
                value={formData.car_model}
                onChange={(e) => updateField('car_model', e.target.value)}
                className="bg-[#0b1220] border-gray-700/70 text-white h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-500 text-sm">Color</Label>

              <Select
                value={formData.car_color}
                onValueChange={(v) => updateField('car_color', v)}
              >
                <SelectTrigger className="bg-[#0b1220] border-gray-700/70 text-white h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="bg-[#0b1220] border-gray-700/70">
                  {carColors.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <CarIconTiny fill={c.fill} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500 text-sm">Vehículo</Label>

              <Select
                value={formData.vehicle_type}
                onValueChange={(v) => updateField('vehicle_type', v)}
              >
                <SelectTrigger className="bg-[#0b1220] border-gray-700/70 text-white h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="bg-[#0b1220] border-gray-700/70">
                  <SelectItem value="car" className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <VehicleIconTiny type="car" />
                      Coche normal
                    </div>
                  </SelectItem>

                  <SelectItem value="suv" className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <VehicleIconTiny type="suv" />
                      Coche voluminoso
                    </div>
                  </SelectItem>

                  <SelectItem value="van" className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <VehicleIconTiny type="van" />
                      Furgoneta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-500 text-sm">Matrícula</Label>
            <Input
              value={formData.car_plate}
              onChange={(e) => updateField('car_plate', e.target.value.toUpperCase().replace(/\s+/g, ''))}
              className="bg-[#0b1220] border-gray-700/70 text-white h-12 rounded-xl font-mono text-center tracking-widest uppercase"
              maxLength={7}
            />
          </div>

        </div>
      </main>

      <BottomNav mode="profile" />
    </div>
  );
}