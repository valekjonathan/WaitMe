import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Alertas from './pages/History';
import NavigatePage from './pages/Navigate';
import NotificationSettings from './pages/NotificationSettings';

export default function Layout() {
  return (
    <div className="h-[100dvh] bg-black flex flex-col overflow-hidden">
      {/* Placeholder que ocupa la altura del Header fijo (60px) */}
      <div className="flex-shrink-0 h-[60px]" />
      {/* Zona central: ocupa todo lo que queda hasta el BottomNav */}
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ paddingBottom: 'var(--bottom-nav-h)' }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<Alertas />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/navigate" element={<NavigatePage />} />
        </Routes>
      </div>
    </div>
  );
}