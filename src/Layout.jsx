import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      {/* Espaciado global entre “tarjetas” apiladas (stacks con space-y-*) */}
      <style>{`
        .wm-root [class*="space-y-"] > :not([hidden]) ~ :not([hidden]) {
          margin-top: 15px !important;
        }
      `}</style>

      <div className="wm-root">
        {children}
      </div>
    </AuthProvider>
  );
}