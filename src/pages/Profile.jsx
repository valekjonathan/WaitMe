import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useLayoutHeader, useSetProfileFormData } from '@/lib/LayoutContext';
import { isProfileComplete, getMissingProfileFields, toProfilePayload } from '@/lib/profile';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

function normalizeAvatarPath(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (!s) return "";
  if (s.startsWith("avatars/")) return s.slice("avatars/".length);
  return s;
}

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
  const { user, profile, setProfile } = useAuth();
  const setHeader = useLayoutHeader();
  const setProfileFormData = useSetProfileFormData();
  const [hydrated, setHydrated] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    brand: '',
    model: '',
    color: 'gris',
    vehicle_type: 'car',
    plate: '',
    avatar_url: '',
    phone: '',
    allow_phone_calls: false,
    notifications_enabled: true,
    email_notifications: true,
  });

  let raw =
    formData?.avatar_url ||
    profile?.avatar_url ||
    "";

  raw = String(raw || "").trim();

  let avatarSrc = raw;

  if (avatarSrc && !avatarSrc.startsWith("http") && !avatarSrc.startsWith("data:")) {
    const path = normalizeAvatarPath(avatarSrc);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarSrc = data?.publicUrl || "";
  }

  const nameForInitial =
    (formData?.full_name ||
     profile?.full_name ||
     "").trim();

  const initial = (nameForInitial ? nameForInitial[0] : "?").toUpperCase();

  useEffect(() => {
    if (!profile || hydrated) return;
    setFormData({
      full_name: profile.full_name || '',
      brand: profile.brand || '',
      model: profile.model || '',
      color: profile.color || 'gris',
      vehicle_type: profile.vehicle_type || 'car',
      plate: profile.plate || '',
      avatar_url: profile.avatar_url || '',
      phone: profile.phone || '',
      allow_phone_calls: profile.allow_phone_calls || false,
      notifications_enabled: profile.notifications_enabled !== false,
      email_notifications: profile.email_notifications !== false,
    });
    setHydrated(true);
  }, [profile, hydrated]);

  useEffect(() => {
    if (!user?.id || !hydrated) return;
    const save = async () => {
      try {
        const payload = toProfilePayload(formData);
        const { data, error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', user.id)
          .select()
          .single();
        if (!error && data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error guardando:', error);
      }
    };
    save();
  }, [formData, user?.id, hydrated, setProfile]);

  useEffect(() => {
    setProfileFormData(formData);
    return () => setProfileFormData(null);
  }, [formData, setProfileFormData]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      updateField('avatar_url', urlData.publicUrl);
    } catch (error) {
      console.error('Error subiendo foto:', error);
    }
  };

  const handleBack = useCallback(async () => {
    const missing = getMissingProfileFields(formData);
    if (missing.length) {
      alert(`Debes rellenar: ${missing.join(", ")}`);
      return;
    }
    try {
      const payload = toProfilePayload(formData);
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select()
        .single();
      if (!error && data) {
        setProfile(data);
        navigate('/');
      }
    } catch (error) {
      console.error('Error guardando:', error);
    }
  }, [formData, user?.id, navigate, setProfile]);

  useEffect(() => {
    setHeader({ showBackButton: true, onBack: handleBack });
    return () => setHeader({ onBack: null });
  }, [handleBack, setHeader]);

  const selectedColor = carColors.find((c) => c.value === formData.color) || carColors[5];

  const formatPlate = useMemo(() => {
    return (value = '') => {
      const clean = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const a = clean.slice(0, 4);
      const b = clean.slice(4, 7);
      return b ? `${a} ${b}`.trim() : a;
    };
  }, []);

  const handlePlateChange = (raw) => {
    const clean = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    updateField('plate', clean);
  };

  const VehicleIconProfile = ({ type, color, size = 'w-16 h-10' }) => {
    if (type === 'suv') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none" aria-label="Todoterreno">
          <path
            d="M6 18 V13 L9.5 10.8 L16 8.8 H28.5 L36.5 10.8 L42 14.2 L43 18 H6 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M16.8 9.6 L19.2 12.6 H28.2 L30.4 9.6 Z"
            fill="rgba(255,255,255,0.22)"
            stroke="white"
            strokeWidth="0.5"
          />
          <path d="M29.1 9.6 V12.6" stroke="white" strokeWidth="0.5" opacity="0.6" />
          <path d="M42.7 15.6 H41.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="14.2" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="14.2" cy="18" r="2" fill="#666" />
          <circle cx="35.6" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="35.6" cy="18" r="2" fill="#666" />
        </svg>
      );
    }

    if (type === 'van') {
      return (
        <svg viewBox="0 0 48 24" className={size} fill="none" aria-label="Furgoneta">
          <path
            d="M4 18 V12.8 L7.5 10.8 L14 8.8 H32.2 L40.2 10.2 L45.6 13.8 L46 18 H4 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 9.6 L18 12.6 H31.2 L33.2 9.6 Z"
            fill="rgba(255,255,255,0.22)"
            stroke="white"
            strokeWidth="0.5"
          />
          <path d="M24.2 9.6 V12.6" stroke="white" strokeWidth="0.5" opacity="0.6" />
          <path d="M12.4 12.8 V18" stroke="white" strokeWidth="0.6" opacity="0.45" />
          <path d="M33.8 12.6 V18" stroke="white" strokeWidth="0.6" opacity="0.45" />
          <path d="M46 15.6 H44.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="13.6" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="13.6" cy="18" r="2" fill="#666" />
          <circle cx="37.6" cy="18" r="3.8" fill="#333" stroke="white" strokeWidth="1" />
          <circle cx="37.6" cy="18" r="2" fill="#666" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 48 24" className={size} fill="none" aria-label="Coche">
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

  const CarIconSmall = ({ color }) => (
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none" aria-hidden="true">
      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );

  const vehicleLabel = (t) => {
    if (t === 'suv') return 'Voluminoso';
    if (t === 'van') return 'Furgoneta';
    return 'Normal';
  };

  const VehicleIconSmall = ({ type }) => (
    <VehicleIconProfile
      type={type}
      color={selectedColor?.fill}
      size="w-6 h-4"
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4">
      <div className="flex flex-col items-center pt-6 pb-6">
        <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Tarjeta tipo DNI */}
          <div className="mt-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
            <div className="flex gap-4">
              {/* Foto */}
              <div className="relative">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                  {avatarSrc ? (
                    <img
                      key={avatarSrc}
                      src={avatarSrc}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-2xl font-semibold">{initial}</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Info */}
              <div className="pl-3 flex-1 flex flex-col justify-between">
                <p className="text-xl font-bold text-white">
                  {formData.full_name || profile?.full_name}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {formData.brand || 'Sin'} {formData.model || 'coche'}
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
                      {formData.plate ? `${formData.plate.slice(0, 4)} ${formData.plate.slice(4)}`.trim() : '0000 XXX'}
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
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value.slice(0, 15))}
                  placeholder="Tu nombre"
                  className="bg-gray-900 border-gray-700 text-white h-9"
                  maxLength={15}
                />
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
                  value={formData.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Seat, Renault..."
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Modelo</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  placeholder="Ibiza, Megane..."
                  className="bg-gray-900 border-gray-700 text-white h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Color</Label>
                <Select value={formData.color} onValueChange={(value) => updateField('color', value)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
                    {carColors.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <CarIconSmall color={color.fill} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-400 text-sm">Vehículo</Label>
                <Select value={formData.vehicle_type || 'car'} onValueChange={(value) => updateField('vehicle_type', value)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <div className="flex items-center gap-2">
                      <VehicleIconSmall type={formData.vehicle_type || 'car'} />
                      <span className="text-white">{vehicleLabel(formData.vehicle_type || 'car')}</span>
                    </div>
                  </SelectTrigger>

                  <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
                    <SelectItem value="car" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <VehicleIconSmall type="car" />
                        Normal
                      </div>
                    </SelectItem>

                    <SelectItem value="suv" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <VehicleIconSmall type="suv" />
                        Voluminoso
                      </div>
                    </SelectItem>

                    <SelectItem value="van" className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <VehicleIconSmall type="van" />
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
                  value={formatPlate(formData.plate)}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="1234 ABC"
                className="bg-gray-900 border-gray-700 text-white font-mono uppercase text-center h-9"
                maxLength={8}
              />
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
