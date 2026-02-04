import React from 'react'
import { AuthProvider } from '@/components/AuthContext'
import '@/globals.css'

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div
        className="w-full min-h-[100dvh] bg-black text-white overflow-x-hidden overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </AuthProvider>
  )
}