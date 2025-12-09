import React from 'react';
import { Phone, PhoneOff, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserCard from './UserCard';

export default function UserAlertCard({ 
  alert, 
  onBuyAlert, 
  onChat, 
  onCall,
  isLoading = false,
  isEmpty = false 
}) {
  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-center h-40">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Toca un coche en el mapa para ver sus datos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Card */}
      <UserCard
        userName={alert.user_name}
        userPhoto={alert.user_photo}
        carBrand={alert.car_brand}
        carModel={alert.car_model}
        carColor={alert.car_color}
        carPlate={alert.car_plate}
        vehicleType={alert.vehicle_type}
        address={alert.address}
        availableInMinutes={alert.available_in_minutes}
        price={alert.price}
        showLocationInfo={true}
        showContactButtons={true}
        onChat={() => onChat(alert)}
        onCall={() => onCall(alert)}
        latitude={alert.latitude}
        longitude={alert.longitude}
        allowPhoneCalls={alert.allow_phone_calls}
      />

      {/* Botón de reserva */}
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
        onClick={() => onBuyAlert(alert)}
        disabled={isLoading}
      >
        {isLoading ? 'Procesando...' : '¡WaitMe!'}
      </Button>
    </div>
  );
}