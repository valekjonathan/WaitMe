// src/Layout.jsx
import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="w-full min-h-screen bg-black overflow-hidden">
        <main className="bg-black">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}