import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData({
          display_name: currentUser.display_name || currentUser.full_name?.split(' ')[0] || '',
          car_brand: currentUser.car_brand || '',
          car_model: currentUser.car_model || '',
          car_color: currentUser.car_color || 'negro',
          vehicle_type: currentUser.vehicle_type || 'car',
          car_plate: currentUser.car_plate || '',
          photo_url: currentUser.photo_url || '',
          phone: currentUser.phone || '',
          allow_phone_calls: currentUser.allow_phone_calls || false
        });
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
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

  const selectedColor = carColors.find(c => c.value === formData.car_color) || carColors[1];

  const CarIcon = ({ size = "w-20 h-12" }) => (
    <svg viewBox="0 0 48 24" className={size} fill="none">
      <path
        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
        fill={selectedColor.fill}
        stroke="white"
        strokeWidth="1.5"
      />
      <circle cx="14" cy="18" r="4" fill="#222" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="4" fill="#222" stroke="white" strokeWidth="1" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-purple-500 animate-pulse">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <Header title="Mi Perfil" showBackButton backTo="Home" />

      <main className="pt-[69px] pb-24 px-4 max-w-md mx-auto h-full overflow-y-auto">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* TARJETA PERFIL EXACTA */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 shadow-[0_0_30px_rgba(168,85,247,0.35)]">
            <div className="bg-gradient-to-br from-[#111827] to-[#1f2937] rounded-2xl p-5">
              <div className="flex gap-5">

                {/* FOTO */}
                <div className="relative">
                  <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-purple-500 shadow-md bg-gray-800">
                    {formData.photo_url ? (
                      <img src={formData.photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
                    )}
                  </div>

                  <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-purple-700">
                    <Camera className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {/* INFO */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-2xl font-extrabold tracking-wide">{formData.display_name}</p>
                    <p className="text-gray-300 mt-1 text-base">
                      {formData.car_brand} {formData.car_model}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="bg-white rounded-md flex items-center overflow-hidden border border-gray-400 h-8">
                      <div className="bg-blue-700 h-full w-6 flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">E</span>
                      </div>
                      <span className="px-3 text-black font-mono font-bold text-base tracking-widest">
                        {formData.car_plate
                          ? `${formData.car_plate.slice(0, 4)} ${formData.car_plate.slice(4)}`
                          : '0000 XXX'}
                      </span>
                    </div>

                    <CarIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CAMPOS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 text-sm">Nombre</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                className="bg-[#0f172a] border-[#1e293b] text-white h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="bg-[#0f172a] border-[#1e293b] text-white h-11 rounded-xl"
              />
            </div>
          </div>

          {/* PERMITIR LLAMADAS EXACTO */}
          <div className="bg-[#0f172a] rounded-xl p-4 border border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-400" />
              <p className="text-base">Permitir llamadas</p>
            </div>
            <Switch
              checked={formData.allow_phone_calls}
              onCheckedChange={(checked) => updateField('allow_phone_calls', checked)}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
            />
          </div>

          {/* MARCA / MODELO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 text-sm">Marca</Label>
              <Input
                value={formData.car_brand}
                onChange={(e) => updateField('car_brand', e.target.value)}
                className="bg-[#0f172a] border-[#1e293b] text-white h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-sm">Modelo</Label>
              <Input
                value={formData.car_model}
                onChange={(e) => updateField('car_model', e.target.value)}
                className="bg-[#0f172a] border-[#1e293b] text-white h-11 rounded-xl"
              />
            </div>
          </div>

          {/* MATRÍCULA */}
          <div>
            <Label className="text-gray-400 text-sm">Matrícula</Label>
            <Input
              value={formData.car_plate}
              onChange={(e) => updateField('car_plate', e.target.value.toUpperCase())}
              className="bg-[#0f172a] border-[#1e293b] text-white h-12 rounded-xl text-center font-mono tracking-widest"
            />
          </div>

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}