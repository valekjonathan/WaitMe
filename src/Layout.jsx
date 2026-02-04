import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

const HEADER_HEIGHT = 56;   // altura real del header
const BOTTOM_NAV_HEIGHT = 72; // altura del menú inferior

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="w-full bg-black">
        {/* Spacer Header */}
        <div style={{ height: HEADER_HEIGHT }} />

        {/* Contenido */}
        <main
          style={{
            minHeight: `calc(100dvh - ${HEADER_HEIGHT + BOTTOM_NAV_HEIGHT}px)`
          }}
          className="overflow-y-auto"
        >
          {children}
        </main>

        {/* Spacer BottomNav */}
        <div style={{ height: BOTTOM_NAV_HEIGHT }} />
      </div>
    </AuthProvider>
  );
}