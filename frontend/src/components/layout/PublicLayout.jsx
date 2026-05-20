import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Zap } from 'lucide-react'
import Button from '../ui/Button'
import './PublicLayout.css'

export default function PublicLayout() {
  const { user } = useAuth()
  
  return (
    <div className="pub-layout">
      <header className="pub-header">
        <nav className="pub-nav container">
          
          {/* Brand Logo */}
          <Link to="/" className="pub-nav__brand">
            <Zap size={20} fill="currentColor" />
            ReviewPilot
          </Link>
          
          {/* Navigation Links */}
          <div className="pub-nav__links">
            <NavLink 
              to="/pricing" 
              className={({ isActive }) => isActive ? 'pub-nav__link active' : 'pub-nav__link'}
            >
              Pricing
            </NavLink>
            
            {/* ADD Contact Link Here */}
            <NavLink 
              to="/contact" 
              className={({ isActive }) => isActive ? 'pub-nav__link active' : 'pub-nav__link'}
            >
              Contact
            </NavLink>
            <NavLink 
              to="/help-center" 
              className={({ isActive }) => isActive ? 'pub-nav__link active' : 'pub-nav__link'}
            >
              Help Center
            </NavLink>
          </div>
          
          {/* CTA Buttons */}
          <div className="pub-nav__cta">
            {user ? (
              <Link to="/reviews">
                <Button size="sm">Open Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
          
        </nav>
      </header>
      
      <main className="pub-main">
        <Outlet />
      </main>
      
      <footer className="pub-footer">
        <div className="pub-footer__inner">
          <div className="pub-footer__brand">
            <span>© 2026 ReviewPilot. All rights reserved.</span>
          </div>
          <div className="pub-footer__links">
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/contact">Contact</a>
            <a href="/help-center">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  )
}