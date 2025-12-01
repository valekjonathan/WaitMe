import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Camera, Car, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

const carColors = [
  { value: 'negro', label: 'Negro', class: 'bg-gray-900' },
  { value: 'blanco', label: 'Blanco', class: 'bg-gray-100 border border-gray-300' },
  { value: 'gris', label: 'Gris', class: 'bg-gray-500' },
  { value: 'rojo', label: 'Rojo', class: 'bg-red-500' },
  { value: 'azul', label: 'Azul', class: 'bg-blue-500' },
  { value: 'verde', label: 'Verde', class: 'bg-green-500' },
  { value: 'amarillo', label: 'Amarillo', class: 'bg-yellow-400' },
  { value: 'naranja', label: 'Naranja', class: 'bg-orange-500' },
  { value: 'morado', label: 'Morado', class: 'bg-purple-500' },
  { value: 'marron', label: 'Marrón', class: 'bg-amber-800' },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setSaving(false);
    }
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

  const selectedColor = carColors.find(c => c.value === formData.car_color);

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
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
                <p className="text-xl font-bold text-white">{user?.full_name}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                
                <div className="mt-4 flex items-center gap-3">
                  <div className={`w-10 h-6 rounded ${selectedColor?.class}`}></div>
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
            <h2 className="text-lg font-semibold flex items-center gap-2">
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
                        <div className={`w-4 h-4 rounded ${color.class}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Matrícula</Label>
              <Input
                value={formData.car_plate}
                onChange={(e) => setFormData({ ...formData, car_plate: e.target.value.toUpperCase() })}
                placeholder="1234ABC"
                className="bg-gray-900 border-gray-700 text-white font-mono uppercase"
                maxLength={7}
              />
            </div>
          </div>

          {/* Botón guardar */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-6 text-lg font-semibold transition-all ${
              saved 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {saving ? (
              'Guardando...'
            ) : saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}