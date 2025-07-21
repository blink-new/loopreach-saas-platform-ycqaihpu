import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import { SidebarProvider } from './components/ui/sidebar'
import { AppSidebar } from './components/layout/AppSidebar'
import { Header } from './components/layout/Header'
import DashboardPage from './pages/DashboardPage'
import LeadsPage from './pages/LeadsPage'
import CampaignsPage from './pages/CampaignsPage'
import OutreachPage from './pages/OutreachPage'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import LandingPage from './pages/LandingPage'
import OAuthCallback from './components/OAuthCallback'

type User = {
  id: string
  email: string
  displayName?: string
}

type AuthState = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setAuthState({
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated
      })
    })
    return unsubscribe
  }, [])

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <img src="/loopreach-logo.svg" alt="Loopreach.io" className="w-16 h-16 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Loopreach.io...</p>
        </div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  if (!authState.isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/outreach" element={<OutreachPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default App