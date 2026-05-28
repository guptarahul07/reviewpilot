import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps routes that require authentication.
 * Redirects to /login, preserving the attempted URL in state.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, isExpired } = useAuth()
  const location = useLocation()

  console.log('[ProtectedRoute] loading:', loading, '| user:', user?.email ?? 'null', '| path:', location.pathname)

  // Wait for Auth to restore session before deciding to redirect
  // Without this, redirect users get sent to /login before onAuthStateChanged fires
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0c0f', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(14,165,160,.2)',
          borderTopColor: '#0ea5a0',
          animation: 'spin .7s linear infinite',
        }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Task 4: Redirect expired users to pricing
  const freePaths = ['/pricing', '/checkout', '/settings/billing']
  if (isExpired && !freePaths.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/pricing" replace />
  }

  return children
}
