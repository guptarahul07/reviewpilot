// src/pages/products/InsightPilot.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import SEOMeta from '../../components/ui/SEOMeta'
import { API_URL } from '../../config/api'

const PLATFORMS = ['Zomato', 'Swiggy', 'Google', 'JustDial', 'Reddit', 'More...']

const FEATURES = [
  { emoji: '🍕', title: 'Your top praised dishes on Zomato', desc: 'Know exactly which menu items customers love — and which to promote.' },
  { emoji: '😤', title: 'Most common complaints on Swiggy', desc: 'Fix issues before they hurt your rating. Track recurring complaints over time.' },
  { emoji: '💬', title: "What Reddit is saying about your area", desc: 'Discover what the internet thinks about your business — beyond star ratings.' },
  { emoji: '🏆', title: 'How you compare to nearby competitors', desc: 'Benchmark your ratings, response rate, and sentiment against competitors in your area.' },
  { emoji: '📋', title: 'Menu item performance insights', desc: 'Data-driven decisions on which items to promote, fix, or remove from your menu.' },
  { emoji: '📊', title: 'All in one AI-powered dashboard', desc: 'One login, all platforms. No switching between apps or tabs.' },
]

export default function InsightPilot() {
  const [email, setEmail]         = useState('')
  const [bizType, setBizType]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [toast, setToast]           = useState(null)

  async function handleWaitlist(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/waitlist/insights`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), businessType: bizType }),
      })
      if (res.ok) {
        setSubmitted(true)
        setToast({ type: 'success', message: "You're on the waitlist! We'll notify you when InsightPilot launches." })
      } else {
        throw new Error()
      }
    } catch {
      setToast({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      <SEOMeta
        title="InsightPilot — Coming Soon | ReviewPilot"
        description="Deep analytics from Zomato, Swiggy, Reddit & more. Know what customers really think. Join the waitlist for early access."
      />

      {/* Hero */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 20 }}>
            📊 InsightPilot — COMING SOON
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-.02em', lineHeight: 1.1 }}>
            Know What Your Customers<br />Really Think
          </h1>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 400, color: 'var(--ink-3)', marginBottom: 20, letterSpacing: '-.01em' }}>
            Across Every Platform
          </h2>
          <p style={{ fontSize: 16, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 16, maxWidth: 540, margin: '0 auto 32px' }}>
            Zomato, Swiggy, Google, JustDial, Reddit — all your reviews analysed by AI. One dashboard for your entire online reputation.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.15)', borderRadius: 10, fontSize: 14, color: 'var(--ink-2)' }}>
            🚀 Estimated launch: <strong>Q3 2026</strong>
          </div>
        </div>
      </section>

      {/* What it will do */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Imagine seeing</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: 48, letterSpacing: '-.02em' }}>
            Your complete reputation, decoded
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ emoji, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 32, letterSpacing: '-.02em' }}>
            Platforms we're integrating
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {PLATFORMS.map(p => (
              <div key={p} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>
                {p}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 16 }}>More platforms coming based on user demand</p>
        </div>
      </section>

      {/* Waitlist form */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 520, textAlign: 'center' }}>
          {!submitted ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-.02em' }}>
                Be the first to know
              </h2>
              <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.65 }}>
                Join the waitlist and get early access when InsightPilot launches. No spam — one email when it's live.
              </p>
              <form onSubmit={handleWaitlist} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380, margin: '0 auto' }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink)', outline: 'none', textAlign: 'center' }}
                />
                <select value={bizType} onChange={e => setBizType(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 14, color: bizType ? 'var(--ink)' : 'var(--ink-3)', outline: 'none' }}>
                  <option value="">Business type (optional)</option>
                  {['Restaurant', 'Cafe', 'Hotel', 'Salon', 'App Developer', 'Retail', 'Other'].map(t => <option key={t} value={t.toLowerCase().replace(' ', '_')}>{t}</option>)}
                </select>
                <Button type="submit" disabled={submitting} size="lg" style={{ width: '100%' }}>
                  {submitting ? 'Joining…' : 'Join Waitlist →'}
                </Button>
              </form>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 12 }}>You're on the list!</h2>
              <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.65 }}>
                We'll email you the moment InsightPilot launches. Estimated: Q3 2026.
              </p>
            </div>
          )}

          {/* Cross-sell */}
          <div style={{ marginTop: 36, padding: '20px 24px', background: 'rgba(79,124,255,.06)', border: '1px solid rgba(79,124,255,.15)', borderRadius: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.6 }}>
              While you wait — manage your Google & Play Store reviews with ReviewPilot. <strong>Free 15-day trial.</strong>
            </p>
            <Link to="/signup">
              <Button size="sm">Start Free Trial →</Button>
            </Link>
          </div>
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PublicLayout>
  )
}
