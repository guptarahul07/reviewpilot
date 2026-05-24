// src/pages/Billing.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { CreditCard, TrendingUp, FileText, ExternalLink, Zap } from 'lucide-react'

const PLAN_LIMITS = {
  free:         { locations: 1,  reviewsPerMonth: 10,  label: 'Free' },
  starter:      { locations: 1,  reviewsPerMonth: 50,  label: 'Starter' },
  growth:       { locations: 3,  reviewsPerMonth: 200, label: 'Growth' },
  professional: { locations: 10, reviewsPerMonth: Infinity, label: 'Professional' },
  admin:        { locations: Infinity, reviewsPerMonth: Infinity, label: 'Admin' },
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function UsageBar({ used, limit }) {
  if (limit === Infinity) return <span style={{ fontSize: 12, color: 'var(--green)' }}>Unlimited</span>
  const pct = Math.min((used / limit) * 100, 100)
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--accent)'
  return (
    <div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginTop: 6 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 10, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

export default function Billing() {
  const { user }            = useAuth()
  const navigate            = useNavigate()
  const [sub, setSub]       = useState(null)
  const [usage, setUsage]   = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]   = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  useEffect(() => {
    load()
  }, [user])

  async function load() {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const [subRes, usageRes, invRes] = await Promise.all([
        fetch(`${API_URL}/api/billing/subscription-status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/billing/usage`,         { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/billing/invoices`,      { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (subRes.ok)   setSub(await subRes.json())
      if (usageRes.ok) setUsage(await usageRes.json())
      if (invRes.ok)   setInvoices((await invRes.json()).invoices || [])
    } catch (err) {
      console.error('Billing load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/billing/cancel-subscription`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setToast({ type: 'success', message: 'Subscription cancelled. Access continues until period end.' })
        setCancelConfirm(false)
        load()
      } else throw new Error()
    } catch {
      setToast({ type: 'error', message: 'Failed to cancel. Please contact support.' })
    }
  }

  if (loading) return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 140, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    </div>
  )

  const plan      = sub?.plan || 'free'
  const limits    = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const isAdmin   = plan === 'admin'
  const isFree    = plan === 'free'

  return (
    <div style={{ padding: 28, maxWidth: 680 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 4, letterSpacing: '-.02em' }}>
        Billing & Subscription
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 28 }}>
        Manage your plan, usage, and payment history.
      </p>

      {/* ── Current Plan ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <CreditCard size={16} style={{ color: 'var(--ink-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Current Plan</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
                {limits.label}
              </span>
              {isAdmin && (
                <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(124,92,252,.15)', color: '#a78bfa', border: '1px solid rgba(124,92,252,.3)', padding: '3px 10px', borderRadius: 100 }}>
                  👑 Admin
                </span>
              )}
              {!isAdmin && !isFree && sub?.status === 'active' && (
                <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(34,208,138,.1)', color: 'var(--green)', border: '1px solid rgba(34,208,138,.2)', padding: '3px 10px', borderRadius: 100 }}>
                  Active
                </span>
              )}
              {isFree && (
                <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--bg)', color: 'var(--ink-3)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 100 }}>
                  Free
                </span>
              )}
            </div>
            {sub?.billingCycle && (
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                Billed {sub.billingCycle === 'annual' ? 'annually' : 'monthly'}
                {sub.currentPeriodEnd && ` · Renews ${fmt(sub.currentPeriodEnd)}`}
              </div>
            )}
          </div>

          {!isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/checkout">
                <Button size="sm"><Zap size={13} />Upgrade</Button>
              </Link>
              {!isFree && !cancelConfirm && (
                <button
                  onClick={() => setCancelConfirm(true)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              )}
              {cancelConfirm && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Sure?</span>
                  <button onClick={handleCancel} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Yes, cancel</button>
                  <button onClick={() => setCancelConfirm(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Keep</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Usage ── */}
      {usage && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <TrendingUp size={16} style={{ color: 'var(--ink-3)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Usage This Month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Reviews Processed', used: usage.reviewsGenerated, limit: limits.reviewsPerMonth },
              { label: 'Locations Connected', used: usage.locationsConnected, limit: limits.locations },
              { label: 'Replies Posted', used: usage.repliesPosted, limit: Infinity },
            ].map(({ label, used, limit }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                    {used ?? 0} {limit !== Infinity ? `/ ${limit}` : ''}
                  </span>
                </div>
                <UsageBar used={used ?? 0} limit={limit} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 16 }}>
            Resets on the 1st of next month
          </p>
        </div>
      )}

      {/* ── Billing History ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FileText size={16} style={{ color: 'var(--ink-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Billing History</span>
        </div>

        {invoices.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', padding: '24px 0' }}>No invoices yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Description', 'Amount', 'Invoice'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Amount' || h === 'Invoice' ? 'right' : 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 12px', color: 'var(--ink-2)' }}>{fmt(inv.date)}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--ink-2)' }}>{inv.description}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--ink)', fontWeight: 600 }}>₹{inv.amount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                      {inv.invoiceUrl ? (
                        <a href={inv.invoiceUrl} download target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>
                          Download <ExternalLink size={11} />
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
