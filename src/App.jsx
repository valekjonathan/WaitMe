import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import AppFlowEngine from '@/lib/appFlowEngine'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { Route, Routes } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'

const { Pages, Layout, mainPage } = pagesConfig
const mainPageKey = mainPage ?? Object.keys(Pages)[0]
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>

// ✅ Solo activar herramientas del editor cuando estamos dentro del iframe del editor
const isBrowser = typeof window !== 'undefined'
const isInEditorIframe = (() => {
  if (!isBrowser) return false
  try {
    return window.self !== window.top
  } catch {
    // Si Safari bloquea el acceso a window.top en algún contexto raro, asumimos NO editor
    return false
  }
})()

const AuthenticatedApp = () => {
  const { authError, navigateToLogin } = useAuth()

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />
    if (authError.type === 'auth_required') {
      navigateToLogin()
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

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        {/* ✅ Esto sí debe ejecutarse siempre */}
        <AuthenticatedApp />
        <Toaster />

        {/* ✅ Esto SOLO en el editor (iframe). En iPhone live lo quitamos para evitar pantalla blanca */}
        {isInEditorIframe && (
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

export default App