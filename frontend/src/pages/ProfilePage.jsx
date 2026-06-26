// src/pages/ProfilePage.jsx
// Route: /settings/profile
// Sections: Personal | Business | Preferences | Danger Zone

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { User, Building2, Bell, AlertTriangle, Download, Trash2 } from 'lucide-react'

const BIZ_TYPES = ['Restaurant', 'Cafe', 'Hotel', 'Salon', 'App Developer', 'Retail', 'Clinic', 'Gym', 'Other']

const inputStyle = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-body)',
  fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
}
const labelStyle = {
  fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase',
  letterSpacing: '.05em', display: 'block', marginBottom: 6,
}
const sectionStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 16, padding: 24, marginBottom: 20,
}

export default function ProfilePage() {
  const { user, profile, fetchProfileFromAPI } = useAuth()
  const [toast, setToast]               = useState(null)
  const [saving, setSaving]             = useState(false)
  const [exporting, setExporting]       = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput]   = useState('')

  // Personal
  const [displayName, setDisplayName]   = useState('')
  const [phone, setPhone]               = useState('')

  // Business
  const [businessType, setBusinessType] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [city, setCity]                 = useState('')
  const [state, setState_]              = useState('')

  // Preferences
  const [emailNotifs, setEmailNotifs]   = useState(true)

  useEffect(() => {
    if (!user) return
    // Load from API first (works even when Firestore offline)
    // fetchProfileFromAPI already updates AuthContext profile,
    // but we also set local state directly for instant UI population
    async function loadProfile() {
      try {
        const token = await user.getIdToken()
        const res   = await fetch(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const p = data.profile || data.user || {}
          const s = data.settings || {}
          setDisplayName(p.displayName || p.name || user?.displayName || '')
          setPhone(p.phone || '')
          setBusinessType(p.businessType || '')
          setBusinessName(s.businessName || p.businessName || '')
          setCity(p.city || '')
          setState_(p.state || '')
          setEmailNotifs(p.emailNotifications !== false)
          return
        }
      } catch { /* fall through to Firestore profile */ }
      // Fallback to Firestore profile if API fails
      if (profile) {
        setDisplayName(profile.name || profile.displayName || user?.displayName || '')
        setPhone(profile.phone || '')
        setBusinessType(profile.businessType || '')
        setBusinessName(profile.settings?.businessName || profile.businessName || '')
        setCity(profile.city || '')
        setState_(profile.state || '')
        setEmailNotifs(profile.emailNotifications !== false)
      }
    }
    loadProfile()
  }, [user]) // eslint-disable-line — run once on mount

  async function handleSave() {
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          displayName, phone, businessType,
          businessName, city, state,
          emailNotifications: emailNotifs,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Use returned profile directly — no Firestore re-fetch needed
      // (fetchProfile goes to Firestore which may be slow/offline)
      if (data?.profile) {
        const p = data.profile
        if (p.displayName) setDisplayName(p.displayName)
        if (p.phone !== undefined) setPhone(p.phone || '')
        if (p.businessType) setBusinessType(p.businessType)
        if (p.businessName) setBusinessName(p.businessName)
        if (p.city !== undefined) setCity(p.city || '')
        if (p.state !== undefined) setState_(p.state || '')
      }
      setToast({ type: 'success', message: 'Profile updated successfully!' })
    } catch {
      setToast({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${API_URL}/api/user/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `reviewpilot-data-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'Data export started — check your downloads.' })
    } catch {
      setToast({ type: 'error', message: 'Export failed. Please try again or contact support.' })
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (deleteInput !== 'DELETE') return
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/user/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      // Sign out after deletion
      window.location.href = '/'
    } catch {
      setToast({ type: 'error', message: 'Account deletion failed. Please contact support.' })
    }
  }

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

  return (
    <div style={{ padding: 28, maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 4, letterSpacing: '-.02em' }}>
        Your Profile
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 28 }}>
        Manage your personal details, business info, and account settings.
      </p>

      {/* ── Personal ─────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <User size={15} style={{ color: 'var(--ink-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Personal</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98100..." style={inputStyle} />
              <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>For important account notifications</p>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={user?.email || ''} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>Email is linked to your Google account and cannot be changed here.</p>
          </div>
        </div>
      </div>

      {/* ── Business ─────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Building2 size={15} style={{ color: 'var(--ink-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Business</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Business Type</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ ...inputStyle, color: businessType ? 'var(--ink)' : 'var(--ink-3)' }}>
                <option value="">Select type</option>
                {BIZ_TYPES.map(t => <option key={t} value={t.toLowerCase().replace(' ', '_')}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Business Name" style={inputStyle} />
            </div>
          </div>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input type="text" value={state} onChange={e => setState_(e.target.value)} placeholder="Maharashtra" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Preferences ──────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Bell size={15} style={{ color: 'var(--ink-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Preferences</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Email Notifications</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Trial updates, billing alerts, review activity</div>
          </div>
          <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
        </label>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--ink-3)' }}>
          🔜 WhatsApp notifications — coming soon
        </div>
      </div>

      {/* Save button */}
      <Button size="lg" onClick={handleSave} disabled={saving} style={{ marginBottom: 28 }}>
        {saving ? 'Saving…' : 'Save Profile'}
      </Button>

      {/* ── Danger Zone ──────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <AlertTriangle size={15} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.06em' }}>Danger Zone</span>
        </div>

        {/* Export data */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 18, borderBottom: '1px solid rgba(239,68,68,.15)', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Export My Data</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Download all your reviews, replies, and profile data as a ZIP file.</div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
          >
            <Download size={14} /> {exporting ? 'Exporting…' : 'Download ZIP'}
          </button>
        </div>

        {/* Delete account */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Delete Account</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14, lineHeight: 1.6 }}>
            Permanently delete your account and all data. Your data will be retained for 30 days then permanently erased (DPDP Act 2023 compliance). This action cannot be undone.
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#ef4444', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <Trash2 size={14} /> Delete My Account
            </button>
          ) : (
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#fca5a5', marginBottom: 10 }}>
                Type <strong>DELETE</strong> to confirm account deletion:
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text" value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  style={{ ...inputStyle, flex: 1, borderColor: 'rgba(239,68,68,.4)', background: 'var(--bg-card)' }}
                />
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== 'DELETE'}
                  style={{ background: deleteInput === 'DELETE' ? '#ef4444' : 'var(--border)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
