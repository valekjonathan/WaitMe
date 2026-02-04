import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPageUrl } from '@/utils'

export default function Header({
  title = 'WaitMe!',
  showBackButton = false,
  backTo = 'Home'
}) {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black h-[60px]">
      <div className="h-[60px] px-4 flex items-center justify-between">
        {/* IZQUIERDA */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* CENTRO */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-lg font-semibold">
            <span className="text-white">Wait</span>
            <span className="text-purple-500">Me!</span>
          </span>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-1">
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-purple-400">
              <Settings className="w-6 h-6" />
            </Button>
          </Link>
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon" className="text-purple-400">
              <User className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}