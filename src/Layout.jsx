import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

const HEADER_HEIGHT = 80;     // 🔴 NO 56
const BOTTOM_NAV_HEIGHT = 72;

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="w-full bg-black overflow-hidden">
        {/* Header spacer */}
        <div style={{ height: HEADER_HEIGHT }} />

        {/* Content */}
        <main
          style={{
            minHeight: `calc(100dvh - ${HEADER_HEIGHT + BOTTOM_NAV_HEIGHT}px)`
          }}
          className="overflow-y-auto bg-black"
        >
          {children}
        </main>

        {/* Bottom nav spacer */}
        <div style={{ height: BOTTOM_NAV_HEIGHT }} />
      </div>
    </AuthProvider>
  );
}