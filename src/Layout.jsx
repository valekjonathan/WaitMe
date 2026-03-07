import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:Layout] ${msg}`, extra ?? '');
    } catch {}
  }
};
import { useEffect } from 'react';
import { LayoutProvider, useLayoutHeaderConfig } from '@/lib/LayoutContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import BottomNavLayer from '@/system/layout/BottomNavLayer';
import Home from './pages/Home';

const Chats = lazy(() => import('./pages/Chats'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Alertas = lazy(() => import('./pages/History'));
const NavigatePage = lazy(() => import('./pages/Navigate'));
const DevDiagnostics = import.meta.env.DEV ? lazy(() => import('./pages/DevDiagnostics')) : null;

const ROUTE_HEADER = {
  '/': { title: 'WaitMe!' },
  '/home': { title: 'WaitMe!' },
  '/Home': { title: 'WaitMe!' },
  '/chats': { title: 'Chats', showBackButton: true, backTo: 'Home' },
  '/chat': { title: 'Chat', showBackButton: true, backTo: 'Chats' },
  '/notifications': {
    title: 'Notificaciones',
    showBackButton: true,
    backTo: 'Home',
    titleClassName: 'text-[20px] leading-[20px]',
  },
  '/notification-settings': { title: 'Notificaciones', showBackButton: true, backTo: 'Settings' },
  '/profile': { title: 'Mi Perfil', showBackButton: true },
  '/settings': { title: 'Ajustes', showBackButton: true, backTo: 'Home' },
  '/history': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/alertas': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/alerts': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/navigate': {
    title: 'Navegación',
    showBackButton: true,
    backTo: 'History',
    titleClassName: 'text-[13px] leading-[13px] font-semibold select-none text-center max-w-xs',
  },
  '/dev-diagnostics': { title: 'Dev Diagnostics', showBackButton: true, backTo: 'Home' },
};

function LayoutShell() {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    const isHome = path === '/' || path === '/home' || path === '/Home';
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    if (isHome) {
      html.setAttribute('data-waitme-home', 'true');
      html.style.overflow = 'hidden';
      html.style.height = '100dvh';
      html.style.maxHeight = '100dvh';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
      body.style.touchAction = 'none';
      body.style.height = '100dvh';
      body.style.maxHeight = '100dvh';
      if (root) {
        root.style.overflow = 'hidden';
        root.style.touchAction = 'none';
        root.style.height = '100dvh';
        root.style.maxHeight = '100dvh';
      }
    } else {
      html.removeAttribute('data-waitme-home');
      html.style.overflow = '';
      html.style.height = '';
      html.style.maxHeight = '';
      body.style.overflow = '';
      body.style.overscrollBehavior = '';
      body.style.touchAction = '';
      body.style.height = '';
      body.style.maxHeight = '';
      if (root) {
        root.style.overflow = '';
        root.style.touchAction = '';
        root.style.height = '';
        root.style.maxHeight = '';
      }
    }
    if (isHome && import.meta.env.DEV) {
      const check = () => {
        const docScroll = document.documentElement.scrollHeight > window.innerHeight;
        const bodyScroll = document.body.scrollHeight > window.innerHeight;
        if (docScroll || bodyScroll) {
          console.warn('[WaitMe] Scroll detectado en Home:', { docScroll, bodyScroll });
        }
        window.__WAITME_VALIDATE_SCROLL = () => {
          const d = document.documentElement;
          const b = document.body;
          return {
            docScroll: d.scrollHeight > window.innerHeight,
            bodyScroll: b.scrollHeight > window.innerHeight,
            htmlOverflow: d.style.overflow,
            bodyOverflow: b.style.overflow,
            scrollTop: d.scrollTop || b.scrollTop,
            cardMeasure: window.__WAITME_CARD_MEASURE || {},
            zoomMeasure: window.__WAITME_ZOOM_MEASURE || {},
          };
        };
      };
      const t = setTimeout(check, 500);
      return () => {
        clearTimeout(t);
        html.removeAttribute('data-waitme-home');
        html.style.overflow = html.style.height = html.style.maxHeight = '';
        body.style.overflow =
          body.style.overscrollBehavior =
          body.style.touchAction =
          body.style.height =
          body.style.maxHeight =
            '';
        if (root)
          root.style.overflow =
            root.style.touchAction =
            root.style.height =
            root.style.maxHeight =
              '';
      };
    }
    return () => {
      html.removeAttribute('data-waitme-home');
      html.style.overflow = html.style.height = html.style.maxHeight = '';
      body.style.overflow =
        body.style.overscrollBehavior =
        body.style.touchAction =
        body.style.height =
        body.style.maxHeight =
          '';
      if (root)
        root.style.overflow =
          root.style.touchAction =
          root.style.height =
          root.style.maxHeight =
            '';
    };
  }, [path]);
  RENDER_LOG('LayoutShell ENTER', { path });
  const routeConfig = ROUTE_HEADER[path] || ROUTE_HEADER['/'];
  const ctxConfig = useLayoutHeaderConfig();
  const baseConfig = {
    title: 'WaitMe!',
    showBackButton: false,
    backTo: null,
    onBack: null,
    onTitleClick: null,
    titleClassName: 'text-[24px] leading-[24px]',
  };
  const merged = { ...baseConfig, ...routeConfig, ...ctxConfig };

  const isHomeRoute = path === '/' || path === '/home' || path === '/Home';
  return (
    <div
      className={`flex flex-col bg-black ${isHomeRoute ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}
      style={isHomeRoute ? { overscrollBehavior: 'none' } : undefined}
      data-home-route={isHomeRoute}
    >
      <Header
        title={merged.title}
        showBackButton={merged.showBackButton}
        backTo={merged.backTo}
        onBack={merged.onBack}
        onTitleClick={merged.onTitleClick}
        titleClassName={merged.titleClassName}
      />
      <main className="flex-1 min-h-0 flex flex-col pt-[69px] pb-24">
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense
            fallback={
              <div
                style={{
                  background: '#0B0B0F',
                  height: '100vh',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                Loading WaitMe...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
      <BottomNavLayer>
        <BottomNav />
      </BottomNavLayer>
    </div>
  );
}

export default function Layout() {
  RENDER_LOG('Layout ENTER');
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), layoutMounted: true };
      return () => {
        window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), layoutMounted: false };
      };
    }
  }, []);
  RENDER_LOG('Layout RENDER Routes');
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
          <Route path="alerts" element={<Alertas />} />
          <Route path="navigate" element={<NavigatePage />} />
          {DevDiagnostics && <Route path="dev-diagnostics" element={<DevDiagnostics />} />}
        </Route>
      </Routes>
    </LayoutProvider>
  );
}
