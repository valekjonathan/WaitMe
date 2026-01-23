import React from 'react';
import { MapPin, Clock, Navigation, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserCard({
  avatar,
  name,
  car,
  plate,
  location,
  dateText,
  distance,
  price,
  headerLeft,
  headerRight,
  footerType = 'waitme', // 'waitme' | 'countdown' | 'actions'
  onWaitMe,
  onChat,
  onCall,
  countdownText
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-3 border-2 border-purple-500/50 space-y-3">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {headerLeft}
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
        </div>
      </div>

      {/* BODY */}
      <div className="flex gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-14 h-14 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="font-semibold text-white">{name}</div>
          <div className="text-sm text-gray-300">{car}</div>
          <div className="inline-block mt-1 px-2 py-0.5 bg-blue-600 rounded text-xs font-bold text-white">
            {plate}
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <MapPin size={14} /> {location}
            </div>
            {dateText && (
              <div className="flex items-center gap-1">
                <Clock size={14} /> {dateText}
              </div>
            )}
            {distance && (
              <div className="flex items-center gap-1">
                <Navigation size={14} /> {distance}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {footerType === 'waitme' && (
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={onWaitMe}
        >
          WaitMe!
        </Button>
      )}

      {footerType === 'countdown' && (
        <div className="w-full text-center bg-purple-700 rounded-md py-2 text-white font-semibold">
          {countdownText}
        </div>
      )}

      {footerType === 'actions' && (
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600" onClick={onChat}>
            <MessageCircle size={18} />
          </Button>
          <Button className="flex-1 bg-gray-700" onClick={onCall}>
            <Phone size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}