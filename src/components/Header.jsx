// src/components/Header.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPageUrl } from '@/utils'
import { useAuth } from '@/lib/AuthContext'
import { motion } from 'framer-motion'

// 🔴 ARCHIVO CRÍTICO
// - Elimina la franja superior definitivamente
// - Altura fija real (60px)
// - No provoca saltos al cargar
// - Preview = iPhone
// - NO cambia diseño, solo estabilidad

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home',
  onBack
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [credits, setCredits] = useState(user?.credits || 0)

  useEffect(() => {
    setCredits(user?.credits || 0)
  }, [user?.credits])

  const handleBack = () => {
    if (onBack) return onBack()
    navigate(-1)
  }

  const renderTitle = () => {
    const t = title.toLowerCase().replace(/\s/g, '')
    if (t === 'waitme!' || t === 'waitme') {
      return (
        <span className="text-lg font-semibold select-none">
          <span className="text-white">Wait</span>
          <span className="text-purple-500">Me!</span>
        </span>
      )
    }
    return <span className="text-lg font-semibold text-white">{title}</span>
  }

  return (
    <header
      className="
        fixed
        top-0 left-0 right-0
        z-50
        bg-black
        h-[60px]
      "
      style={{
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <div className="h-[60px] px-4 flex items-center">
        <div className="relative flex items-center justify-between w-full">

          {/* IZQUIERDA */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            ) : (
              <div className="w-10" />
            )}

            {/* CRÉDITOS */}
            <Link to={createPageUrl('Settings')}>
              <motion.div
                key={credits}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 0.25 }}
                className="
                  ml-2
                  px-3 py-1.5
                  rounded-full
                  border border-purple-500/60
                  bg-purple-600/20
                  hover:bg-purple-600/30
                  transition-colors
                "
              >
                <span className="text-purple-400 font-bold text-sm">
                  {Number(credits).toFixed(2)}€
                </span>
              </motion.div>
            </Link>
          </div>

          {/* CENTRO (título perfectamente centrado) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              {renderTitle()}
            </div>
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-1">
            <Link to={createPageUrl('Settings')}>
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-400 hover:bg-purple-500/20"
              >
                <Settings className="w-7 h-7" />
              </Button>
            </Link>

            <Link to={createPageUrl('Profile')}>
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-400 hover:bg-purple-500/20"
              >
                <User className="w-7 h-7" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </header>
  )
}