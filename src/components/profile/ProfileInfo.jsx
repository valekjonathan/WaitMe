/**
 * Formulario de datos del perfil: nombre, teléfono, marca, modelo, color, vehículo, matrícula.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { carColors, VehicleIconProfile, CarIconSmall, vehicleLabel } from './VehicleIcons';
import ProfileStats from './ProfileStats';

function VehicleIconSmall({ type, selectedColor }) {
  return <VehicleIconProfile type={type} color={selectedColor?.fill} size="w-6 h-4" />;
}

export default function ProfileInfo({
  formData,
  onUpdateField,
  onPlateChange,
  formatPlate,
  selectedColor,
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-gray-400 text-sm">Nombre</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => onUpdateField('full_name', e.target.value.slice(0, 15))}
            placeholder="Tu nombre"
            className="bg-gray-900 border-gray-700 text-white h-9"
            maxLength={15}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-400 text-sm">Teléfono</Label>
          <Input
            value={formData.phone}
            onChange={(e) => onUpdateField('phone', e.target.value)}
            placeholder="+34 600 00 00"
            className="bg-gray-900 border-gray-700 text-white h-9 text-sm"
            type="tel"
          />
        </div>
      </div>

      <ProfileStats formData={formData} onUpdateField={onUpdateField} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-gray-400 text-sm">Marca</Label>
          <Input
            value={formData.brand}
            onChange={(e) => onUpdateField('brand', e.target.value)}
            placeholder="Seat, Renault..."
            className="bg-gray-900 border-gray-700 text-white h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-gray-400 text-sm">Modelo</Label>
          <Input
            value={formData.model}
            onChange={(e) => onUpdateField('model', e.target.value)}
            placeholder="Ibiza, Megane..."
            className="bg-gray-900 border-gray-700 text-white h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-gray-400 text-sm">Color</Label>
          <Select value={formData.color} onValueChange={(value) => onUpdateField('color', value)}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
              {carColors.map((color) => (
                <SelectItem
                  key={color.value}
                  value={color.value}
                  className="text-white hover:bg-gray-800"
                >
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
          <Select
            value={formData.vehicle_type || 'car'}
            onValueChange={(value) => onUpdateField('vehicle_type', value)}
          >
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <div className="flex items-center gap-2">
                <VehicleIconSmall
                  type={formData.vehicle_type || 'car'}
                  selectedColor={selectedColor}
                />
                <span className="text-white">{vehicleLabel(formData.vehicle_type || 'car')}</span>
              </div>
            </SelectTrigger>

            <SelectContent side="top" sideOffset={8} className="bg-gray-900 border-gray-700">
              <SelectItem value="car" className="text-white hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  <VehicleIconSmall type="car" selectedColor={selectedColor} />
                  Normal
                </div>
              </SelectItem>

              <SelectItem value="suv" className="text-white hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  <VehicleIconSmall type="suv" selectedColor={selectedColor} />
                  Voluminoso
                </div>
              </SelectItem>

              <SelectItem value="van" className="text-white hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  <VehicleIconSmall type="van" selectedColor={selectedColor} />
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
          onChange={(e) => onPlateChange(e.target.value)}
          placeholder="1234 ABC"
          className="bg-gray-900 border-gray-700 text-white font-mono uppercase text-center h-9"
          maxLength={8}
        />
      </div>
    </div>
  );
}
