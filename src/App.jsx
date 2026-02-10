import './App.css'
import { Toaster } from "./components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from './lib/query-client'
import { pagesConfig } from './pages.config'
import { Route, Routes } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from './lib/AuthContext'
import UserNotRegisteredError from './components/UserNotRegisteredError'

// ⚠️ Herramientas Base44 (solo en editor)
import VisualEditAgent from './lib/VisualEditAgent'
import AppFlowEngine from './lib/appFlowEngine'
import NavigationTracker from './lib/NavigationTracker'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>

const isBrowser = typeof window !== 'undefined'

// 👉 Detectar editor Base44 (iframe)
const isInEditor = (() => {
  if (!isBrowser) return false
  try {
    return window.self !== window.top
  } catch {
    return false
  }
})()

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout
    ? <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>

const AuthenticatedApp = () => {
  const { authError, navigateToLogin } = useAuth()

  // ⚠️ EN IPHONE: NO redirigir en frío
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />
    }

    if (authError.type === 'auth_required') {
      if (isInEditor) {
        navigateToLogin()
      }
      return null
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

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        {/* App real */}
        <AuthenticatedApp />
        <Toaster />

        {/* SOLO editor Base44 */}
        {isInEditor && (
          <>
            <NavigationTracker />
            <AppFlowEngine />
            <VisualEditAgent />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  )
}