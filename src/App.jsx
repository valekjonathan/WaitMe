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

const AuthenticatedApp = () => {
  const { loading, authError } = useAuth()

  // ⏳ Mientras carga auth, loader
  if (loading) {
    return <FullscreenLoader />
  }

  // 🚫 Usuario NO registrado (caso real)
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />
  }

  // ✅ CLAVE:
  // auth_required (401 en iPhone) NO bloquea la app
  // Dejamos renderizar TODO
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