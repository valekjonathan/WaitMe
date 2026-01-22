import { MapPin, Clock, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UserAlertCard({ alert, isEmpty }) {
  if (isEmpty || !alert) {
    return (
      <div className="text-gray-500 text-center mt-10">
        Selecciona una alerta
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
      {/* TOP */}
      <div className="flex justify-between mb-2">
        <div className="bg-green-500/25 text-green-300 px-3 rounded-md text-xs font-bold h-7 flex items-center">
          Activa
        </div>
        <div className="bg-green-500/20 text-green-400 px-2 rounded-lg font-bold">
          {alert.price}€
        </div>
      </div>

      {/* BODY */}
      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40">
          <img
            src={alert.user_photo}
            alt={alert.user_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <p className="font-bold text-xl">{alert.user_name}</p>
          <p className="text-gray-300 text-sm">
            {alert.car_brand} {alert.car_model}
          </p>

          <div className="bg-white rounded-md inline-flex mt-1 border-2 border-gray-400">
            <span className="bg-blue-600 text-white text-[8px] px-1">E</span>
            <span className="px-2 text-black font-mono font-bold">
              {alert.car_plate || 'XXXX XXX'}
            </span>
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-xs space-y-1">
        <div className="flex gap-1.5">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span>{alert.address}</span>
        </div>
        <div className="flex gap-1.5">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>Se va en {alert.available_in_minutes} min</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-3">
        <Button className="bg-green-500 h-8 w-[42px]" size="icon">
          <MessageCircle className="w-4 h-4" />
        </Button>

        <Button className="bg-white text-black h-8 w-[42px]" size="icon">
          <Phone className="w-4 h-4" />
        </Button>

        <Button className="flex-1 bg-purple-600 h-8">
          WaitMe!
        </Button>
      </div>
    </div>
  )
}