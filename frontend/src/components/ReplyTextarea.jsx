// src/components/ReplyTextarea.jsx
// Reusable textarea with Google's 4096 char limit counter

const MAX = 4096

export default function ReplyTextarea({ value, onChange, placeholder, rows = 4 }) {
  const remaining = MAX - (value?.length || 0)
  const isOver    = remaining < 0
  const isWarning = remaining >= 0 && remaining < 100

  const counterColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#6b7280'

  return (
    <div style={{ width: '100%' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Write your reply…'}
        rows={rows}
        style={{
          width: '100%',
          background: 'var(--bg)',
          border: `1px solid ${isOver ? '#ef4444' : 'var(--border)'}`,
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 5,
      }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          Google's reply limit: {MAX.toLocaleString()} characters
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: counterColor }}>
          {isOver
            ? `${Math.abs(remaining)} over limit`
            : `${remaining.toLocaleString()} remaining`
          }
        </span>
      </div>
      {isOver && (
        <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
          Reply is too long — shorten it before posting.
        </p>
      )}
    </div>
  )
}
