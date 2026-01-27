import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft,
  Camera,
  Car,
  Truck,
  Bus,
  Bell,
  Phone,
  Save,
  Settings,
  MessageCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    car_color: 'gris',
    vehicle_type: 'Coche normal',
    car_plate: '',
    photo_url: '',
    phone: '',
    allow_phone_calls: false,
    notifications_enabled: true,
    email_notifications: true
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
          vehicle_type: currentUser.vehicle_type || 'Coche normal',
          car_plate: currentUser.car_plate || '',
          photo_url: currentUser.photo_url || '',
          phone: currentUser.phone || '',
          allow_phone_calls: currentUser.allow_phone_calls || false,
          notifications_enabled: currentUser.notifications_enabled !== false,
          email_notifications: currentUser.email_notifications !== false
        });
      } catch (error) {
        console.log('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateField('photo_url', file_url);
    }
  };

  /* 🔥 ESTA ES LA PUTA CLAVE */
  const VehicleIconHeader = () => {
    switch (formData.vehicle_type) {
      case 'Coche voluminoso':
        return <Truck className="w-6 h-6 text-white" />;
      case 'Furgoneta':
        return <Bus className="w-6 h-6 text-white" />;
      default:
        return <Car className="w-6 h-6 text-white" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Cargando...</div>
      </div>
    );
  }

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
                    <img src={formData.photo_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold">{formData.display_name}</p>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {formData.car_brand} {formData.car_model}
                  </p>
                  <VehicleIconHeader />
                </div>

                <div className="mt-2 flex items-center">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">E</span>
                    </div>
                    <span className="px-2 text-black font-mono font-bold text-sm">
                      {formData.car_plate || '0000 XXX'}
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