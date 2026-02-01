import './App.css'
import React, { useEffect, useRef, useMemo } from 'react'
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

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout
    ? <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>

const FullscreenLoader = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-black">
    <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
  </div>
)

// ✅ Evita pantalla blanca en iPhone: desactiva NavigationTracker SOLO en iOS Safari
const SafeNavigationTracker = () => {
  const shouldDisable = useMemo(() => {
    if (typeof window === 'undefined') return true
    const ua = window.navigator?.userAgent || ''
    const isIOS = /iPad|iPhone|iPod/i.test(ua)
    const isIOSBrowser = /CriOS|FxiOS|EdgiOS/i.test(ua) // Chrome/Firefox/Edge iOS
    const isSafari = /Safari/i.test(ua) && !isIOSBrowser
    return isIOS && isSafari
  }, [])

  if (shouldDisable) return null
  return <NavigationTracker />
}

const AuthenticatedApp = () => {
  const {
    loading,
    authError,
    navigateToLogin
  } = useAuth()

  const redirectedRef = useRef(false)

  // ✅ Nunca llames navigateToLogin() durante el render (en iPhone rompe fácil)
  useEffect(() => {
    if (loading) return
    if (!authError) return

    if (authError.type === 'auth_required' && !redirectedRef.current) {
      redirectedRef.current = true
      navigateToLogin()
    }
  }, [loading, authError, navigateToLogin])

  if (loading) return <FullscreenLoader />

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />
    if (authError.type === 'auth_required') return <FullscreenLoader />
  }

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

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SafeNavigationTracker />
          <AuthenticatedApp />
        </Router>

        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App