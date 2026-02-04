// src/Layout.jsx
import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Contenedor principal sin márgenes extraños */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}