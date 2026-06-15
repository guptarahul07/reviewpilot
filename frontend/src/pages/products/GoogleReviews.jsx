// src/pages/products/GoogleReviews.jsx
import { Link } from 'react-router-dom'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/ui/Button'
import SEOMeta from '../../components/ui/SEOMeta'

const FEATURES = [
  { icon: '🤖', title: 'AI-generated replies in your tone', desc: 'Choose Professional, Friendly, or Apologetic — AI generates contextual replies that sound like you.' },
  { icon: '⚡', title: 'Auto/Semi-Auto/Manual modes', desc: 'Auto-post 4-5★ replies, approve 1-3★ manually, or handle everything yourself. You choose the level of automation.' },
  { icon: '📍', title: 'Multi-location support', desc: 'Manage reviews across all your business locations from one dashboard. Growth plan includes 3 locations.' },
  { icon: '📊', title: 'Sentiment dashboard', desc: 'See positive/neutral/negative breakdown, keyword trends, response rate vs industry average.' },
  { icon: '🔔', title: 'Bulk reply', desc: 'Select multiple reviews and post AI replies in one click. Save hours every week.' },
  { icon: '📈', title: 'Response rate tracking', desc: 'See how your response rate compares to industry averages. Get actionable insights to improve.' },
]

const STEPS = [
  { num: 1, title: 'Connect Google Business', desc: 'Sign in with the Google account linked to your Business Profile. Takes 30 seconds.' },
  { num: 2, title: 'Reviews appear in your inbox', desc: 'ReviewPilot syncs your reviews automatically every day. New reviews appear in real-time.' },
  { num: 3, title: 'AI generates reply — you approve & post', desc: 'One click to post. Or set Auto mode and let ReviewPilot handle everything.' },
]

const PLANS = [
  { name: 'Starter', price: 499, period: 'mo', features: ['1 GBP location', 'Unlimited reviews', 'AI replies', '24h sync', 'Email support'], popular: false },
  { name: 'Growth', price: 999, period: 'mo', features: ['3 locations', 'Everything in Starter', 'Advanced analytics', 'WhatsApp support', '30-min onboarding call'], popular: true },
  { name: 'Pro', price: 1999, period: 'mo', features: ['Unlimited locations', 'Everything in Growth', 'Custom reports', 'Dedicated manager', 'API access'], popular: false },
]

export default function GoogleReviews() {
  return (
    <PublicLayout>
      <SEOMeta
        title="Google Business Reviews — ReviewPilot"
        description="Manage and reply to your Google Business reviews with AI. Auto-sync, bulk reply, sentiment analysis. Built for Indian businesses."
      />

      {/* Hero */}
      <section style={{ padding: '80px 0 64px', textAlign: 'center', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,124,255,.08)', border: '1px solid rgba(79,124,255,.2)', borderRadius: 100, padding: '5px 14px', fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 20 }}>
            ⭐ Google Business Reviews
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 18, letterSpacing: '-.02em', lineHeight: 1.1 }}>
            Never Miss a Google Review Again
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
            AI-powered replies, sentiment analysis, multi-location support. Respond to every review in seconds — not hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup"><Button size="lg">Start Free Trial — 15 days, no credit card</Button></Link>
            <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)', fontWeight: 600, fontSize: 15, textDecoration: 'none', padding: '12px 20px' }}>See Pricing →</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: 48, letterSpacing: '-.02em' }}>
            Everything you need
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

      {/* How it works */}
      <section style={{ padding: '72px 0' }}>
        <div className="container" style={{ maxWidth: 720, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', marginBottom: 48, letterSpacing: '-.02em' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-display)' }}>{num}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{ padding: '72px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', marginBottom: 12, letterSpacing: '-.02em' }}>Simple pricing</h2>
          <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--ink-3)', marginBottom: 48 }}>Start free for 15 days. No credit card required.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 860, margin: '0 auto' }}>
            {PLANS.map(({ name, price, features, popular }) => (
              <div key={name} style={{ background: 'var(--bg)', border: `${popular ? '2px solid var(--accent)' : '1px solid var(--border)'}`, borderRadius: 16, padding: 24, position: 'relative' }}>
                {popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '3px 12px', borderRadius: 100 }}>Most Popular</div>}
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{name}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>₹{price}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)' }}>/mo</span></div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {features.map(f => <li key={f} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 7 }}><span style={{ color: 'var(--green)' }}>✓</span>{f}</li>)}
                </ul>
                <Link to={`/checkout?plan=${name.toLowerCase()}&billing=monthly`}>
                  <Button variant={popular ? 'primary' : 'ghost'} style={{ width: '100%' }}>Get Started</Button>
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--ink-3)' }}>
            <Link to="/pricing" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>See full pricing with annual plans & bundles →</Link>
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '72px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, letterSpacing: '-.02em' }}>
            Ready to manage your reviews smarter?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.65 }}>
            Join 100+ Indian businesses already using ReviewPilot. Start free — no credit card needed.
          </p>
          <Link to="/signup"><Button size="lg">Start Free Trial →</Button></Link>
        </div>
      </section>
    </PublicLayout>
  )
}
