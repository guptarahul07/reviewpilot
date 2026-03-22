import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Zap,
  Inbox,
  Settings,
  Link2,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import './AppLayout.css'

/* ─────────────────────────────────────────────
   Navigation Items
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/reviews', icon: Inbox, label: 'Reviews Inbox' },
  { to: '/connect', icon: Link2, label: 'Connect Google' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatName(name) {
  if (!name) return 'User'
  return name
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

/* ─────────────────────────────────────────────
   Layout
───────────────────────────────────────────── */
export default function AppLayout() {
  const { user, profile, logout, isGoogleConnected } = useAuth()

  return (
    <div className="app-layout">

      {/* ── Sidebar ─────────────────────────── */}
      <aside className="sidebar">

        {/* Brand */}
        <Link to="/" className="sidebar__brand">
          <Zap size={18} fill="currentColor" />
          ReviewPilot
        </Link>

        {/* Google connection alert */}
        {!isGoogleConnected && (
          <Link to="/connect" className="sidebar__alert">
            <AlertTriangle size={13} />
            Connect Google
          </Link>
        )}

        {/* Navigation */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={13} className="sidebar__chevron" />
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar__footer">

          <div className="sidebar__user">

            {/* Avatar */}
            <div className="sidebar__avatar">
              {(
                user?.displayName?.charAt(0) ||
                user?.email?.charAt(0) ||
                '?'
              ).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">
                {formatName(
                  user?.displayName || user?.email?.split('@')[0]
                )}
              </p>

              <p className="sidebar__user-plan">
                {profile?.plan === 'pro' ? '⚡ Pro' : 'Free plan'}
              </p>
            </div>

          </div>

          {/* Logout */}
          <button
            className="sidebar__logout"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>

        </div>

      </aside>

      {/* ── Main Area ───────────────────────── */}
      <div className="app-main">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar__breadcrumb" id="topbar-title">
            {/* Page title */}
          </div>

          <div className="topbar__right">
            <span className="topbar__email">
              {user?.email}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="app-content">
          <Outlet />
        </main>

      </div>

    </div>
  )
}
