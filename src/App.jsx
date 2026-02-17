import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import History from './pages/History';
import NavigatePage from './pages/Navigate';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/Home" element={<Navigate to="/home" replace />} />

      <Route path="/home" element={<Home />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/history" element={<History />} />
      <Route path="/navigate" element={<NavigatePage />} />
    </Routes>
  );
}