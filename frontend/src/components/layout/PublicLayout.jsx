import { Outlet, Link, NavLink } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Zap } from 'lucide-react'
import Button from '../ui/Button'
import './PublicLayout.css'

export default function PublicLayout() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
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

            {/* Products dropdown */}
            <div className="pub-nav__dropdown" ref={dropdownRef}>
              <button
                className="pub-nav__link pub-nav__dropdown-trigger"
                onClick={() => setDropdownOpen(o => !o)}
                aria-expanded={dropdownOpen}
              >
                Products {dropdownOpen ? '▴' : '▾'}
              </button>
              <div className={`pub-nav__dropdown-menu${dropdownOpen ? ' pub-nav__dropdown-menu--open' : ''}`}>
                <Link to="/products/google-reviews" className="pub-nav__dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span>⭐</span>
                  <div>
                    <div className="pub-nav__dropdown-item-title">Google Business Reviews</div>
                    <div className="pub-nav__dropdown-item-desc">Manage & reply to Google reviews</div>
                  </div>
                </Link>
                <Link to="/products/play-store-reviews" className="pub-nav__dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span>🎮</span>
                  <div>
                    <div className="pub-nav__dropdown-item-title">Play Store Reviews</div>
                    <div className="pub-nav__dropdown-item-desc">AI replies for Android apps</div>
                  </div>
                </Link>
                <Link to="/products/insightspilot" className="pub-nav__dropdown-item pub-nav__dropdown-item--soon" onClick={() => setDropdownOpen(false)}>
                  <span>📊</span>
                  <div>
                    <div className="pub-nav__dropdown-item-title">InsightPilot <span className="pub-nav__soon-badge">Soon</span></div>
                    <div className="pub-nav__dropdown-item-desc">Zomato, Swiggy & more</div>
                  </div>
                </Link>
              </div>
            </div>

            <NavLink to="/pricing" className={({ isActive }) => isActive ? 'pub-nav__link active' : 'pub-nav__link'}>
              Pricing
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => isActive ? 'pub-nav__link active' : 'pub-nav__link'}>
              Contact
            </NavLink>
            <NavLink to="/help-center" className={({ isActive }) => isActive ? 'pub-nav__link active' : 'pub-nav__link'}>
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