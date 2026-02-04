import React from 'react';
import { AuthProvider } from '@/components/AuthContext';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}