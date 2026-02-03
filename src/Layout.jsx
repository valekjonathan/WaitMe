import React from 'react';
import { AuthProvider } from '@/components/AuthContext';
import '@/globals.css';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="safe-area min-h-[100dvh] w-full bg-black overflow-y-auto">
        {children}
      </div>
    </AuthProvider>
  );
}