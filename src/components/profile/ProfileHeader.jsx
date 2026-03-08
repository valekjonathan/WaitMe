/**
 * Cabecera del perfil: tarjeta tipo DNI con avatar, nombre, coche y matrícula.
 */

import { Camera } from 'lucide-react';
import { VehicleIconProfile } from './VehicleIcons';

export default function ProfileHeader({
  formData,
  profile,
  avatarSrc,
  initial,
  selectedColor,
  onPhotoUpload,
}) {
  const plateDisplay = formData.plate
    ? `${formData.plate.slice(0, 4)} ${formData.plate.slice(4)}`.trim()
    : '0000 XXX';

  return (
    <div className="mt-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 border border-purple-500 shadow-xl">
      <div className="flex gap-4">
        <div className="relative">
          <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-purple-500 bg-gray-800">
            {avatarSrc ? (
              <img
                key={avatarSrc}
                src={avatarSrc}
                alt="avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-2xl font-semibold">{initial}</span>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoUpload} />
          </label>
        </div>

        <div className="pl-3 flex-1 flex flex-col justify-between">
          <p className="text-xl font-bold text-white">{formData.full_name || profile?.full_name}</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">
                {formData.brand || 'Sin'} {formData.model || 'coche'}
              </p>
            </div>
            <VehicleIconProfile type={formData.vehicle_type || 'car'} color={selectedColor?.fill} />
          </div>

          <div className="mt-2 flex items-center">
            <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
              <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">E</span>
              </div>
              <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                {plateDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
