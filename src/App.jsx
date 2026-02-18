import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import History from '@/pages/History';
import Notifications from '@/pages/Notifications';
import Chats from '@/pages/Chats';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

function HomeWrapper() {
  const location = useLocation();
  const resetKey = new URLSearchParams(location.search).get('reset');

  return <Home key={resetKey || 'home'} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeWrapper />} />
      <Route path="/history" element={<History />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}