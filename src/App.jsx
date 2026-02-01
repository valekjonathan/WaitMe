import './App.css'
import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import { Button } from '@/components/ui/button'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>

const FullscreenLoader = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-black">
    <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
  </div>
)

const FullscreenGate = ({ title, subtitle, actionLabel, onAction, secondaryLabel, onSecondary }) => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-black text-white px-4">
    <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="text-lg font-bold">{title}</div>
      {subtitle ? <div className="text-sm text-gray-400 mt-1">{subtitle}</div> : null}

      <div className="mt-4 flex gap-2">
        {actionLabel ? (
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}

        {secondaryLabel ? (
          <Button variant="outline" className="flex-1 border-white/20 text-white" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  </div>
)

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
    checkAppState
  } = useAuth()

  // 1) Mientras carga estado público o auth → SIEMPRE renderiza loader (evita blanco)
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <FullscreenLoader />
  }

  // 2) Usuario no registrado
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />
  }

  // 3) Login requerido (iPhone necesita gesto del usuario)
  if (authError?.type === 'auth_required') {
    return (
      <FullscreenGate
        title="Inicia sesión para ver WaitMe!"
        subtitle="En iPhone el login debe lanzarse con un toque."
        actionLabel="Iniciar sesión"
        onAction={navigateToLogin}
        secondaryLabel="Reintentar"
        onSecondary={checkAppState}
      />
    )
  }

  // 4) Otros errores → pantalla controlada (nunca blanco)
  if (authError) {
    return (
      <FullscreenGate
        title="No se pudo cargar la app"
        subtitle={authError?.message || 'Error desconocido'}
        actionLabel="Reintentar"
        onAction={checkAppState}
      />
    )
  }

  // 5) App normal
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />

      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>

        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}