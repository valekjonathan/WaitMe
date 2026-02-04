import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-black w-full overflow-x-hidden">
        <main className="w-full">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}