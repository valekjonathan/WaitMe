// src/Layout.jsx
import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

const BOTTOM_NAV_HEIGHT = 72;

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="w-full min-h-[100dvh] bg-black overflow-hidden">
        {/* CONTENIDO REAL */}
        <main
          className="bg-black overflow-y-auto"
          style={{ minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px)` }}
        >
          {children}
        </main>

        {/* ESPACIO SOLO PARA EL BOTTOM NAV */}
        <div style={{ height: BOTTOM_NAV_HEIGHT }} />
      </div>
    </AuthProvider>
  );
}