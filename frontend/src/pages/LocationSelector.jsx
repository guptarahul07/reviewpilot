// src/pages/LocationSelector.jsx
// Route: /connect/select-locations
// Shown after Google OAuth — user picks which GBP locations to connect

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { MapPin, CheckCircle2, ExternalLink, Zap } from 'lucide-react'

/* ── Plan limits ───────────────────────────────────────────────── */
const PLAN_LIMITS = {
  free:         1,
  trial:        1,
  starter:      1,
  growth:       3,
  pro:          Infinity,
  professional: Infinity,
  admin:        Infinity,
}

function getPlanLimit(plan) {
  return PLAN_LIMITS[plan?.toLowerCase?.()] ?? 1
}

function getPlanLabel(limit) {
  if (limit === 1) return 'Starter'
  if (limit === 3) return 'Growth'
  return 'Pro'
}

/* ── Location card ─────────────────────────────────────────────── */
function LocationCard({ location, checked, onChange, disabled, disabledReason }) {
  const isClosed = location.status === 'CLOSED' || location.permanentlyClosed

  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      background: checked ? 'rgba(79,124,255,.07)' : 'var(--bg)',
      border: `2px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 14, padding: '16px 18px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      transition: 'all .15s',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ accentColor: 'var(--accent)', width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: checked ? 'var(--accent)' : 'var(--ink)' }}>
            {location.name || location.title}
          </span>
          {isClosed && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)' }}>
              🔴 Permanently Closed
            </span>
          )}
        </div>
        {(location.address || location.storefrontAddress) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 13, color: 'var(--ink-3)' }}>
            <MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{location.address || location.storefrontAddress?.addressLines?.join(', ') || ''}</span>
          </div>
        )}
        {location.primaryCategory && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
            {location.primaryCategory}
          </div>
        )}
        {disabledReason && !isClosed && (
          <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>{disabledReason}</div>
        )}
      </div>
      {checked && !disabled && (
        <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
      )}
    </label>
  )
}

/* ── Main component ────────────────────────────────────────────── */
export default function LocationSelector() {
  const { user, subscription }        = useAuth()
  const navigate                      = useNavigate()

  const [locations, setLocations]     = useState([])
  const [selected, setSelected]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [toast, setToast]             = useState(null)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)

  const plan      = subscription?.plan || 'starter'
  const limit     = getPlanLimit(plan)
  const planLabel = getPlanLabel(limit)

  const activeLocations = locations.filter(l => !l.permanentlyClosed && l.status !== 'CLOSED')
  const closedLocations = locations.filter(l =>  l.permanentlyClosed || l.status === 'CLOSED')

  /* ── Fetch locations ── */
  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const token = await user.getIdToken()
        const res   = await fetch(`${API_URL}/api/gbp/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch locations')
        const data = await res.json()
        const locs = data.locations || []

        setLocations(locs)

        // Edge case 1: only 1 active location → auto-connect and skip selector
        const active = locs.filter(l => !l.permanentlyClosed && l.status !== 'CLOSED')
        if (active.length === 1) {
          await autoConnect(active[0].id || active[0].name, token)
          return
        }
      } catch (err) {
        setToast({ type: 'error', message: 'Failed to load locations. Please try again.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function autoConnect(locationId, token) {
    try {
      const t = token || await user.getIdToken()
      await fetch(`${API_URL}/api/gbp/locations/connect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body:    JSON.stringify({ locationIds: [locationId] }),
      })
      navigate('/reviews', { replace: true })
    } catch {
      setLoading(false)
      setToast({ type: 'error', message: 'Auto-connect failed. Please select manually.' })
    }
  }

  function handleToggle(locationId) {
    setShowUpgradeBanner(false)
    if (selected.includes(locationId)) {
      setSelected(prev => prev.filter(id => id !== locationId))
    } else {
      if (selected.length >= limit) {
        setShowUpgradeBanner(true)
        return
      }
      setSelected(prev => [...prev, locationId])
    }
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one location.' })
      return
    }
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/gbp/locations/connect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ locationIds: selected }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'PLAN_LIMIT_EXCEEDED') {
          setShowUpgradeBanner(true)
          return
        }
        if (data.error === 'LOCATION_PERMANENTLY_CLOSED') {
          setToast({ type: 'error', message: 'One or more selected locations are permanently closed.' })
          return
        }
        throw new Error(data.message || 'Failed to connect locations')
      }

      navigate('/reviews', { replace: true })
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Loading skeleton ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ height: 28, width: '60%', background: 'var(--border)', borderRadius: 8, marginBottom: 12, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 16, width: '40%', background: 'var(--border)', borderRadius: 6, marginBottom: 28, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 80, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 12, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    </div>
  )

  /* ── Edge case 2: all locations closed ── */
  if (locations.length > 0 && activeLocations.length === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏚️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 12 }}>
          No active business found
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 28 }}>
          All locations on your Google account are permanently closed. Please register your new business on Google first, then connect here.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://business.google.com"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
          >
            How to add business on Google <ExternalLink size={14} />
          </a>
          <button
            onClick={() => navigate('/reviews')}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Main selector UI ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Header */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--accent)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={22} fill="currentColor" /> ReviewPilot
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-.02em' }}>
          Select your business locations
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 8, lineHeight: 1.65 }}>
          Choose which locations to connect. Reviews from selected locations will appear in your inbox.
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 28 }}>
          {limit === Infinity
            ? `${planLabel} plan — unlimited locations`
            : `${planLabel} plan — select up to ${limit} location${limit > 1 ? 's' : ''}`
          } · {selected.length} selected
        </p>

        {/* Upgrade banner */}
        {showUpgradeBanner && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.25)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          }}>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55, flex: 1 }}>
              {limit === 1
                ? `Your ${planLabel} plan allows 1 location. Upgrade to Growth for up to 3 locations.`
                : `Your ${planLabel} plan allows ${limit} locations. Upgrade to Pro for unlimited locations.`
              }
            </p>
            <a
              href={limit === 1 ? '/checkout?plan=growth' : '/checkout?plan=professional'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Upgrade →
            </a>
          </div>
        )}

        {/* Active locations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: closedLocations.length ? 20 : 28 }}>
          {activeLocations.map(loc => {
            const locId = loc.id || loc.name
            const isChecked = selected.includes(locId)
            const isDisabled = !isChecked && selected.length >= limit
            return (
              <LocationCard
                key={locId}
                location={loc}
                checked={isChecked}
                onChange={() => handleToggle(locId)}
                disabled={isDisabled}
                disabledReason={isDisabled ? `Select up to ${limit} location${limit > 1 ? 's' : ''} on your current plan` : null}
              />
            )
          })}
        </div>

        {/* Closed locations — greyed at bottom */}
        {closedLocations.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              Closed locations (not selectable)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {closedLocations.map(loc => (
                <LocationCard
                  key={loc.id || loc.name}
                  location={loc}
                  checked={false}
                  onChange={() => {}}
                  disabled={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || selected.length === 0}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {submitting
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin .6s linear infinite', display: 'inline-block' }} />
                  Connecting…
                </span>
              : `Connect ${selected.length > 0 ? selected.length : ''} Location${selected.length !== 1 ? 's' : ''} →`
            }
          </Button>
          <button
            onClick={() => navigate('/reviews')}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
          >
            Skip for now
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 16 }}>
          You can change connected locations anytime from Settings.
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
