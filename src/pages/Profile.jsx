import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Camera, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    display_name: '',
    car_brand: '',
    car_model: '',
    car_color: 'gris',
    car_plate: '',
    photo_url: ''
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
          car_color: currentUser.car_color || 'gris',
          car_plate: currentUser.car_plate || '',
          photo_url: currentUser.photo_url || ''
        });
      } catch (error) {
        console.log('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleBack = async () => {
    await base44.auth.updateMe(formData);
    navigate(createPageUrl('Home'));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, photo_url: file_url });
      } catch (error) {
        console.error('Error subiendo foto:', error);
      }
    }
  };

  const selectedColor = carColors.find(c => c.value === formData.car_color) || carColors[5];

  const CarIcon = ({ color }) => (
    <svg viewBox="0 0 24 24" className="w-10 h-10" fill={color} stroke="white" strokeWidth="1.5">
      <path d="M5 11l1.5-4.5h11L19 11M5 11v6h2m-2-6h14m0 0v6h-2m2-6H5m12 6v2h-2v-2m-8 0v2H5v-2m2 0h10" />
      <circle cx="7.5" cy="14.5" r="1.5" fill="white" />
      <circle cx="16.5" cy="14.5" r="1.5" fill="white" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" className="text-white" onClick={handleBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Mi Perfil</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Tarjeta tipo DNI */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex gap-4">
              {/* Foto */}
              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
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
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-xl font-bold text-white">{formData.display_name || user?.full_name?.split(' ')[0]}</p>
                
                <div className="mt-4 flex items-center gap-3">
                  <CarIcon color={selectedColor?.fill} />
                  <div>
                    <p className="text-white font-medium text-sm">
                      {formData.car_brand || 'Sin'} {formData.car_model || 'coche'}
                    </p>
                    <p className="text-gray-400 text-xs font-mono">
                      {formData.car_plate || '----XXX'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Nombre editable */}
            <div className="space-y-2">
              <Label className="text-gray-400">Nombre (máx. 15 caracteres)</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value.slice(0, 15) })}
                placeholder="Tu nombre"
                className="bg-gray-900 border-gray-700 text-white"
                maxLength={15}
              />
            </div>

            <h2 className="text-lg font-semibold flex items-center justify-center gap-2 pt-2">
              <Car className="w-5 h-5 text-purple-500" />
              Datos del vehículo
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Marca</Label>
                <Input
                  value={formData.car_brand}
                  onChange={(e) => setFormData({ ...formData, car_brand: e.target.value })}
                  placeholder="Seat, Renault..."
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Modelo</Label>
                <Input
                  value={formData.car_model}
                  onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
                  placeholder="Ibiza, Megane..."
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Color</Label>
              <Select 
                value={formData.car_color} 
                onValueChange={(value) => setFormData({ ...formData, car_color: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {carColors.map((color) => (
                    <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <CarIcon color={color.fill} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Matrícula</Label>
              {/* Placa de matrícula */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-blue-600 rounded-l-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">E</span>
                </div>
                <Input
                  value={formData.car_plate}
                  onChange={(e) => setFormData({ ...formData, car_plate: e.target.value.toUpperCase() })}
                  placeholder="1234 ABC"
                  className="bg-white text-black font-mono uppercase text-center text-lg font-bold pl-10 pr-4 py-6 rounded-md border-2 border-gray-400"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}