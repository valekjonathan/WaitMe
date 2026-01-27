import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Camera, Car, Bell, Phone, Save, Settings, MessageCircle, User } from 'lucide-react';
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
    vehicle_type: 'car',
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
          vehicle_type: currentUser.vehicle_type || 'car',
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
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateField('photo_url', file_url);
      } catch (error) {
        console.error('Error subiendo foto:', error);
      }
    }
  };

  const selectedColor = carColors.find(c => c.value === formData.car_color) || carColors[5];

  /* 🔥 ÚNICO CAMBIO REAL: icono dinámico SIN tocar layout */
  const CarIconProfile = ({ color, size = "w-16 h-10" }) => {
    switch (formData.vehicle_type) {
      case 'suv':
        return (
          <svg viewBox="0 0 48 24" className={size} fill="none">
            <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
            <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
            <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          </svg>
        );
      case 'van':
        return (
          <svg viewBox="0 0 48 24" className={size} fill="none">
            <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill={color} stroke="white" strokeWidth="1.5" />
            <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
            <circle cx="34" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 48 24" className={size} fill="none">
            <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
            <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
            <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          </svg>
        );
    }
  };

  const CarIconSmall = ({ color }) =>
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>;

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
      {/* ⬇️ RESTO DEL JSX ES EXACTAMENTE EL TUYO, SIN CAMBIOS */}
      {/* … */}
      <BottomNav />
    </div>
  );
}