// src/components/ReplyTextarea.jsx
// Reusable textarea with character counter
// Supports both GBP (4096 char) and Play Store (350 char) limits

const LIMITS = {
  google_business: 4096,
  google_play:     350,
  default:         4096,
}

export default function ReplyTextarea({ value, onChange, placeholder, rows = 4, platform = 'default' }) {
  const MAX       = LIMITS[platform] || LIMITS.default
  const remaining = MAX - (value?.length || 0)
  const isOver    = remaining < 0
  const isWarning = !isOver && remaining < (platform === 'google_play' ? 70 : 100)
  const isNear    = !isOver && !isWarning && remaining < (platform === 'google_play' ? 120 : 200)

  const counterColor = isOver ? '#ef4444' : isWarning ? '#ef4444' : isNear ? '#f59e0b' : '#6b7280'
  const borderColor  = isOver ? '#ef4444' : 'var(--border)'

  const platformLabel = platform === 'google_play'
    ? `Play Store limit: ${MAX} characters`
    : `Google's reply limit: ${MAX.toLocaleString()} characters`

  return (
    <div style={{ width: '100%' }}>
      {platform === 'google_play' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, color: 'var(--ink-3)' }}>
          <span>🎮</span>
          <span>Play Store reply — keep under 350 characters</span>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Write your reply…'}
        rows={rows}
        style={{
          width: '100%',
          background: 'var(--bg)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius)',
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: 13.5,
          color: 'var(--ink)',
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color .2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { if (!isOver) e.target.style.borderColor = 'var(--accent)' }}
        onBlur={e  => { e.target.style.borderColor = isOver ? '#ef4444' : 'var(--border)' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{platformLabel}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: counterColor }}>
          {isOver ? `${Math.abs(remaining)} over limit` : `${remaining.toLocaleString()} remaining`}
        </span>
      </div>
      {isOver && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Reply is too long — shorten it before posting.</p>}
      {isWarning && !isOver && platform === 'google_play' && <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Almost at Play Store's 350-character limit.</p>}
    </div>
  )
}
