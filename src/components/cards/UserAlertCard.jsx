import { MapPin, Clock, MessageCircle, Phone, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UserAlertCard({
  alert,
  isEmpty,
  onBuyAlert,
  onChat,
  onCall,
  isLoading,
}) {
  if (isEmpty || !alert) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Selecciona una alerta en el mapa
      </div>
    )
  }

  const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls)

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div className="bg-green-500/25 text-green-300 border border-green-400/50 rounded-md px-3 h-7 flex items-center text-xs font-bold">
          Activa
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-1 text-green-400 font-bold text-sm">
          {alert.price?.toFixed(2)}€
        </div>
      </div>

      {/* USER */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40">
          <img
            src={alert.user_photo}
            alt={alert.user_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p className="font-bold text-xl text-white leading-none">
            {alert.user_name}
          </p>
          <p className="text-sm text-gray-300">
            {alert.car_brand} {alert.car_model}
          </p>

          <div className="flex items-end gap-2 mt-1">
            <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
              <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">E</span>
              </div>
              <span className="px-2 text-black font-mono font-bold text-sm">
                {alert.car_plate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="pt-2 border-t border-gray-700/80 mt-2 space-y-1.5 text-xs">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-purple-400 mt-0.5" />
          <span className="text-gray-300">
            {alert.address}
          </span>
        </div>

        <div className="flex items-start gap-1.5">
          <Clock className="w-4 h-4 text-purple-400 mt-0.5" />
          <span className="text-gray-400">
            Se va en {alert.available_in_minutes} min
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-3">
        <Button
          size="icon"
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
          onClick={() => onChat(alert)}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>

        {phoneEnabled ? (
          <Button
            size="icon"
            className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
            onClick={() => onCall(alert)}
          >
            <Phone className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px]"
            disabled
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        )}

        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700 h-8"
          onClick={() => onBuyAlert(alert)}
          disabled={isLoading}
        >
          WaitMe!
        </Button>
      </div>
    </div>
  )
}