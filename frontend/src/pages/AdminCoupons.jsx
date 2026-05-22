// src/pages/AdminCoupons.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { Plus, Trash2, X } from 'lucide-react'

const PLANS = ['starter', 'growth', 'professional']

function CreateModal({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    code: '', type: 'percentage', value: 50,
    maxUses: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    applicablePlans: [...PLANS],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function togglePlan(p) {
    set('applicablePlans', form.applicablePlans.includes(p)
      ? form.applicablePlans.filter(x => x !== p)
      : [...form.applicablePlans, p]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.code.trim() || !form.validFrom || !form.validUntil) { setError('Code, start date and expiry date are required'); return }
    if (form.validFrom > form.validUntil) { setError('Start date must be before expiry date'); return }
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed') }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>Create Coupon</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Coupon Code', key: 'code', type: 'text', placeholder: 'FRIEND50', transform: v => v.toUpperCase() },
          ].map(({ label, key, type, placeholder, transform }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => set(key, transform ? transform(e.target.value) : e.target.value)} placeholder={placeholder} required
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}>
                <option value="percentage">Percentage %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Value</label>
              <input type="number" min="1" value={form.value} onChange={e => set('value', parseInt(e.target.value))} required
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Max Uses</label>
              <input type="number" min="1" value={form.maxUses} onChange={e => set('maxUses', parseInt(e.target.value))} required
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Valid From</label>
              <input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} required
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Expires</label>
              <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} required
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>Applicable Plans</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PLANS.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--ink-2)', background: form.applicablePlans.includes(p) ? 'rgba(79,124,255,.08)' : 'var(--bg)', border: `1px solid ${form.applicablePlans.includes(p) ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 12px' }}>
                  <input type="checkbox" checked={form.applicablePlans.includes(p)} onChange={() => togglePlan(p)} style={{ accentColor: 'var(--accent)' }} />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {error && <p style={{ fontSize: 12.5, color: 'var(--red)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Creating…' : 'Create Coupon'}</Button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontSize: 14, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCoupons() {
  const { user }                      = useAuth()
  const [coupons, setCoupons]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [toast, setToast]             = useState(null)
  const [deleting, setDeleting]       = useState(null)

  useEffect(() => { fetchCoupons() }, [user])

  async function fetchCoupons() {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setCoupons((await res.json()).coupons || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleDelete(code) {
    setDeleting(code)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/admin/coupons/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.code !== code))
        setToast({ type: 'success', message: `Coupon "${code}" deleted` })
      } else throw new Error()
    } catch {
      setToast({ type: 'error', message: 'Failed to delete coupon' })
    } finally { setDeleting(null) }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 3 }}>Coupon Management</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{coupons.length} coupons total</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={14} />Create Coupon</Button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>Loading…</div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>No coupons yet. Create your first one!</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Code', 'Type', 'Value', 'Used / Max', 'Plans', 'Expires', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>{c.code}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-2)', textTransform: 'capitalize' }}>{c.type}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink)', fontWeight: 600 }}>{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-2)' }}>{c.usedCount ?? 0} / {c.maxUses}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-2)', fontSize: 12 }}>{(c.applicablePlans || PLANS).join(', ')}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-2)' }}>{(() => {
                        try {
                          if (!c.validUntil) return '—'
                          // Handle Firestore Timestamp, ISO string, or date string
                          const d = c.validUntil?.toDate ? c.validUntil.toDate()
                            : c.validUntil?._seconds ? new Date(c.validUntil._seconds * 1000)
                            : new Date(c.validUntil)
                          return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        } catch { return '—' }
                      })()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleDelete(c.code)}
                        disabled={deleting === c.code}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', opacity: deleting === c.code ? 0.4 : 1, padding: 4, display: 'flex' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <CreateModal onClose={() => setShowModal(false)} onSuccess={fetchCoupons} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
