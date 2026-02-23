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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0000FF' }}>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '10px 0',
          background: 'rgba(0,0,0,0.5)'
        }}
      >
        <span style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 'bold', letterSpacing: '2px' }}>
          TEST DE CONEXIÓN
        </span>
      </div>
      <div className="flex-1" style={{ paddingTop: '52px' }}>
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
    </div>
  );
}
