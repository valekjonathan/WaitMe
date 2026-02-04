import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="app-viewport w-full bg-black overflow-y-auto">
        {children}
      </div>
    </AuthProvider>
  );
}