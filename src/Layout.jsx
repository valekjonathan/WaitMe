import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import History from './pages/History';
import NavigatePage from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';

export default function Layout() {
  return (
    <div className="flex flex-col flex-1 w-full min-h-[100dvh]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/Home" element={<Home />} />

        <Route path="/chats" element={<Chats />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/notification-settings" element={<NotificationSettings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
        <Route path="/navigate" element={<NavigatePage />} />
      </Routes>
    </div>
  );
}