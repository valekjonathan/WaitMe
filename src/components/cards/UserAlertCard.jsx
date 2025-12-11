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
  isEmpty = false,
  userLocation
}) {
  if (isEmpty || !alert) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500/50" style={{ height: 'calc(65vh - 5rem)' }}>
        <div className="flex items-center justify-center h-full">
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
        latitude={alert.latitude}
        longitude={alert.longitude}
        userLocation={userLocation}
        actionButtons={
          <div className="flex gap-2">
            <Button
              size="icon"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 w-9"
              onClick={() => onChat(alert)}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`border-gray-700 h-9 w-9 ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
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
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold h-9"
              onClick={() => onBuyAlert(alert)}
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : 'WaitMe!'}
            </Button>
          </div>
        }
      />
    </div>
  );
}