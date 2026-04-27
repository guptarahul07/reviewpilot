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
  HelpCircle,
} from 'lucide-react'
import './AppLayout.css'

/* ─────────────────────────────────────────────
   Navigation Items
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/reviews',      icon: Inbox,       label: 'Reviews Inbox' },
  { to: '/connect',      icon: Link2,       label: 'Connect Google' },
  { to: '/settings',     icon: Settings,    label: 'Settings' },
  { to: '/help-center',  icon: HelpCircle,  label: 'Help Center' },
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

      {/* ── Sidebar (desktop) ───────────────── */}
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
          <div className="topbar__left">
            <Link to="/" className="topbar__brand">
              <Zap size={16} fill="currentColor" />
              ReviewPilot
            </Link>
          </div>

          <div className="topbar__right">
            <span className="topbar__email">
              {user?.email}
            </span>
            <button
              className="topbar__logout"
              onClick={logout}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="app-content">
          <Outlet />
        </main>

        {/* ── Bottom Nav (mobile only) ─────── */}
        <nav className="bottom-nav">
          {!isGoogleConnected && (
            <NavLink to="/connect" className="bottom-nav__alert-dot" title="Connect Google">
              <AlertTriangle size={10} />
            </NavLink>
          )}
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{label === 'Reviews Inbox' ? 'Reviews' : label === 'Connect Google' ? 'Connect' : label === 'Help Center' ? 'Help' : label}</span>
            </NavLink>
          ))}
          <button className="bottom-nav__item" onClick={logout}>
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </nav>

      </div>

    </div>
  )
}
