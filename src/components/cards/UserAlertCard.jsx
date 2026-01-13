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
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-4 py-4 border-2 border-purple-500/50 h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: '#A855F7' }} strokeWidth={2.5} />
          <p className="text-xs">Toca un coche en el mapa para ver sus datos</p>
        </div>
      </div>);

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
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 w-[42px]"
            onClick={() => onChat(alert)}>

              <MessageCircle className="w-4 h-4" />
            </Button>
            
            <Button
            variant="outline"
            size="icon"
            className={`border-gray-700 h-8 w-[42px] ${alert.allow_phone_calls ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'}`}
            onClick={() => alert.allow_phone_calls && onCall(alert)}
            disabled={!alert.allow_phone_calls}>

              {alert.allow_phone_calls ?
            <Phone className="w-4 h-4 text-green-400" /> :

            <PhoneOff className="w-4 h-4 text-gray-600" />
            }
            </Button>

            <Button className="bg-purple-600 text-white ml-2 px-4 py-2 text-sm font-semibold rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-purple-700 h-8 flex-1"

          onClick={() => onBuyAlert(alert)}
          disabled={isLoading}>

              {isLoading ? 'Procesando...' : 'WaitMe!'}
            </Button>
          </div>
        } />

    </div>);

}