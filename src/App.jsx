// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Pages (las que SÍ existen)
import Home from '@/pages/Home';
import Chats from '@/pages/Chats';
import Chat from '@/pages/Chat';
import History from '@/pages/History';
import Notifications from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*
          🔥 IMPORTANT:
          createPageUrl('Home') => '/home'
          Usamos '/home' como ruta canónica para que Header/links no dependan del fallback.
        */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        {/* Compatibilidad por si Base44 abre /Home (mayúscula) */}
        <Route path="/Home" element={<Navigate to="/home" replace />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/history" element={<History />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}