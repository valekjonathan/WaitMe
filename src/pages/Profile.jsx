import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Camera, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const carColors = [
  { value: 'blanco', label: 'Blanco', fill: '#FFFFFF' },
  { value: 'negro', label: 'Negro', fill: '#111111' },
  { value: 'rojo', label: 'Rojo', fill: '#ef4444' },
  { value: 'azul', label: 'Azul', fill: '#3b82f6' },
  { value: 'amarillo', label: 'Amarillo', fill: '#facc15' },
  { value: 'gris', label: 'Gris', fill: '#6b7280' }
];

const vehicleTypes = [
  { value: 'car', label: 'Coche normal' },
  { value: 'suv', label: 'Coche voluminoso' },
  { value: 'van', label: 'Furgoneta' }
];

function Plate({ plate }) {
  const safe = (plate || '').toUpperCase().replace(/\s+/g, '');
  const left = safe.slice(0, 4) || '0000';
  const right = safe.slice(4) || 'XXX';
  return (
    <div className="bg-white rounded-[10px] flex items-center overflow-hidden border-2 border-gray-300 h-[34px]">
      <div className="bg-blue-700 h-full w-[26px] flex items-center justify-center">
        <span className="text-white text-[10px] font-extrabold">E</span>
      </div>
      <span className="px-4 text-black font-mono font-extrabold text-[16px] tracking-[4px] leading-none">
        {left}&nbsp;&nbsp;{right}
      </span>
    </div>
  );
}

function VehicleIconOutline({ type = 'car', className = 'w-[64px] h-[36px]' }) {
  // Contorno blanco, como tu captura (sin fill)
  if (type === 'van') {
    return (
      <svg viewBox="0 0 64 32" className={className} fill="none">
        <path
          d="M8 12V24H56V14L50 12H8Z"
          stroke="white"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path d="M12 14H22V20H12V14Z" stroke="white" strokeWidth="1.6" opacity="0.55" />
        <path d="M24 14H34V20H24V14Z" stroke="white" strokeWidth="1.6" opacity="0.55" />
        <path d="M36 14H46V20H36V14Z" stroke="white" strokeWidth="1.6" opacity="0.55" />
        <circle cx="18" cy="24" r="4" stroke="white" strokeWidth="2.4" />
        <circle cx="46" cy="24" r="4" stroke="white" strokeWidth="2.4" />
      </svg>
    );
  }

  if (type === 'suv') {
    return (
      <svg viewBox="0 0 64 32" className={className} fill="none">
        <path
          d="M10 18L13 10L22 8H42L51 10L56 16V24H10V18Z"
          stroke="white"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path d="M20 10H30L28 16H18L20 10Z" stroke="white" strokeWidth="1.6" opacity="0.55" />
        <path d="M34 10H44L46 16H32L34 10Z" stroke="white" strokeWidth="1.6" opacity="0.55" />
        <circle cx="20" cy="24" r="4.2" stroke="white" strokeWidth="2.4" />
        <circle cx="46" cy="24" r="4.2" stroke="white" strokeWidth="2.4" />
      </svg>
    );
  }

  // car
  return (
    <svg viewBox="0 0 64 32" className={className} fill="none">
      <path
        d="M12 20L15 12L24 10H40L49 12L56 18V24H12V20Z"
        stroke="white"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="24" r="4" stroke="white" strokeWidth="2.4" />
      <circle cx="46" cy="24" r="4" stroke="white" strokeWidth="2.4" />
    </svg>
  );
}

function CarIconSmallFilled({ color = '#6b7280' }) {
  return (
    <svg viewBox="0 0 48 24" className="w-8 h-5" fill="none">
      <path
        d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
        fill={color}
        stroke="white"
        strokeWidth="1.3"
      />
      <circle cx="14" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
      <circle cx="36" cy="18" r="3" fill="#333" stroke="white" strokeWidth="1" />
    </svg>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-[54px] h-[30px] rounded-full transition-colors ${
        checked ? 'bg-green-500' : 'bg-red-500'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-[3px] w-[24px] h-[24px] bg-white rounded-full transition-all ${
          checked ? 'left-[27px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}

export default function Profile() {
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
        const me = await base44.auth.me();
        setFormData({
          display_name: me.display_name || me.full_name?.split(' ')[0] || 'JONATHAN',
          car_brand: me.car_brand || 'Porsche',
          car_model: me.car_model || 'Macan',
          car_color: me.car_color || 'negro',
          vehicle_type: me.vehicle_type || 'car',
          car_plate: (me.car_plate || '2026VSR').toUpperCase().replace(/\s+/g, ''),
          photo_url: me.photo_url || '',
          phone: me.phone || '',
          allow_phone_calls: me.allow_phone_calls ?? false
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const autoSave = async (data) => {
    try {
      await base44.auth.updateMe(data);
    } catch {
      // no reventamos UI
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
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('photo_url', file_url);
  };

  const selectedColor = useMemo(
    () => carColors.find((c) => c.value === formData.car_color) || carColors[1],
    [formData.car_color]
  );

  const selectedVehicle = useMemo(
    () => vehicleTypes.find((v) => v.value === formData.vehicle_type) || vehicleTypes[0],
    [formData.vehicle_type]
  );

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Mi Perfil" showBackButton={true} backTo="Home" />

      <main className="pt-[70px] pb-28 px-4 max-w-md mx-auto">
        {/* TARJETA SUPERIOR (CLAVADA A TU CAPTURA) */}
        <div className="rounded-[26px] border border-purple-500 shadow-[0_0_28px_rgba(168,85,247,0.25)] bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-6 py-5">
          <div className="flex gap-6 items-center">
            {/* FOTO + CAMARA */}
            <div className="relative">
              <div className="w-[112px] h-[132px] rounded-2xl overflow-hidden border-2 border-purple-500 bg-gray-800">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
                )}
              </div>

              <label className="absolute -bottom-4 left-[58px] w-[44px] h-[44px] bg-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-xl">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* INFO DERECHA */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[30px] font-extrabold tracking-wide leading-none">
                    {(formData.display_name || 'JONATHAN').toUpperCase()}
                  </div>
                  <div className="mt-2 text-gray-300 text-[16px] font-medium">
                    {formData.car_brand || 'Porsche'} {formData.car_model || 'Macan'}
                  </div>
                </div>

                <div className="pt-1">
                  <VehicleIconOutline type={formData.vehicle_type} className="w-[70px] h-[40px]" />
                </div>
              </div>

              <div className="mt-4">
                <Plate plate={formData.car_plate} />
              </div>
            </div>
          </div>
        </div>

        {/* FORM (MISMAS SECCIONES QUE TU CAPTURA) */}
        <div className="mt-7 space-y-5">
          {/* Nombre / Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-[18px] font-semibold">Nombre</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => updateField('display_name', e.target.value.slice(0, 15))}
                className="h-[52px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[18px] px-5"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-[18px] font-semibold">Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+34 600 00 00"
                className="h-[52px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[18px] px-5"
              />
            </div>
          </div>

          {/* Permitir llamadas */}
          <div className="h-[56px] rounded-2xl bg-[#0f172a] border border-gray-800 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-400" />
              <span className="text-[18px] font-semibold">Permitir llamadas</span>
            </div>

            <Toggle
              checked={!!formData.allow_phone_calls}
              onChange={(v) => updateField('allow_phone_calls', v)}
            />
          </div>

          {/* Marca / Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-[18px] font-semibold">Marca</Label>
              <Input
                value={formData.car_brand}
                onChange={(e) => updateField('car_brand', e.target.value)}
                className="h-[52px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[18px] px-5"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-[18px] font-semibold">Modelo</Label>
              <Input
                value={formData.car_model}
                onChange={(e) => updateField('car_model', e.target.value)}
                className="h-[52px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[18px] px-5"
              />
            </div>
          </div>

          {/* Color / Vehículo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-[18px] font-semibold">Color</Label>

              <Select value={formData.car_color} onValueChange={(v) => updateField('car_color', v)}>
                <SelectTrigger className="h-[52px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[18px] px-4">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="bg-[#0f172a] border border-gray-800">
                  {carColors.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-white">
                      <div className="flex items-center gap-3">
                        <CarIconSmallFilled color={c.fill} />
                        <span className="text-[16px]">{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-[18px] font-semibold">Vehículo</Label>

              <Select
                value={formData.vehicle_type}
                onValueChange={(v) => updateField('vehicle_type', v)}
              >
                <SelectTrigger className="h-[52px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[18px] px-4">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="bg-[#0f172a] border border-gray-800">
                  {vehicleTypes.map((v) => (
                    <SelectItem key={v.value} value={v.value} className="text-white">
                      <div className="flex items-center gap-3">
                        <VehicleIconOutline type={v.value} className="w-10 h-6" />
                        <span className="text-[16px]">{v.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Matrícula (barra grande como en tu captura) */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-[18px] font-semibold">Matrícula</Label>
            <Input
              value={(formData.car_plate || '').toUpperCase().replace(/\s+/g, '')}
              onChange={(e) =>
                updateField('car_plate', e.target.value.toUpperCase().replace(/\s+/g, ''))
              }
              className="h-[56px] rounded-2xl bg-[#0f172a] border border-gray-800 text-white text-[20px] font-extrabold tracking-[3px] text-center"
              maxLength={7}
            />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}