import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function AuthLoading() {
  return (
    <main className="auth-loading" aria-live="polite">
      <span className="auth-spinner" />
      <strong>Memuatkan RADAS...</strong>
    </main>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  if (!session) return <Navigate replace to="/login" state={{ from: location.pathname }} />
  return children
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading, profileError } = useAuth()
  if (loading) return <AuthLoading />
  if (profileError) return <Navigate replace to="/" />
  if (profile?.role !== 'admin' && profile?.role !== 'editor') return <Navigate replace to="/" />
  return children
}

export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { profile, loading, profileError } = useAuth()
  if (loading) return <AuthLoading />
  if (profileError || profile?.role !== 'admin') return <Navigate replace to="/" />
  return children
}
