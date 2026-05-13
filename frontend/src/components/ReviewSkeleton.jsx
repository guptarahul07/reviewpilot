// src/components/ReviewSkeleton.jsx
// Loading skeleton cards shown while reviews are being fetched

export function ReviewCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 22px',
      marginBottom: 12, animation: 'skeletonPulse 1.5s ease-in-out infinite',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: '40%', background: 'var(--border)', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ height: 12, width: '25%', background: 'var(--border)', borderRadius: 6 }} />
        </div>
        <div style={{ height: 22, width: 70, background: 'var(--border)', borderRadius: 100 }} />
      </div>
      {/* Text lines */}
      <div style={{ height: 13, width: '100%', background: 'var(--border)', borderRadius: 6, marginBottom: 7 }} />
      <div style={{ height: 13, width: '80%',  background: 'var(--border)', borderRadius: 6, marginBottom: 7 }} />
      <div style={{ height: 13, width: '60%',  background: 'var(--border)', borderRadius: 6 }} />
    </div>
  )
}

export function InsightsCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      marginBottom: 20, animation: 'skeletonPulse 1.5s ease-in-out infinite',
      display: 'flex', gap: 32, flexWrap: 'wrap',
    }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ height: 28, width: 60, background: 'var(--border)', borderRadius: 8, marginBottom: 6, margin: '0 auto 6px' }} />
          <div style={{ height: 12, width: 80, background: 'var(--border)', borderRadius: 6, margin: '0 auto' }} />
        </div>
      ))}
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div style={{ maxWidth: 700 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', marginBottom: 16, overflow: 'hidden',
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <div style={{ height: 12, width: 120, background: 'var(--border)', borderRadius: 6 }} />
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ height: 14, width: '70%', background: 'var(--border)', borderRadius: 6, marginBottom: 10 }} />
            <div style={{ height: 14, width: '50%', background: 'var(--border)', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Inject keyframes once
const style = document.createElement('style')
style.textContent = `
  @keyframes skeletonPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
`
if (!document.head.querySelector('[data-skeleton]')) {
  style.setAttribute('data-skeleton', '1')
  document.head.appendChild(style)
}
