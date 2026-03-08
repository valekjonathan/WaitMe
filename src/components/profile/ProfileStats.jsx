/**
 * Sección de preferencias: permitir llamadas.
 */

import { Phone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function ProfileStats({ formData, onUpdateField }) {
  return (
    <div className="bg-gray-900 rounded-lg p-2 border border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Phone className="w-4 h-4 text-purple-400" />
        <p className="text-sm text-white">Permitir llamadas</p>
      </div>
      <Switch
        checked={formData.allow_phone_calls}
        onCheckedChange={(checked) => onUpdateField('allow_phone_calls', checked)}
        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
      />
    </div>
  );
}
