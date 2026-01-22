import React, { useState, useEffect, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, MessageCircle, Phone, PhoneOff, Car, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import ParkingMap from '@/components/map/ParkingMap'
import CreateAlertCard from '@/components/cards/CreateAlertCard'
import MapFilters from '@/components/map/MapFilters'
import BottomNav from '@/components/BottomNav'
import NotificationManager from '@/components/NotificationManager'
import Header from '@/components/Header'

const safeAlerts = (alerts = []) =>
  alerts.filter(a =>
    typeof a?.latitude === 'number' &&
    typeof a?.longitude === 'number'
  )

function buildDemoAlerts(lat, lng) {
  const offsets = [
    [0.0009, 0.0006],
    [-0.0007, 0.0008],
    [0.0011, -0.0005],
    [-0.0010, -0.0007],
    [0.0004, -0.0011],
    [-0.0004, 0.0012]
  ]

  const users = [
    ['Sofía', 'https://randomuser.me/api/portraits/women/44.jpg', 3, 6, 'SEAT', 'Ibiza'],
    ['Marco', 'https://randomuser.me/api/portraits/men/32.jpg', 5, 10, 'Volkswagen', 'Golf'],
  ]

  return users.map((u, i) => ({
    id: `demo_${i}`,
    user_name: u[0],
    user_photo: u[1],
    price: u[2],
    available_in_minutes: u[3],
    car_brand: u[4],
    car_model: u[5],
    car_plate: 'XXXX XXX',
    address: 'Oviedo',
    latitude: lat + offsets[i][0],
    longitude: lng + offsets[i][1],
    is_demo: true
  }))
}

export default function Home() {
  const [mode, setMode] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p =>
      setUserLocation([p.coords.latitude, p.coords.longitude])
    )
  }, [])

  const demoAlerts = useMemo(() => {
    const lat = userLocation?.[0] ?? 43.3619
    const lng = userLocation?.[1] ?? -5.8494
    return buildDemoAlerts(lat, lng)
  }, [userLocation])

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager />

      <Header title="WaitMe!" showBackButton={!!mode} onBack={() => setMode(null)} />

      <main className="pt-[56px] pb-[88px]">
        <AnimatePresence>
          {mode === 'search' && (
            <motion.div className="flex flex-col h-[calc(100vh-144px)]">
              <div className="h-[45%] px-3 pt-2 relative">
                <ParkingMap
                  alerts={safeAlerts(demoAlerts)}
                  userLocation={userLocation}
                  selectedAlert={selectedAlert}
                  onAlertClick={setSelectedAlert}
                  zoomControl
                  className="h-full"
                />
              </div>

              {/* 🔴 TARJETA IDÉNTICA A MIS RESERVAS */}
              <div className="flex-1 px-4 overflow-y-auto">
                {!selectedAlert ? (
                  <div className="text-gray-500 text-center mt-10">
                    Selecciona una alerta
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50">
                    <div className="flex justify-between mb-2">
                      <div className="bg-green-500/25 text-green-300 px-3 rounded-md text-xs font-bold h-7 flex items-center">
                        Activa
                      </div>
                      <div className="bg-green-500/20 text-green-400 px-2 rounded-lg font-bold">
                        {selectedAlert.price}€
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40">
                        <img
                          src={selectedAlert.user_photo}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-xl">{selectedAlert.user_name}</p>
                        <p className="text-gray-300 text-sm">
                          {selectedAlert.car_brand} {selectedAlert.car_model}
                        </p>

                        <div className="bg-white rounded-md inline-flex mt-1 border-2 border-gray-400">
                          <span className="bg-blue-600 text-white text-[8px] px-1">E</span>
                          <span className="px-2 text-black font-mono font-bold">
                            {selectedAlert.car_plate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 border-t border-gray-700 pt-2 text-xs space-y-1">
                      <div className="flex gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{selectedAlert.address}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>Se va en {selectedAlert.available_in_minutes} min</span>
                      </div>
                    </div>

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
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}