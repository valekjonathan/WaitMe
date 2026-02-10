// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/lib/AuthContext';
import { getDemoMode } from '@/lib/demoMode';

// Pages
import Home from '@/pages/Home';
import Chats from '@/pages/Chats';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';

export default function App() {
  const { user, loading } = useAuth();
  const isDemo = getDemoMode();

  // ⚠️ NUNCA BLOQUEAR EL RENDER
  // En preview/editor siempre renderizamos algo
  if (loading && !isDemo) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        Cargando…
      </div>
    );
  }

  const isLogged = isDemo || !!user;

  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route
          path="/login"
          element={isLogged ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Privado */}
        <Route
          path="/"
          element={isLogged ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/chats"
          element={isLogged ? <Chats /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/history"
          element={isLogged ? <History /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={isLogged ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={isLogged ? <Settings /> : <Navigate to="/login" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}