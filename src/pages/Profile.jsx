import React, { useState, useEffect, useMemo } from 'react';
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
{ value: 'gris', label: 'Gris', fill: '#6b7280' }];


export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
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
    notifications_enabled: true,
    email_notifications: true
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
      allow_phone_calls: user.allow_phone_calls || false,
      notifications_enabled: user.notifications_enabled !== false,
      email_notifications: user.email_notifications !== false
    });
    setHydrated(true);
  }, [user, hydrated]);

  // Pre-carga de la foto para que sea instantánea al entrar.
  useEffect(() => {
    const url = formData.photo_url || user?.photo_url;
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, [formData.photo_url, user?.photo_url]);

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
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateField('photo_url', file_url);
      } catch (error) {
        console.error('Error subiendo foto:', error);
      }
    }
  };

  const selectedColor = carColors.find((c) => c.value === formData.car_color) || carColors[5];

  const formatPlate = useMemo(() => {
    return (value = '') => {
      const clean = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const a = clean.slice(0, 4);
      const b = clean.slice(4, 8);
      return b ? `${a} ${b}`.trim() : a;
    };
  }, []);

  const handlePlateChange = (raw) => {
    const clean = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    updateField('car_plate', clean);
  };

  const VehicleIconProfile = ({ type, color, size = "w-16 h-10" }) => {
    if (type === 'suv') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none">
          {/* SUV (morro a la derecha) con el mismo estilo del coche normal */}
          <path
            d="M7 16 L10 9.5 L17 7.5 L31 7.5 L38.5 10 L42 13.5 L42 18 L7 18 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
          <path d="M16 8.2 L18 12 L29.5 12 L31.2 8.2 Z" fill="rgba(255,255,255,0.28)" stroke="white" strokeWidth="0.5" />
          <circle cx="14" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14" cy="18" r="2" fill="#666" />
          <circle cx="36" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="2" fill="#666" />
        </svg>
      );
    }

    if (type === 'van') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none">
          {/* Furgoneta tipo transporter (morro a la derecha), mismo estilo */}
          <path
            d="M6 18 V10.5 L15 10.5 L19 7.2 H33.5 L42 11.2 V18 H6 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M16 9 L18 12 L27 12 L28.5 9 Z" fill="rgba(255,255,255,0.24)" stroke="white" strokeWidth="0.5" />
          <path d="M29.5 9 L31 12 L38 12 L38 10.3 L33.5 9 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="0.5" />
          <circle cx="14" cy="18" r="3.6" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14" cy="18" r="2" fill="#666" />
          <circle cx="34" cy="18" r="3.6" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="34" cy="18" r="2" fill="#666" />
        </svg>
      );
    }

    // car (default)
    return (
      <svg viewBox="0 0 48 24" className={size} fill="none">
        <path
          d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
        <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
        <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="14" cy="18" r="2" fill="#666" />
        <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
        <circle cx="36" cy="18" r="2" fill="#666" />
      </svg>
    );
  };


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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4">

          {/* Tarjeta tipo DNI */}
          {/* +4px de separación negra respecto a la línea del menú superior */}
          <div className="mt-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
            <div className="flex gap-4">
              {/* Foto */}
              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {formData.photo_url ?
                  <img
                    src={formData.photo_url}
                    alt="Perfil"
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                  /> :


                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                      👤
                    </div>
                  }
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload} />

                </label>
              </div>

              {/* Info */}
              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold text-white">{formData.display_name || user?.full_name?.split(' ')[0]}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {formData.car_brand || 'Sin'} {formData.car_model || 'coche'}
                    </p>
                  </div>
                  <VehicleIconProfile type={formData.vehicle_type || 'car'} color={selectedColor?.fill} />
                </div>

                {/* Matrícula estilo placa */}
                <div className="mt-2 flex items-center">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                      {formData.car_plate ? 
                        `${formData.car_plate.slice(0, 4)} ${formData.car_plate.slice(4)}`.trim() : 
                        '0000 XXX'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-3">
            {/* Nombre y Teléfono en la misma fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Nombre</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => updateField('display_name', e.target.value.slice(0, 15))}
                  placeholder="Tu nombre"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                  maxLength={15} />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+34 600 00 00"
                  className="bg-gray-900 border-gray-700 text-white h-9 text-sm"
                  type="tel"
                />
              </div>
            </div>

            {/* Permitir llamadas - compacto */}
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400" />
                <p className="text-sm text-white">Permitir llamadas</p>
              </div>
              <Switch
                checked={formData.allow_phone_calls}
                onCheckedChange={(checked) => updateField('allow_phone_calls', checked)}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Marca</Label>
                <Input
                  value={formData.car_brand}
                  onChange={(e) => updateField('car_brand', e.target.value)}
                  placeholder="Seat, Renault..."
                  className="bg-gray-900 border-gray-700 text-white h-9" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Modelo</Label>
                <Input
                  value={formData.car_model}
                  onChange={(e) => updateField('car_model', e.target.value)}
                  placeholder="Ibiza, Megane..."
                  className="bg-gray-900 border-gray-700 text-white h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Color</Label>
                <Select
                  value={formData.car_color}
                  onValueChange={(value) => updateField('car_color', value)}>

                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
                    {carColors.map((color) =>
                    <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <CarIconSmall color={color.fill} />
                          {color.label}
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Vehículo</Label>
                <Select
                  value={formData.vehicle_type || 'car'}
                  onValueChange={(value) => updateField('vehicle_type', value)}>

                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
                    <SelectItem value="car" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-4" viewBox="0 0 48 24" fill="none">
                          <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="#6b7280" stroke="white" strokeWidth="1.5" />
                          <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                          <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                        </svg>
                        Coche normal
                      </div>
                    </SelectItem>
                    <SelectItem value="suv" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-4" viewBox="0 0 48 24" fill="none">
                          <path d="M7 16 L10 9.5 L17 7.5 L31 7.5 L38.5 10 L42 13.5 L42 18 L7 18 Z" fill="#6b7280" stroke="white" strokeWidth="1.5" />
                          <path d="M16 8.2 L18 12 L29.5 12 L31.2 8.2 Z" fill="rgba(255,255,255,0.28)" stroke="white" strokeWidth="0.5" />
                          <circle cx="14" cy="18" r="3.6" fill="#333" stroke="white" strokeWidth="1" />
                          <circle cx="36" cy="18" r="3.6" fill="#333" stroke="white" strokeWidth="1" />
                        </svg>
                        Coche voluminoso
                      </div>
                    </SelectItem>
                    <SelectItem value="van" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-4" viewBox="0 0 48 24" fill="none">
                          <path d="M6 18 V10.5 L15 10.5 L19 7.2 H33.5 L42 11.2 V18 H6 Z" fill="#6b7280" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                          <path d="M16 9 L18 12 L27 12 L28.5 9 Z" fill="rgba(255,255,255,0.24)" stroke="white" strokeWidth="0.5" />
                          <path d="M29.5 9 L31 12 L38 12 L38 10.3 L33.5 9 Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="0.5" />
                          <circle cx="14" cy="18" r="3.2" fill="#333" stroke="white" strokeWidth="1" />
                          <circle cx="34" cy="18" r="3.2" fill="#333" stroke="white" strokeWidth="1" />
                        </svg>
                        Furgoneta
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-400 text-sm">Matrícula</Label>
              <Input
                value={formatPlate(formData.car_plate)}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="1234 ABC"
                className="bg-gray-900 border-gray-700 text-white font-mono uppercase text-center h-9"
                maxLength={8} />
            </div>
          </div>
        </motion.div>
        </main>

        <BottomNav />
        </div>);

        }