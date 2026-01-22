import React from 'react';
import { MapPin, Clock, Car, User as UserIcon } from 'lucide-react';

export default function UserCard({ user = {}, compact = false }) {
  const {
    name = 'Usuario',
    car = 'Coche',
    plate = 'XXXX XXX',
    photo,
    price = 0,
    eta = 0,
    address = ''
  } = user;

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-purple-500/40 rounded-2xl p-3 shadow-xl">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 border border-purple-500/30 flex items-center justify-center shrink-0">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-purple-300" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-white font-extrabold text-lg leading-none truncate">
                {name}
              </div>
              <div className="text-gray-300 text-xs mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-purple-400" />
                  {car}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2.5 py-1 text-purple-300 font-extrabold text-xs">
              {eta}m
            </div>
            <div className="bg-red-500/20 border border-red-400/30 rounded-full px-2.5 py-1 text-red-200 font-extrabold text-xs">
              {price}€
            </div>
          </div>
        </div>

        {/* Matrícula */}
        <div className="mt-2 flex items-center justify-between">
          <div className="bg-gray-800/70 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-bold tracking-widest text-sm">
            {plate}
          </div>
          <div className="w-10 h-7 rounded-lg bg-gray-800/70 border border-gray-700 flex items-center justify-center">
            <span className="text-gray-300 text-sm">🚗</span>
          </div>
        </div>

        {/* Ubicación y tiempo (SIN huecos verticales) */}
        <div className="space-y-0.5 pt-1 border-t border-gray-700 mt-2">
          {address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-gray-300 text-xs leading-tight truncate">
                {address}
              </span>
            </div>
          )}
          {(eta || eta === 0) && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-gray-400 text-xs leading-tight">
                Se va en {eta} min
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}