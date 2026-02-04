// src/App.jsx
import './App.css'
import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import { Button } from '@/components/ui/button'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : null

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>

const FullscreenLoader = ({ text = 'Cargando…' }) => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-black text-white gap-3 px-6">
    <p className="text-sm text-gray-300 text-center">{text}</p>
  </div>
)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || String(err) }
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center px-6 gap-3">
          <p className="text-sm text-gray-300 text-center">Error cargando la app</p>
          <pre className="text-xs text-red-300 whitespace-pre-wrap text-center max-w-[520px]">
            {this.state.message}
          </pre>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => window.location.reload()}
          >
            Recargar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

const AuthenticatedApp = () => {
  const { loading, authError, navigateToLogin } = useAuth()

  if (loading) return <FullscreenLoader text="Cargando sesión…" />

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />
  }

  if (authError?.type === 'auth_required') {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-sm text-gray-300 text-center">
          Safari no te ha autenticado. Inicia sesión y vuelve.
        </p>
        <div className="flex gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={navigateToLogin}>
            Iniciar sesión
          </Button>
          <Button
            variant="outline"
            className="border-white/30 bg-white/10"
            onClick={() => window.location.reload()}
          >
            Recargar
          </Button>
        </div>
      </div>
    )
  }

  if (!MainPage) {
    return <FullscreenLoader text="No hay página principal configurada." />
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

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ErrorBoundary>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </ErrorBoundary>
      </QueryClientProvider>
    </AuthProvider>
  )
}