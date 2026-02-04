// src/Layout.jsx
import React from 'react'
import '@/globals.css'
import { AuthProvider } from '@/components/AuthContext'

// 🔴 ARCHIVO CRÍTICO
// - Elimina la franja superior
// - Evita saltos en iPhone (Safari)
// - Hace Preview = iPhone real
// - Nunca deja la pantalla “sin fondo”

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div
        id="app-root"
        className="
          w-full
          min-h-[100dvh]
          bg-black
          text-white
          overflow-x-hidden
          overflow-y-auto
        "
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none'
        }}
      >
        {children}
      </div>
    </AuthProvider>
  )
}