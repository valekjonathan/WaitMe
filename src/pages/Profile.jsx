import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const carColors = [
  { value: 'blanco', label: 'Blanco', fill: '#FFFFFF' },
  { value: 'negro', label: 'Negro', fill: '#1a1a1a' },
  { value: 'rojo', label: 'Rojo', fill: '#ef4444' },
  { value: 'azul', label: 'Azul', fill: '#3b82f6' },
  { value: 'verde', label: 'Verde', fill: '#22c55e' },
  { value: 'gris', label: 'Gris', fill: '#6b7280' }
];

export default function Profile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    vehicle_type: 'car',
    car_brand: '',
    car_model: '',
    car_color: 'gris',
    car_plate: '',
    photo_url: '',
    phone: '',
    allow_phone_calls: false,
    notifications_enabled: true,
    email_notifications: true
  });

  // Cargar datos del usuario al montar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          setFormData({
            name: currentUser.name || '',
            vehicle_type: currentUser.vehicle_type || 'car',
            car_brand: currentUser.car_brand || '',
            car_model: currentUser.car_model || '',
            car_color: currentUser.car_color || 'gris',
            car_plate: currentUser.car_plate || '',
            photo_url: currentUser.photo_url || '',
            phone: currentUser.phone || '',
            allow_phone_calls: !!currentUser.allow_phone_calls,
            notifications_enabled: !!currentUser.notifications_enabled,
            email_notifications: !!currentUser.email_notifications
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };
    fetchUserProfile();
  }, []);

  const selectedColor = carColors.find(c => c.value === formData.car_color) || carColors[5];

  // Componente de icono de coche (cambia según tipo de vehículo)
  const CarIconProfile = ({ type = 'car', color, size = "w-16 h-10" }) => {
    if (type === 'suv') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none">
          {/* Cuerpo del SUV - vista lateral */}
          <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
          {/* Ventanas */}
          <path d="M16 7 L18 10 L30 10 L32 7 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
          {/* Rueda trasera */}
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14" cy="18" r="2" fill="#666" />
          {/* Rueda delantera */}
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="2" fill="#666" />
        </svg>
      );
    } else if (type === 'van') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none">
          {/* Cuerpo de la furgoneta - vista lateral */}
          <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill={color} stroke="white" strokeWidth="1.5" />
          {/* Ventanas */}
          <rect x="8" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
          <rect x="18" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
          <rect x="28" y="9" width="8" height="6" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="0.5" />
          {/* Rueda trasera */}
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14" cy="18" r="2" fill="#666" />
          {/* Rueda delantera */}
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="2" fill="#666" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none">
          {/* Cuerpo del coche - vista lateral */}
          <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
          {/* Ventanas */}
          <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5" />
          {/* Rueda trasera */}
          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14" cy="18" r="2" fill="#666" />
          {/* Rueda delantera */}
          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="36" cy="18" r="2" fill="#666" />
        </svg>
      );
    }
  };

  // Función para actualizar campos del formulario
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mutation para guardar los cambios del perfil
  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      const currentUser = await base44.auth.me();
      if (!currentUser) throw new Error('User not authenticated');
      // Actualizar entidad de usuario en Base44
      return base44.entities.User.update(currentUser.id, data);
    },
    onSuccess: () => {
      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      console.error('Error guardando perfil:', error);
      alert('No se pudieron guardar los cambios. Intenta de nuevo.');
    }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Perfil" />
      <main className="pt-4 px-4 pb-[88px]">
        {/* Formulario de edición de perfil */}
        <div className="space-y-6">
          {/* Nombre */}
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Tu nombre"
              className="mt-1"
            />
          </div>

          {/* Vehículo (tipo, marca, modelo) */}
          <div>
            <Label>Vehículo</Label>
            <div className="flex items-center gap-2">
              {/* Tipo de vehículo */}
              <Select
                value={formData.vehicle_type || 'car'}
                onValueChange={(value) => updateField('vehicle_type', value)}
              >
                <SelectTrigger className="w-32 bg-gray-800 border border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 text-white">
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
                        <path d="M8 14 L10 8 L16 6 L32 6 L38 8 L42 12 L42 18 L8 18 Z" fill="#6b7280" stroke="white" strokeWidth="1.5" />
                        <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                        <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                      </svg>
                      SUV
                    </div>
                  </SelectItem>
                  <SelectItem value="van" className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-4" viewBox="0 0 48 24" fill="none">
                        <path d="M6 8 L6 18 L42 18 L42 10 L38 8 Z" fill="#6b7280" stroke="white" strokeWidth="1.5" />
                        <rect x="8" y="10" width="32" height="4" fill="#6b7280" />
                        <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                        <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
                      </svg>
                      Furgoneta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Marca */}
              <Input
                type="text"
                value={formData.car_brand}
                onChange={e => updateField('car_brand', e.target.value)}
                placeholder="Marca"
                className="w-32 bg-gray-800 border border-gray-700 text-white"
              />

              {/* Modelo */}
              <Input
                type="text"
                value={formData.car_model}
                onChange={e => updateField('car_model', e.target.value)}
                placeholder="Modelo"
                className="flex-1 bg-gray-800 border border-gray-700 text-white"
              />

              {/* Icono del vehículo */}
              <CarIconProfile type={formData.vehicle_type} color={selectedColor?.fill} />
            </div>
          </div>

          {/* Color (selección) */}
          <div>
            <Label>Color del vehículo</Label>
            <Select
              value={formData.car_color}
              onValueChange={(value) => updateField('car_color', value)}
            >
              <SelectTrigger className="w-full bg-gray-800 border border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 text-white">
                {carColors.map(color => (
                  <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border border-white`} style={{ backgroundColor: color.fill }} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Matrícula */}
          <div>
            <Label htmlFor="car_plate">Matrícula <span className="text-gray-500">(opcional)</span></Label>
            <Input
              id="car_plate"
              type="text"
              value={formData.car_plate}
              onChange={e => updateField('car_plate', e.target.value)}
              placeholder="1234 ABC"
              className="mt-1"
            />
          </div>

          {/* Teléfono de contacto */}
          <div>
            <Label htmlFor="phone">Teléfono de contacto <span className="text-gray-500">(opcional)</span></Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="Tu teléfono"
              className="mt-1"
            />
            <div className="flex items-center gap-2 mt-2">
              <Switch
                id="allow_phone_calls"
                checked={formData.allow_phone_calls}
                onCheckedChange={checked => updateField('allow_phone_calls', checked)}
              />
              <Label htmlFor="allow_phone_calls" className="text-sm text-gray-300">
                Permitir que me llamen por teléfono
              </Label>
            </div>
          </div>

          {/* Notificaciones */}
          <div>
            <Label>Notificaciones</Label>
            <div className="flex items-center gap-2 mt-1">
              <Switch
                id="notifications_enabled"
                checked={formData.notifications_enabled}
                onCheckedChange={checked => updateField('notifications_enabled', checked)}
              />
              <Label htmlFor="notifications_enabled" className="text-sm text-gray-300">
                Recibir notificaciones push en el móvil
              </Label>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Switch
                id="email_notifications"
                checked={formData.email_notifications}
                onCheckedChange={checked => updateField('email_notifications', checked)}
              />
              <Label htmlFor="email_notifications" className="text-sm text-gray-300">
                Recibir notificaciones también por correo electrónico
              </Label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gray-700"
              onClick={() => navigate(createPageUrl('Home'))}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => saveProfileMutation.mutate(formData)}
              disabled={saveProfileMutation.isPending}
            >
              {saveProfileMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}