// src/pages/products/AppStoreReviews.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import { API_URL } from '../../config/api'

const FEATURES = [
  { emoji: '🤖', title: 'AI replies for iOS reviews', desc: 'Same AI engine as Play Store. Context-aware replies that match your tone — within App Store guidelines.' },
  { emoji: '📈', title: 'iOS version trends', desc: 'See exactly how each iOS release affected your ratings. Ship better updates with data-backed decisions.' },
  { emoji: '📱', title: 'Unified inbox with Play Store', desc: 'Manage iOS and Android reviews side by side. One dashboard, one workflow, zero tab switching.' },
  { emoji: '🌍', title: 'Multi-region support', desc: 'App Store reviews come from every country. Filter, analyse, and reply by region.' },
  { emoji: '⚡', title: 'Bulk reply', desc: 'Reply to multiple App Store reviews at once — especially useful after a new release.' },
  { emoji: '📊', title: 'Sentiment & keyword analysis', desc: 'Understand what iOS users love and hate about your app. Track trends over time.' },
]

export default function AppStoreReviews() {
  const [email, setEmail]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [toast, setToast]           = useState(null)

  async function handleNotify(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/waitlist/insights`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), product: 'app-store-reviews' }),
      })
      if (res.ok) {
        setSubmitted(true)
        setToast({ type: 'success', message: "You're on the list! We'll notify you when App Store Reviews launches." })
      } else throw new Error()
    } catch {
      setToast({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 20 }}>
            🍎 App Store Reviews — COMING SOON
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-.02em', lineHeight: 1.1 }}>
            Apple App Store Reviews —<br />Coming Soon
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>
            AI-powered replies for your iOS app reviews. Unified inbox with Play Store — manage all your app reviews from one dashboard.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.15)', borderRadius: 10, fontSize: 14, color: 'var(--ink-2)' }}>
            🚀 In development — <strong>be first to know when it's live</strong>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: 48, letterSpacing: '-.02em' }}>
            What's coming
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

      {/* Play Store cross-sell */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 28px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎮</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
              Already on Play Store? App Store is next.
            </h3>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: 24 }}>
              If you're already managing your Android reviews with ReviewPilot, App Store will plug right in. One more tab in your existing inbox — no new setup needed.
            </p>
            <Link to="/products/play-store-reviews">
              <Button size="sm">See Play Store Reviews →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Notify form */}
      <section style={{ padding: '72px 0' }}>
        <div className="container" style={{ maxWidth: 480, textAlign: 'center' }}>
          {!submitted ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-.02em' }}>
                Notify me at launch
              </h2>
              <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.65 }}>
                One email when App Store Reviews goes live. No spam.
              </p>
              <form onSubmit={handleNotify} style={{ display: 'flex', gap: 10, maxWidth: 380, margin: '0 auto' }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 16px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? '…' : 'Notify Me →'}
                </Button>
              </form>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--ink)', marginBottom: 12 }}>You're on the list!</h2>
              <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: 28 }}>
                We'll email you the moment App Store Reviews launches.
              </p>
            </div>
          )}

          {/* Cross-sell to trial */}
          <div style={{ marginTop: 32, padding: '18px 22px', background: 'rgba(79,124,255,.06)', border: '1px solid rgba(79,124,255,.15)', borderRadius: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.6 }}>
              While you wait — manage Google & Play Store reviews today. <strong>Free 15-day trial.</strong>
            </p>
            <Link to="/signup">
              <Button size="sm">Start Free Trial →</Button>
            </Link>
          </div>
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
