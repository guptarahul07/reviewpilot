// src/pages/AdminMessages.jsx
import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/ui/Toast'
import Button from '../components/ui/Button'
import { Eye, EyeOff, Save } from 'lucide-react'

const LOCATIONS = [
  { key: 'homepage-banner',       label: 'Homepage Banner',        desc: 'Shown at the top of the public homepage' },
  { key: 'pricing-banner',        label: 'Pricing Banner',         desc: 'Shown on the pricing page (e.g. limited offer)' },
  { key: 'dashboard-announcement',label: 'Dashboard Announcement', desc: 'Shown inside the app for logged-in users' },
  { key: 'maintenance-notice',    label: 'Maintenance Notice',     desc: 'Shown site-wide during downtime' },
]

const TYPE_COLORS = {
  info:    { bg: 'rgba(79,124,255,.1)',  text: '#93b4ff', label: 'Info (Blue)' },
  success: { bg: 'rgba(34,208,138,.08)', text: '#6ee7b7', label: 'Success (Green)' },
  warning: { bg: 'rgba(245,166,35,.08)', text: '#fcd34d', label: 'Warning (Yellow)' },
  error:   { bg: 'rgba(239,68,68,.08)',  text: '#fca5a5', label: 'Error (Red)' },
}

function toDatetimeLocal(val) {
  if (!val) return ''
  try {
    const d = val?.toDate ? val.toDate() : new Date(val)
    return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  } catch { return '' }
}

function MessageEditor({ locationKey, label, desc }) {
  const { user }          = useAuth()
  const [msg, setMsg]     = useState({ enabled: false, message: '', type: 'info', link: '', linkText: '', startDate: '', endDate: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'config', 'site-messages'))
        const data = snap.exists() ? snap.data() : {}
        const m    = data[locationKey]
        if (m) setMsg({
          enabled:  m.enabled  ?? false,
          message:  m.message  || '',
          type:     m.type     || 'info',
          link:     m.link     || '',
          linkText: m.linkText || '',
          startDate: toDatetimeLocal(m.startDate),
          endDate:   toDatetimeLocal(m.endDate),
        })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [locationKey])

  function set(key, val) { setMsg(m => ({ ...m, [key]: val })) }

  async function handleSave() {
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/site-messages/${locationKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(msg),
      })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Message saved!' })
    } catch {
      // Fallback: save directly to Firestore
      try {
        const snap = await getDoc(doc(db, 'config', 'site-messages'))
        const existing = snap.exists() ? snap.data() : {}
        await setDoc(doc(db, 'config', 'site-messages'), { ...existing, [locationKey]: msg })
        setToast({ type: 'success', message: 'Message saved!' })
      } catch {
        setToast({ type: 'error', message: 'Failed to save message' })
      }
    } finally { setSaving(false) }
  }

  const previewColors = TYPE_COLORS[msg.type] || TYPE_COLORS.info

  if (loading) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16, height: 120, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{label}</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={msg.enabled} onChange={e => set('enabled', e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: msg.enabled ? 'var(--green)' : 'var(--ink-3)' }}>
                {msg.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{desc}</p>
        </div>
      </div>

      {/* Preview */}
      {msg.enabled && msg.message && (
        <div style={{ background: previewColors.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: previewColors.text }}>
          <strong>Preview:</strong> {msg.message}
          {msg.link && <span> · <a href={msg.link} style={{ color: previewColors.text, textDecoration: 'underline' }}>{msg.linkText || 'Learn more'}</a></span>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Message</label>
          <textarea value={msg.message} onChange={e => set('message', e.target.value)} rows={2}
            placeholder="Enter banner message..."
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Type</label>
            <select value={msg.type} onChange={e => set('type', e.target.value)}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none' }}>
              {Object.entries(TYPE_COLORS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Link URL</label>
            <input type="text" value={msg.link} onChange={e => set('link', e.target.value)} placeholder="/pricing"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Link Text</label>
            <input type="text" value={msg.linkText} onChange={e => set('linkText', e.target.value)} placeholder="Learn More"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Start Date', 'startDate'], ['End Date', 'endDate']].map(([l, k]) => (
            <div key={k}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>{l}</label>
              <input type="datetime-local" value={msg[k]} onChange={e => set(k, e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>

        <div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save size={13} />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default function AdminMessages() {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>Site Messages</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>Manage banners and announcements across ReviewPilot. Changes apply in real-time.</p>
      </div>
      {LOCATIONS.map(loc => (
        <MessageEditor key={loc.key} locationKey={loc.key} label={loc.label} desc={loc.desc} />
      ))}
    </div>
  )
}
