// src/pages/products/PlayStoreReviews.jsx
import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'
import SEOMeta from '../../components/ui/SEOMeta'

const FEATURES = [
  { icon: '📱', title: 'Multi-app inbox', desc: 'All your Android apps in one dashboard. Switch between apps, filter by rating, bulk reply — everything in one place.' },
  { icon: '📈', title: 'Version-wise rating trends', desc: 'See exactly how each app update affected your ratings. Identify which releases improved or hurt user experience.' },
  { icon: '🔧', title: 'Device breakdown analytics', desc: 'Understand which devices are having issues. Prioritise fixes based on where your worst reviews come from.' },
  { icon: '✍️', title: 'AI replies within 350 chars', desc: "Play Store's reply limit is 350 characters. ReviewPilot's AI knows this — every reply is concise and within limit." },
  { icon: '⚡', title: 'Bulk reply support', desc: 'Reply to multiple reviews at once. Great for handling a wave of reviews after a new release.' },
  { icon: '📊', title: 'Sentiment analysis', desc: 'Understand what users love and hate about your app. Track positive/negative trends over time.' },
]

const STEPS = [
  { num: 1, title: 'Connect Play Console', desc: 'Sign in with your Google Play Console account. Add your app package names — done in under 2 minutes.' },
  { num: 2, title: 'App reviews sync automatically', desc: 'ReviewPilot fetches your latest reviews. New reviews appear within 24 hours of posting.' },
  { num: 3, title: 'AI replies — concise & within limit', desc: 'Every reply is generated within Play Store\'s 350-character limit. Approve & post in one click.' },
]

export default function PlayStoreReviews() {
  return (
    <PublicLayout>
      <SEOMeta
        title="Play Store Reviews — ReviewPilot"
        description="AI replies for Android app reviews within Play Store's 350-char limit. Version-wise trends, device breakdown, multi-app inbox."
      />

      {/* Hero */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,92,252,.08)', border: '1px solid rgba(124,92,252,.2)', borderRadius: 100, padding: '5px 14px', fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 20 }}>
            🎮 Play Store Reviews
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 18, letterSpacing: '-.02em', lineHeight: 1.1 }}>
            Your App Reviews, Managed by AI
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
            Reply faster, improve ratings, understand user sentiment per app version. All within Play Store's 350-character reply limit.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/connect"><Button size="lg">Connect Play Console Free</Button></Link>
            <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)', fontWeight: 600, fontSize: 15, textDecoration: 'none', padding: '12px 20px' }}>See Pricing →</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: 48, letterSpacing: '-.02em' }}>
            Built for Android developers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unique insight — version trend */}
      <section style={{ padding: '72px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📈</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-.02em' }}>
              "See how each app update affected your ratings"
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
              ReviewPilot's version vs rating chart shows you exactly which releases improved user satisfaction — and which ones didn't. Fix faster, ship better.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, margin: '0 auto' }}>
              {[{ v: '2.4.1', r: 4.5, color: '#10b981' }, { v: '2.4.0', r: 3.8, color: '#f59e0b' }, { v: '2.3.9', r: 4.2, color: '#10b981' }, { v: '2.3.8', r: 2.9, color: '#ef4444' }].map(({ v, r, color }) => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 50, fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-3)', textAlign: 'right', flexShrink: 0 }}>v{v}</div>
                  <div style={{ flex: 1, height: 12, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(r / 5) * 100}%`, height: '100%', background: color, borderRadius: 6 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', width: 30 }}>{r}★</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 720, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', marginBottom: 48, letterSpacing: '-.02em' }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, textAlign: 'left', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#a78bfa', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{num}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 5 }}>{title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '72px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, letterSpacing: '-.02em' }}>
            Start managing Play reviews today
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.65 }}>
            Free 15-day trial. No credit card required. Works with any Android app on Google Play.
          </p>
          <Link to="/signup"><Button size="lg">Start Free Trial →</Button></Link>
        </div>
      </section>
    </PublicLayout>
  )
}
