import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getRedirectResult } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './services/firebase'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './router/ProtectedRoute'

// Layouts
import PublicLayout from './components/layout/PublicLayout'
import AppLayout from './components/layout/AppLayout'

// Public pages
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Contact from './pages/Contact'
import TermsOfServicePage from './pages/TermsOfService'
import PrivacyPolicyPage from './pages/PrivacyPolicy'
import HelpCenter from './pages/HelpCenter'
import FreeAudit from './pages/FreeAudit'
import Restaurants from './pages/Restaurants'
import Salons from './pages/Salons'
import Gyms from './pages/Gyms'
import Clinics from './pages/Clinics'

// Protected pages
import ConnectGoogle from './pages/ConnectGoogle'
import ReviewsInbox from './pages/ReviewsInbox'
import ReviewReply from './pages/ReviewReply'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  /* ── Handle Google OAuth redirect result ── */
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return // No redirect result — normal page load
        const user = result.user

        // Create Firestore profile if first-time Google sign-in
        const ref  = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          await setDoc(ref, {
            uid:       user.uid,
            email:     user.email,
            name:      user.displayName || 'User',
            plan:      'free',
            createdAt: serverTimestamp(),
          })
        }
        // AuthContext will pick up the signed-in user automatically
        // Navigation handled by ProtectedRoute redirecting to /connect or /reviews
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err)
      })
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public routes (all under PublicLayout) ── */}
          <Route element={<PublicLayout />}>
            <Route path="/"             element={<Home />} />
            <Route path="/pricing"      element={<Pricing />} />
            <Route path="/contact"      element={<Contact />} />
            <Route path="/terms"        element={<TermsOfServicePage />} />
            <Route path="/privacy"      element={<PrivacyPolicyPage />} />
            <Route path="/help-center"  element={<HelpCenter />} />
            <Route path="/free-audit"   element={<FreeAudit />} />
            <Route path="/restaurants"  element={<Restaurants />} />
            <Route path="/cafes"        element={<Restaurants />} />
            <Route path="/salons"       element={<Salons />} />
            <Route path="/gyms"         element={<Gyms />} />
            <Route path="/clinics"      element={<Clinics />} />
          </Route>

          {/* ── Auth routes ── */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Protected app routes ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/connect"             element={<ConnectGoogle />} />
            <Route path="/auth/google/callback" element={<ConnectGoogle />} />
            <Route path="/reviews"             element={<ReviewsInbox />} />
            <Route path="/reviews/:id"         element={<ReviewReply />} />
            <Route path="/settings"            element={<Settings />} />
            <Route path="/admin"               element={<AdminDashboard />} />
            <Route path="/dashboard"           element={<Navigate to="/reviews" replace />} />
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
