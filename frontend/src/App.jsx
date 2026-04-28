import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

// Protected pages
import ConnectGoogle from './pages/ConnectGoogle'
import ReviewsInbox from './pages/ReviewsInbox'
import ReviewReply from './pages/ReviewReply'
import Settings from './pages/Settings'
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import TermsOfServicePage from './pages/TermsOfService';
import PrivacyPolicyPage from './pages/PrivacyPolicy';
import HelpCenter from './pages/HelpCenter';
import FreeAudit from './pages/FreeAudit';
import Restaurants from './pages/Restaurants';
import Salons from './pages/Salons';
import Gyms from './pages/Gyms';
import Clinics from './pages/Clinics';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public routes ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
          </Route>

          {/* ── Auth routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Protected app routes ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/connect" element={<ConnectGoogle />} />
            <Route path="/auth/google/callback" element={<ConnectGoogle />} />
            <Route path="/reviews" element={<ReviewsInbox />} />
            <Route path="/reviews/:id" element={<ReviewReply />} />
            <Route path="/settings" element={<Settings />} />
			<Route path="/admin" element={<AdminDashboard />} />

            {/* Default after login */}
            <Route
              path="/dashboard"
              element={<Navigate to="/reviews" replace />}
            />
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
		  
		  <Route element={<PublicLayout />}>
			  <Route path="/" element={<Home />} />
			  <Route path="/pricing" element={<Pricing />} />
			  <Route path="/contact" element={<Contact />} />  {/* ← ADD THIS */}
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/free-audit" element={<FreeAudit />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/cafes" element={<Restaurants />} />
        <Route path="/salons" element={<Salons />} />
        <Route path="/gyms" element={<Gyms />} />
        <Route path="/clinics" element={<Clinics />} />
     	  </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
