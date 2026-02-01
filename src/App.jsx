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

/* =========================
   Helpers críticos iOS
   ========================= */
const isEditorEnv = () => {
  if (typeof window === 'undefined') return false
  try {
    // El editor de Base44 corre en iframe
    return window.top !== window.self
  } catch {
    return false
  }
}

const isIOS = () => {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/* ========================= */

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
  const { loading, authError, navigateToLogin } = useAuth()

  if (loading) {
    return <FullscreenLoader />
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />
    }
    if (authError.type === 'auth_required') {
      navigateToLogin()
      return <FullscreenLoader />
    }
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
  const enableEditorTools = isEditorEnv() && !isIOS()

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          {enableEditorTools && <NavigationTracker />}
          <AuthenticatedApp />
        </Router>

        <Toaster />
        {enableEditorTools && <VisualEditAgent />}
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App