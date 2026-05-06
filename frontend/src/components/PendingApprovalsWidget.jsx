// src/components/PendingApprovalsWidget.jsx
// Shows a banner when there are reviews pending approval in semi-auto mode

import { AlertCircle, ChevronRight } from 'lucide-react'

export default function PendingApprovalsWidget({ reviews, replyMode, onFilterPending }) {
  // Only show in semi-auto mode
  if (replyMode !== 'semi-auto') return null

  const pending = reviews.filter(r => r.status === 'needs_attention')
  if (pending.length === 0) return null

  const preview = pending.slice(0, 3)

  return (
    <div style={{
      background: 'rgba(245,166,35,.08)',
      border: '1px solid rgba(245,166,35,.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <AlertCircle size={18} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            {pending.length} {pending.length === 1 ? 'review needs' : 'reviews need'} your approval
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
            1–3★ reviews are held for your review before posting
          </div>
        </div>
        <button
          onClick={onFilterPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--amber)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)',
            padding: '6px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}
        >
          Review All <ChevronRight size={14} />
        </button>
      </div>

      {/* Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {preview.map(review => (
          <div
            key={review.id}
            onClick={onFilterPending}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: 13, flexShrink: 0 }}>
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </span>
            <span style={{
              fontSize: 13, color: 'var(--ink-2)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {review.comment || review.text || 'No comment text'}
            </span>
            <ChevronRight size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          </div>
        ))}
        {pending.length > 3 && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center', paddingTop: 4 }}>
            +{pending.length - 3} more pending
          </div>
        )}
      </div>
    </div>
  )
}
