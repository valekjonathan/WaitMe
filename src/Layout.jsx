import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

const Chats            = lazy(() => import('./pages/Chats'));
const Chat             = lazy(() => import('./pages/Chat'));
const Notifications    = lazy(() => import('./pages/Notifications'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Profile          = lazy(() => import('./pages/Profile'));
const Settings         = lazy(() => import('./pages/Settings'));
const Alertas          = lazy(() => import('./pages/History'));
const NavigatePage     = lazy(() => import('./pages/Navigate'));

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
        <Suspense fallback={null}>
          <Routes>
            <Route path="/"                      element={<Home />} />
            <Route path="/home"                  element={<Home />} />
            <Route path="/Home"                  element={<Home />} />
            <Route path="/chats"                 element={<Chats />} />
            <Route path="/chat"                  element={<Chat />} />
            <Route path="/chat/:id"              element={<Chat />} />
            <Route path="/notifications"         element={<Notifications />} />
            <Route path="/notification-settings" element={<NotificationSettings />} />
            <Route path="/profile"               element={<Profile />} />
            <Route path="/settings"              element={<Settings />} />
            <Route path="/history"               element={<Alertas />} />
            <Route path="/alertas"               element={<Alertas />} />
            <Route path="/navigate"              element={<NavigatePage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
