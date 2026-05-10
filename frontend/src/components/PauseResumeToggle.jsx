// src/components/PauseResumeToggle.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import { PauseCircle, PlayCircle } from 'lucide-react'

export default function PauseResumeToggle({ replyMode }) {
  const { user }              = useAuth()
  const [paused, setPaused]   = useState(false)
  const [saving, setSaving]   = useState(false)

  // Only show for auto or semi-auto mode
  if (replyMode === 'manual' || !replyMode) return null

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res   = await fetch(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setPaused(data.settings?.paused ?? false)
        }
      } catch { /* ignore */ }
    }
    load()
  }, [user])

  async function toggle() {
    setSaving(true)
    const next = !paused
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/settings`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ paused: next }),
      })
      setPaused(next)
    } catch (err) {
      console.error('Pause toggle error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (paused) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
        background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.3)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <PauseCircle size={17} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              Auto-posting is paused
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 8 }}>
              Reviews are queuing but no replies will post automatically.
            </span>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#10b981', color: '#fff', border: 'none',
            borderRadius: 8, padding: '7px 14px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', opacity: saving ? 0.7 : 1,
          }}
        >
          <PlayCircle size={14} />
          {saving ? 'Resuming…' : 'Resume'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title="Pause auto-posting without changing your settings"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: '1px solid var(--border)',
        borderRadius: 8, padding: '6px 12px',
        fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)',
        cursor: 'pointer', fontFamily: 'var(--font-body)',
        transition: 'all .15s',
      }}
    >
      <PauseCircle size={13} />
      {saving ? 'Pausing…' : 'Pause auto-posting'}
    </button>
  )
}
