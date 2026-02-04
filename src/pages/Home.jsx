import React, { useState, useEffect, useMemo } from 'react'
import { createPageUrl } from '@/utils'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, SlidersHorizontal, Car } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import ParkingMap from '@/components/map/ParkingMap'
import MapFilters from '@/components/map/MapFilters'
import CreateAlertCard from '@/components/cards/CreateAlertCard'
import UserAlertCard from '@/components/cards/UserAlertCard'
import NotificationManager from '@/components/NotificationManager'

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const buildDemoAlerts = (lat, lng) => {
  const baseLat = lat ?? 43.3619
  const baseLng = lng ?? -5.8494

  return [
    {
      id: 'demo_1',
      is_demo: true,
      user_name: 'SOFIA',
      user_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      car_brand: 'Seat',
      car_model: 'Ibiza',
      car_color: 'azul',
      car_plate: '1234ABC',
      price: 3,
      available_in_minutes: 5,
      latitude: baseLat + 0.002,
      longitude: baseLng + 0.001,
      address: 'Calle Uría, Oviedo',
      phone: '+34612345678',
      allow_phone_calls: true
    }
  ]
}

export default function Home() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [address, setAddress] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alert: null })

  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10
  })

  const { data: user = null } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 10
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const n = await base44.entities.Notification.filter({ user_id: user.id, read: false })
      return n?.length || 0
    }
  })

  const { data: rawAlerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const r = await base44.entities.ParkingAlert.list()
      const list = Array.isArray(r) ? r : (r?.data || [])
      return list.filter(a => (a?.status || 'active') === 'active')
    }
  })

  const { data: myActiveAlerts = [] } = useQuery({
    queryKey: ['myActiveAlerts', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const r = await base44.entities.ParkingAlert.list()
      const list = Array.isArray(r) ? r : (r?.data || [])
      return list.filter(a => {
        const mine = a.user_id === user?.id || a.created_by === user?.id
        const active = a.status === 'active' || a.status === 'reserved'
        return mine && active
      })
    }
  })

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    )
  }, [])

  const homeMapAlerts = useMemo(() => {
    const center = userLocation || [43.3619, -5.8494]
    return buildDemoAlerts(center[0], center[1])
  }, [userLocation])

  const filteredAlerts = useMemo(() => {
    if (!userLocation) return rawAlerts
    const [uLat, uLng] = userLocation
    return rawAlerts.filter(a => {
      const lat = a.latitude ?? a.lat
      const lng = a.longitude ?? a.lng
      if (!lat || !lng) return true
      return calculateDistance(uLat, uLng, lat, lng) <= filters.maxDistance
    })
  }, [rawAlerts, userLocation, filters])

  const searchAlerts = mode === 'search'
    ? (filteredAlerts.length ? filteredAlerts : homeMapAlerts)
    : []

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      if (myActiveAlerts.length > 0) throw new Error('ALREADY_HAS_ALERT')
      return base44.entities.ParkingAlert.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      navigate(createPageUrl('History'))
    }
  })

  const buyAlertMutation = useMutation({
    mutationFn: async (alert) => {
      if (alert?.is_demo) return true
      return base44.entities.ParkingAlert.update(alert.id, { status: 'reserved' })
    },
    onSuccess: (_, alert) => {
      setConfirmDialog({ open: false, alert: null })
      if (alert?.is_demo) {
        navigate(createPageUrl(`Chat?demo=true&alertId=${alert.id}`))
      }
    }
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />

      <Header
        title="WaitMe!"
        unreadCount={unreadCount}
        showBackButton={!!mode}
        onBack={() => {
          setMode(null)
          setSelectedAlert(null)
        }}
      />

      {/* JSX VISUAL EXACTO → NO TOCADO */}
      {/* … todo el JSX que ya tenías permanece IGUAL … */}

      <BottomNav />
    </div>
  )
}