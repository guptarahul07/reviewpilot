import { Outlet, NavLink, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  CreditCard,
  ShieldCheck,
  Tag,
  MessageSquare,
  BarChart2,
  UserCircle,
} from 'lucide-react'
import './AppLayout.css'

/* ─────────────────────────────────────────────
   Navigation Items
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/reviews',      icon: Inbox,       label: 'Reviews Inbox' },
  { to: '/connect',      icon: Link2,       label: 'Connect Google' },
  { to: '/settings',          icon: Settings,    label: 'Settings' },
  { to: '/settings/profile',   icon: UserCircle,  label: 'My Profile' },
  { to: '/settings/billing',  icon: CreditCard,  label: 'Billing' },
  { to: '/help-center',  icon: HelpCircle,  label: 'Help Center' },
]

const ADMIN_EMAIL = 'guptarahul07@gmail.com'

const ADMIN_ITEMS = [
  { to: '/admin',          icon: BarChart2,    label: 'Analytics' },
  { to: '/admin/coupons',  icon: Tag,          label: 'Coupons' },
  { to: '/admin/messages', icon: MessageSquare,label: 'Site Messages' },
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
  const { user, profile, logout, isGoogleConnected, isTrialActive, isExpired, trialDaysLeft, subscription } = useAuth()
  const [notifications, setNotifications] = useState([])

  // Build priority-ordered notification banners
  useEffect(() => {
    const banners = []

    // 1. CRITICAL — payment failed
    if (subscription?.status === 'payment_failed') {
      banners.push({
        id: 'payment_failed',
        bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.3)', color: '#fca5a5',
        icon: '⚠️',
        text: 'Your payment failed. Please update your payment method to avoid service interruption.',
        cta: 'Fix Now', ctaHref: '/settings/billing',
      })
    }

    // 2. URGENT — trial expiring soon
    if (isTrialActive && trialDaysLeft !== null && trialDaysLeft <= 3) {
      banners.push({
        id: 'trial_urgent',
        bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.25)', color: '#fca5a5',
        icon: '⏰',
        text: trialDaysLeft === 0 ? 'Your free trial ends today!' : `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}.`,
        cta: 'Upgrade Now', ctaHref: '/checkout',
      })
    }

    // 3. Trial expired
    if (isExpired) {
      banners.push({
        id: 'expired',
        bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.25)', color: '#fca5a5',
        icon: '🔒',
        text: 'Your free trial has ended. Please select a plan to continue.',
        cta: 'Choose a Plan', ctaHref: '/pricing',
      })
    }

    // 4. ACTION — not connected
    if (!isGoogleConnected && !isExpired) {
      banners.push({
        id: 'connect',
        bg: 'rgba(245,166,35,.08)', border: 'rgba(245,166,35,.25)', color: '#fcd34d',
        icon: '🔗',
        text: 'Connect your Google Business account to start syncing reviews.',
        cta: 'Connect Now', ctaHref: '/connect',
      })
    }

    setNotifications(banners)
  }, [subscription, isTrialActive, isExpired, trialDaysLeft, isGoogleConnected])

  return (
    <div className="app-layout">

      {/* ── Sidebar (desktop) ───────────────── */}
      <aside className="sidebar">

        {/* Brand */}
        <Link to="/" className="sidebar__brand">
          <Zap size={18} fill="currentColor" />
          ReviewPilot
        </Link>



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

          {/* Admin section — only visible to admin */}
          {user?.email === ADMIN_EMAIL && (
            <>
              <div className="sidebar__section-label">
                <ShieldCheck size={11} />
                Admin
              </div>
              {ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `sidebar__link sidebar__link--admin ${isActive ? 'sidebar__link--active' : ''}`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  <ChevronRight size={13} className="sidebar__chevron" />
                </NavLink>
              ))}
            </>
          )}
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

        {/* In-app notification banners — priority ordered */}
        {notifications.length > 0 && (
          <div style={{ padding: '8px 20px 0' }}>
            {notifications.slice(0, 1).map(n => (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, flexWrap: 'wrap',
                background: n.bg, border: `1px solid ${n.border}`,
                borderRadius: 10, padding: '10px 16px', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                  <span style={{ fontSize: 13.5, color: n.color, lineHeight: 1.5 }}>{n.text}</span>
                </div>
                <a href={n.ctaHref} style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: 'rgba(255,255,255,.12)', color: n.color,
                  textDecoration: 'none', borderRadius: 7, padding: '6px 14px',
                  fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                  border: `1px solid ${n.border}`,
                }}>
                  {n.cta} →
                </a>
              </div>
            ))}
          </div>
        )}

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
