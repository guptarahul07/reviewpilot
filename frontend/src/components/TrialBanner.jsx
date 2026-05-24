// src/components/TrialBanner.jsx
// Shows trial status banner on dashboard
// Only visible when user is on trial plan

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Clock } from 'lucide-react'

export default function TrialBanner() {
  const { subscription, trialDaysLeft, isTrialActive } = useAuth()

  if (!isTrialActive || trialDaysLeft === null) return null

  const isUrgent = trialDaysLeft <= 7
  const isWarning = trialDaysLeft <= 14

  const bg     = isUrgent  ? 'rgba(239,68,68,.08)'    : isWarning ? 'rgba(245,166,35,.08)' : 'rgba(79,124,255,.08)'
  const border = isUrgent  ? 'rgba(239,68,68,.25)'    : isWarning ? 'rgba(245,166,35,.25)' : 'rgba(79,124,255,.2)'
  const color  = isUrgent  ? '#fca5a5'                : isWarning ? '#fcd34d'              : '#93b4ff'
  const icon   = isUrgent  ? '🚨'                     : isWarning ? '⏳'                   : '🎉'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: '12px 18px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
            {trialDaysLeft === 0
              ? 'Your free trial ends today!'
              : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`
            }
          </span>
          {subscription?.isBetaUser && (
            <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 }}>
              Beta user · Full access included
            </span>
          )}
        </div>
      </div>
      <Link
        to="/checkout"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: isUrgent ? '#ef4444' : 'var(--accent)',
          color: '#fff', textDecoration: 'none',
          borderRadius: 8, padding: '7px 16px',
          fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <Zap size={13} />
        Upgrade Now
      </Link>
    </div>
  )
}
