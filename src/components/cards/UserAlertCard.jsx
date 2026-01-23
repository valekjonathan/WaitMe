// FILE: src/components/UserCard.jsx
import React from 'react';
import { MapPin, Clock, Navigation, MessageCircle, Phone } from 'lucide-react';

export default function UserCard({
  avatar,
  name,
  car,
  plate,
  location,
  timeText,
  distance,
  price,
  footer = 'waitme', // waitme | countdown | actions
  countdownText = '09:51'
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500/50 space-y-3">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded bg-green-600/20 text-green-400 text-xs">
          Activa
        </span>
        <span className="text-purple-400 font-bold">{price}</span>
      </div>

      {/* BODY */}
      <div className="flex gap-3">
        <img
          src={avatar}
          className="w-14 h-14 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="text-white font-semibold">{name}</div>
          <div className="text-gray-300 text-sm">{car}</div>
          <div className="inline-block mt-1 px-2 py-0.5 bg-blue-600 rounded text-xs font-bold text-white">
            {plate}
          </div>

          <div className="mt-2 space-y-1 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <MapPin size={14} /> {location}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} /> {timeText}
            </div>
            {distance && (
              <div className="flex items-center gap-1">
                <Navigation size={14} /> {distance}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {footer === 'waitme' && (
        <button className="w-full bg-purple-600 rounded-md py-2 text-white font-semibold">
          WaitMe!
        </button>
      )}

      {footer === 'countdown' && (
        <div className="w-full bg-purple-700 rounded-md py-2 text-white text-center font-semibold">
          {countdownText}
        </div>
      )}

      {footer === 'actions' && (
        <div className="flex gap-2">
          <button className="flex-1 bg-green-600 rounded-md py-2 flex justify-center">
            <MessageCircle size={18} />
          </button>
          <button className="flex-1 bg-gray-700 rounded-md py-2 flex justify-center">
            <Phone size={18} />
          </button>
        </div>
      )}
    </div>
  );
}