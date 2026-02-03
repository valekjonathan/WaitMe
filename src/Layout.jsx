// ===============================
// 3) /src/Layout.jsx
// (quita app-viewport para que iPhone se vea como el preview; sin padding global)
// ===============================
import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="min-h-[100dvh] w-full bg-black overflow-y-auto">
        {children}
      </div>
    </AuthProvider>
  );
}