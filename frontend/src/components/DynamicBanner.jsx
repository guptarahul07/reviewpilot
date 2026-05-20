// src/components/DynamicBanner.jsx
// Real-time banner from Firestore config/site-messages
// Usage: <DynamicBanner location="pricing-banner" />

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { X } from 'lucide-react'

const COLORS = {
  info:    { bg: 'rgba(79,124,255,.1)',  border: 'rgba(79,124,255,.3)',  text: '#93b4ff', accent: '#4f7cff' },
  success: { bg: 'rgba(34,208,138,.08)', border: 'rgba(34,208,138,.25)', text: '#6ee7b7', accent: '#22d08a' },
  warning: { bg: 'rgba(245,166,35,.08)', border: 'rgba(245,166,35,.25)', text: '#fcd34d', accent: '#f59e0b' },
  error:   { bg: 'rgba(239,68,68,.08)',  border: 'rgba(239,68,68,.25)',  text: '#fca5a5', accent: '#ef4444' },
}

export default function DynamicBanner({ location }) {
  const [banner, setBanner]       = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'config', 'site-messages')
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const b    = data?.[location]

      if (b?.enabled) {
        const now   = Date.now()
        const start = b.startDate?.toMillis?.() ?? 0
        const end   = b.endDate?.toMillis?.()   ?? Infinity
        setBanner(now >= start && now <= end ? b : null)
      } else {
        setBanner(null)
      }
    }, () => setBanner(null)) // silently ignore errors

    return () => unsub()
  }, [location])

  if (!banner || dismissed) return null

  const colors = COLORS[banner.type] || COLORS.info

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '12px 18px',
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 10, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <span style={{ fontSize: 15 }}>
          {banner.type === 'success' ? '✅' : banner.type === 'warning' ? '⚠️' : banner.type === 'error' ? '🚨' : 'ℹ️'}
        </span>
        <p style={{ fontSize: 13.5, color: colors.text, lineHeight: 1.5, margin: 0 }}>
          {banner.message}
          {banner.link && (
            <a
              href={banner.link}
              style={{ color: colors.accent, marginLeft: 8, fontWeight: 600, textDecoration: 'underline' }}
            >
              {banner.linkText || 'Learn more'}
            </a>
          )}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.text, opacity: 0.6, padding: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
