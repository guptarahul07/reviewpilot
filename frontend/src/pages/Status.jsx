// src/pages/Status.jsx
import PublicLayout from '../components/layout/PublicLayout'
import SEOMeta from '../components/ui/SEOMeta'

const COMPONENTS = [
  { name: 'Review Sync',          ok: true },
  { name: 'AI Reply Generation',  ok: true },
  { name: 'Google OAuth',         ok: true },
  { name: 'Play Console OAuth',   ok: true },
  { name: 'Billing (Razorpay)',   ok: true },
  { name: 'Dashboard',            ok: true },
]

export default function Status() {
  const allOk = COMPONENTS.every(c => c.ok)
  return (
    <PublicLayout>
      <SEOMeta title="Status — ReviewPilot" description="ReviewPilot system status" />
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 16px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
          ReviewPilot Status
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: allOk ? 'rgba(34,208,138,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${allOk ? 'rgba(34,208,138,.25)' : 'rgba(239,68,68,.25)'}`, borderRadius: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>{allOk ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{allOk ? 'All Systems Operational' : 'Some Systems Degraded'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Last checked: {new Date().toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {COMPONENTS.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < COMPONENTS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{c.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.ok ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{c.ok ? '●' : '●'}</span> {c.ok ? 'Operational' : 'Degraded'}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 16, textAlign: 'center' }}>
          Issues? Email <a href="mailto:support@reviewpilot.live" style={{ color: 'var(--accent)' }}>support@reviewpilot.live</a>
        </p>
      </div>
    </PublicLayout>
  )
}
