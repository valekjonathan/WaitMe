import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      setFormData({
        display_name: currentUser.display_name || '',
        car_brand: currentUser.car_brand || '',
        car_model: currentUser.car_model || '',
        car_color: currentUser.car_color || 'gris',
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

  const autoSave = async (data) => {
    await base44.auth.updateMe(data);
  };

  const updateField = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    autoSave(newData);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('photo_url', file_url);
  };

  const selectedColor =
    carColors.find((c) => c.value === formData.car_color) || carColors[5];

  const VehicleIcon = () => {
    if (formData.vehicle_type === 'suv') {
      return (
        <svg viewBox="0 0 48 24" className="w-20 h-12">
          <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z"
            fill={selectedColor.fill}
            stroke="white"
            strokeWidth="1.5" />
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        </svg>
      );
    }

    if (formData.vehicle_type === 'van') {
      return (
        <svg viewBox="0 0 48 24" className="w-20 h-10">
          <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z"
            fill={selectedColor.fill}
            stroke="white"
            strokeWidth="1.5" />
          <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="34" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 48 24" className="w-20 h-10">
        <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
          fill={selectedColor.fill}
          stroke="white"
          strokeWidth="1.5" />
        <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      </svg>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500">Cargando...</div>;
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <Header title="Mi Perfil" showBackButton={true} backTo="Home" />

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* TARJETA JONATHAN EXACTA */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 border border-purple-500 shadow-xl">
            <div className="flex gap-5">

              {/* FOTO GRANDE */}
              <div className="relative">
                <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* INFO */}
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-2xl font-bold">
                  {formData.display_name || user?.full_name?.split(' ')[0]}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-300">
                    {formData.car_brand || 'Sin'} {formData.car_model || 'coche'}
                  </p>
                  <VehicleIcon />
                </div>

                {/* MATRÍCULA REAL */}
                <div className="mt-3">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-8">
                    <div className="bg-blue-600 h-full w-6 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">E</span>
                    </div>
                    <span className="px-3 text-black font-mono font-bold tracking-widest">
                      {formData.car_plate
                        ? `${formData.car_plate.slice(0, 4)} ${formData.car_plate.slice(4)}`
                        : '0000 XXX'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}