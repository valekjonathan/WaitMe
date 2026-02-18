import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
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
  { value: 'gris', label: 'Gris', fill: '#6b7280' },
];

export default function Profile() {
  const navigate = useNavigate();
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
    allow_phone_calls: false,
  });

  const [photoSrc, setPhotoSrc] = useState('');

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
      allow_phone_calls: user.allow_phone_calls || false,
    });
    setHydrated(true);
  }, [user, hydrated]);

  useEffect(() => {
    const url = formData.photo_url;
    if (!url) return;
    const img = new Image();
    img.src = url;
    setPhotoSrc(url);
  }, [formData.photo_url]);

  const autoSave = async (data) => {
    try {
      await base44.auth.updateMe(data);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  const selectedColor =
    carColors.find((c) => c.value === formData.car_color) || carColors[5];

  const formatPlate = useMemo(() => {
    return (value = '') => {
      const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const a = clean.slice(0, 4);
      const b = clean.slice(4, 7);
      return b ? `${a} ${b}` : a;
    };
  }, []);

  const handlePlateChange = (raw) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    updateField('car_plate', clean);
  };

  // ---------- ICONOS (mismos arriba y abajo) ----------

  const VehicleIcon = ({ type, color = selectedColor.fill, size = 'w-16 h-10' }) => {
    const commonProps = {
      viewBox: '0 0 48 24',
      className: size,
      fill: 'none',
    };

    if (type === 'suv') {
      return (
        <svg {...commonProps}>
          <path d="M6 18 V13 L9.5 10.8 L16 8.8 H28.5 L36.5 10.8 L42 14.2 L43 18 H6 Z"
            fill={color} stroke="white" strokeWidth="1.5" />
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        </svg>
      );
    }

    if (type === 'van') {
      return (
        <svg {...commonProps}>
          <path d="M4 18 V12 L8 10 H32 L40 12 L44 15 V18 H4 Z"
            fill={color} stroke="white" strokeWidth="1.5" />
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        </svg>
      );
    }

    return (
      <svg {...commonProps}>
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
          fill={color} stroke="white" strokeWidth="1.5" />
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
      </svg>
    );
  };

  const vehicleLabel = (type) => {
    if (type === 'suv') return 'Voluminoso';
    if (type === 'van') return 'Furgoneta';
    return 'Normal';
  };

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <Header title="Mi Perfil" showBackButton backTo="Home" />

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto h-screen">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* TARJETA */}
          <div className="mt-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
            <div className="flex gap-4">

              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {formData.photo_url ? (
                    <img
                      src={photoSrc}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold">
                  {formData.display_name}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    {formData.car_brand} {formData.car_model}
                  </p>
                  <VehicleIcon type={formData.vehicle_type} />
                </div>

                <div className="mt-2 flex items-center">
                  <div className="bg-white rounded-md flex items-center border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-2 text-black font-mono font-bold text-sm">
                      {formatPlate(formData.car_plate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="grid grid-cols-2 gap-3">

            <div>
              <Label>Color</Label>
              <Select
                value={formData.car_color}
                onValueChange={(value) => updateField('car_color', value)}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white" />
                <SelectContent side="top" className="bg-gray-900 border-gray-700">
                  {carColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      {color.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Vehículo</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => updateField('vehicle_type', value)}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <div className="flex items-center gap-2">
                    <VehicleIcon type={formData.vehicle_type} size="w-6 h-4" />
                    {vehicleLabel(formData.vehicle_type)}
                  </div>
                </SelectTrigger>

                <SelectContent side="top" className="bg-gray-900 border-gray-700">
                  <SelectItem value="car">
                    <div className="flex items-center gap-2">
                      <VehicleIcon type="car" size="w-6 h-4" />
                      Normal
                    </div>
                  </SelectItem>

                  <SelectItem value="suv">
                    <div className="flex items-center gap-2">
                      <VehicleIcon type="suv" size="w-6 h-4" />
                      Voluminoso
                    </div>
                  </SelectItem>

                  <SelectItem value="van">
                    <div className="flex items-center gap-2">
                      <VehicleIcon type="van" size="w-6 h-4" />
                      Furgoneta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}