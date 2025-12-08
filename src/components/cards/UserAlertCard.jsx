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
        address={alert.address}
        availableInMinutes={alert.available_in_minutes}
        price={alert.price}
        showLocationInfo={true}
      />

      {/* Botones de acción */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="border-gray-700 hover:bg-gray-800"
          onClick={() => onChat(alert)}
        >
          <MessageCircle className="w-5 h-5 text-purple-400" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={`border-gray-700 ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
          onClick={() => alert.allow_phone_calls && onCall(alert)}
          disabled={!alert.allow_phone_calls}
        >
          {alert.allow_phone_calls ? (
            <Phone className="w-5 h-5 text-green-400" />
          ) : (
            <PhoneOff className="w-5 h-5 text-gray-600" />
          )}
        </Button>

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          onClick={() => onBuyAlert(alert)}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : '¡WaitMe!'}
        </Button>
      </div>
    </div>
  );
}