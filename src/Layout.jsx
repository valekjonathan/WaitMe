import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isProfileComplete } from '@/lib/profile';
import { LayoutProvider, useLayoutHeaderConfig } from '@/lib/LayoutContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Home from './pages/Home';

const Chats            = lazy(() => import('./pages/Chats'));
const Chat             = lazy(() => import('./pages/Chat'));
const Notifications    = lazy(() => import('./pages/Notifications'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Profile          = lazy(() => import('./pages/Profile'));
const Settings         = lazy(() => import('./pages/Settings'));
const Alertas          = lazy(() => import('./pages/History'));
const NavigatePage     = lazy(() => import('./pages/Navigate'));

const ROUTE_HEADER = {
  '/': { title: 'WaitMe!' },
  '/home': { title: 'WaitMe!' },
  '/Home': { title: 'WaitMe!' },
  '/chats': { title: 'Chats', showBackButton: true, backTo: 'Home' },
  '/chat': { title: 'Chat', showBackButton: true, backTo: 'Chats' },
  '/notifications': { title: 'Notificaciones', showBackButton: true, backTo: 'Home', titleClassName: 'text-[20px] leading-[20px]' },
  '/notification-settings': { title: 'Notificaciones', showBackButton: true, backTo: 'Settings' },
  '/profile': { title: 'Mi Perfil', showBackButton: true },
  '/settings': { title: 'Ajustes', showBackButton: true, backTo: 'Home' },
  '/history': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/alertas': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/navigate': { title: 'Navegación', showBackButton: true, backTo: 'History', titleClassName: 'text-[13px] leading-[13px] font-semibold select-none text-center max-w-xs' },
};

function ProfileGuard({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === '/' || location.pathname.toLowerCase() === '/home';
  if (isHome && user?.id && !isProfileComplete(user)) {
    return <Navigate to="/profile" replace />;
  }
  return children;
}

function LayoutShell() {
  const location = useLocation();
  const path = location.pathname;
  const routeConfig = ROUTE_HEADER[path] || ROUTE_HEADER['/'];
  const ctxConfig = useLayoutHeaderConfig();
  const baseConfig = { title: 'WaitMe!', showBackButton: false, backTo: null, onBack: null, titleClassName: 'text-[24px] leading-[24px]' };
  const merged = { ...baseConfig, ...routeConfig, ...ctxConfig };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-black">
      <Header
        title={merged.title}
        showBackButton={merged.showBackButton}
        backTo={merged.backTo}
        onBack={merged.onBack}
        titleClassName={merged.titleClassName}
      />
      <main className="flex-1 min-h-0 flex flex-col pt-[69px] pb-24">
        <div className="flex-1 min-h-0 flex flex-col">
          <ProfileGuard>
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </ProfileGuard>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function Layout() {
  return (
    <LayoutProvider>
      <Routes>
        <Route path="/" element={<LayoutShell />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="Home" element={<Home />} />
          <Route path="chats" element={<Chats />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notification-settings" element={<NotificationSettings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="history" element={<Alertas />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="navigate" element={<NavigatePage />} />
        </Route>
      </Routes>
    </LayoutProvider>
  );
}
