// src/components/ReplyHistory.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import { CheckCircle, Clock, AlertCircle, XCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react'

const STATUS_MAP = {
  posted:           { icon: CheckCircle, color: '#10b981', label: 'Posted' },
  auto_replied:     { icon: CheckCircle, color: '#10b981', label: 'Auto-posted' },
  posted_auto:      { icon: CheckCircle, color: '#10b981', label: 'Auto-posted' },
  posted_manual:    { icon: CheckCircle, color: '#10b981', label: 'Posted manually' },
  posted_bulk:      { icon: CheckCircle, color: '#10b981', label: 'Bulk posted' },
  draft_ready:      { icon: Clock,       color: '#4f7cff', label: 'Draft ready' },
  pending_approval: { icon: AlertCircle, color: '#f59e0b', label: 'Pending approval' },
  needs_attention:  { icon: AlertCircle, color: '#f59e0b', label: 'Needs attention' },
  failed:           { icon: XCircle,     color: '#ef4444', label: 'Failed' },
}

const FILTERS = ['All', 'Posted', 'Pending', 'Draft', 'Failed']

function getGroup(status) {
  if (!status) return 'draft'
  if (status.includes('posted') || status === 'auto_replied') return 'posted'
  if (status.includes('pending') || status === 'needs_attention') return 'pending'
  if (status.includes('failed')) return 'failed'
  return 'draft'
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Stars({ n }) {
  return <span style={{ color: '#f59e0b', fontSize: 12 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

export default function ReplyHistory() {
  const { user }                    = useAuth()
  const [reviews, setReviews]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('All')
  const [expanded, setExpanded]     = useState({})

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res   = await fetch(`${API_URL}/api/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const sorted = (data.reviews || []).sort((a, b) =>
            new Date(b.updatedAt || b.syncedAt || 0) - new Date(a.updatedAt || a.syncedAt || 0)
          )
          setReviews(sorted)
        }
      } catch (err) {
        console.error('ReplyHistory error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const filtered = reviews.filter(r => {
    if (filter === 'All')     return true
    if (filter === 'Posted')  return getGroup(r.status) === 'posted'
    if (filter === 'Pending') return getGroup(r.status) === 'pending'
    if (filter === 'Draft')   return getGroup(r.status) === 'draft'
    if (filter === 'Failed')  return getGroup(r.status) === 'failed'
    return true
  })

  if (loading) return (
    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', margin: '0 auto 12px',
        border: '2.5px solid rgba(79,124,255,.2)', borderTopColor: 'var(--accent)',
        animation: 'spin .7s linear infinite',
      }} />
      Loading reply history…
    </div>
  )

  const postedCount = reviews.filter(r => getGroup(r.status) === 'posted').length

  return (
    <div>
      {/* Header + filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 2 }}>
            Reply History
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {reviews.length} total · {postedCount} posted
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Filter size={12} style={{ color: 'var(--ink-3)' }} />
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 12.5, fontWeight: 600,
              border: filter === f ? 'none' : '1px solid var(--border)',
              background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--ink-3)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .15s',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}reviews found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(review => {
            const cfg  = STATUS_MAP[review.status] || STATUS_MAP['draft_ready']
            const Icon = cfg.icon
            const open = expanded[review.id]

            return (
              <div key={review.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Summary row */}
                <div
                  onClick={() => setExpanded(p => ({ ...p, [review.id]: !p[review.id] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
                >
                  <Icon size={18} style={{ color: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>
                        {review.reviewer || 'Anonymous'}
                      </span>
                      <Stars n={review.rating} />
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: cfg.color + '18', color: cfg.color,
                      }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.text || 'No review text'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 4 }}>
                      {fmt(review.updatedAt || review.syncedAt)}
                    </div>
                    {open ? <ChevronUp size={15} style={{ color: 'var(--ink-3)' }} /> : <ChevronDown size={15} style={{ color: 'var(--ink-3)' }} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {open && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--bg)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Mode</div>
                        <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{review.mode || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Synced</div>
                        <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{fmt(review.syncedAt)}</div>
                      </div>
                    </div>
                    {review.aiReply && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>AI Reply</div>
                        <div style={{
                          fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '10px 14px',
                        }}>{review.aiReply}</div>
                      </div>
                    )}
                    {review.existingReply && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Posted Reply</div>
                        <div style={{
                          fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6,
                          background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.2)',
                          borderLeft: '3px solid #10b981', borderRadius: 8, padding: '10px 14px',
                        }}>{review.existingReply}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
