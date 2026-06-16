// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Toast from '../components/ui/Toast'
import FeedbackWidget from '../components/FeedbackWidget'
import {
  Building2, Palette, Zap, AlertTriangle,
  Shield, ChevronRight, Check, Link2, Gamepad2, Unlink,
  FolderOpen,
} from 'lucide-react'
import CSVImportModal from '../components/CSVImportModal'
import './Settings.css'
import { sanitizeSettings } from '../utils/sanitize'

/* ─────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────── */
const REPLY_MODES = [
  {
    value: 'manual',
    label: 'Manual',
    badge: 'Safest',
    badgeColor: 'green',
    icon: Shield,
    desc: 'AI generates reply suggestions. You copy and paste them yourself into Google Business Profile.',
    example: 'Best for: Business owners who want full control over every word.',
  },
  {
    value: 'semi-auto',
    label: 'Semi-Auto',
    badge: 'Recommended',
    badgeColor: 'blue',
    icon: Check,
    desc: 'AI auto-posts replies to 4–5★ reviews. You review and approve 1–3★ replies before posting.',
    example: 'Best for: Busy owners who want automation with oversight on negative reviews.',
    recommended: true,
  },
  {
    value: 'auto',
    label: 'Auto',
    badge: 'Hands-off',
    badgeColor: 'amber',
    icon: Zap,
    desc: 'AI automatically posts replies to ALL reviews — positive and negative — without approval.',
    example: 'Best for: High-volume businesses that trust the AI completely.',
    warning: true,
  },
]

const TONES = [
  {
    value: 'professional',
    label: 'Professional',
    desc: 'Formal, measured, brand-forward',
    example: '"Thank you for your feedback. We appreciate you taking the time to share your experience."',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    desc: 'Warm, personal, approachable',
    example: '"Thanks so much for the kind words! We loved having you and can\'t wait to see you again! 😊"',
  },
  {
    value: 'apologetic',
    label: 'Apologetic',
    desc: 'Empathetic, accountable, solution-focused',
    example: '"We\'re truly sorry to hear this. This is not the experience we aim for and we\'d love to make it right."',
  },
]

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function Settings() {
  const { user, profile, fetchProfile, subscription } = useAuth()

  const [businessName,        setBusinessName]        = useState('')
  const [replyTone,           setReplyTone]           = useState('friendly')
  const [replyMode,           setReplyMode]           = useState('semi-auto')
  const [replyToRatingOnly,   setReplyToRatingOnly]   = useState(false)
  const [customInstructions,  setCustomInstructions]  = useState('')
  const [saving,              setSaving]              = useState(false)
  const [loading,             setLoading]             = useState(true)
  const [toast,               setToast]               = useState(null)
  const [previewMode,         setPreviewMode]         = useState(false)
  const [playConnected,      setPlayConnected]      = useState(false)
  const [playApps,           setPlayApps]           = useState([])
  const [playEmail,          setPlayEmail]          = useState('')
  const [newPkgName,         setNewPkgName]         = useState('')
  const [newAppName,         setNewAppName]         = useState('')
  const [addingApp,          setAddingApp]          = useState(false)
  const [disconnectingPlay,  setDisconnectingPlay]  = useState(false)
  const [searchParams]                              = useSearchParams()
  const [importModalApp,  setImportModalApp]  = useState(null)     // { packageName, appName } | null
  const [importHistory,   setImportHistory]   = useState({})       // { [pkgName]: jobs[] }

  /* ── Load settings from backend ─────────────────────────────── */
  useEffect(() => {
    async function loadSettings() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res   = await fetch(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const s    = data.settings || {}
          setBusinessName(s.businessName       || profile?.settings?.businessName || '')
          setReplyTone(s.tone                  || profile?.settings?.replyTone    || 'friendly')
          setReplyMode(s.replyMode             || 'semi-auto')
          setReplyToRatingOnly(s.replyToRatingOnly ?? false)
          setCustomInstructions(s.customInstructions || '')
          setPreviewMode(s.previewMode ?? false)
        } else {
          // Fallback to Firestore profile
          if (profile) {
            setBusinessName(profile.settings?.businessName || '')
            setReplyTone(profile.settings?.replyTone       || 'friendly')
          }
        }
      } catch {
        if (profile) {
          setBusinessName(profile.settings?.businessName || '')
          setReplyTone(profile.settings?.replyTone       || 'friendly')
        }
      } finally {
        setLoading(false)
      }
      // Load Play Console status
      try {
        const token2 = await user.getIdToken()
        const playRes = await fetch(`${API_URL}/api/play/status`, {
          headers: { Authorization: `Bearer ${token2}` },
        })
        if (playRes.ok) {
          const playData = await playRes.json()
          setPlayConnected(playData.connected ?? false)
          setPlayApps(playData.apps || [])
          setPlayEmail(playData.email || '')
        }
      } catch { /* non-blocking */ }
      // Load import history
      try {
        const token3 = await user.getIdToken()
        const histRes = await fetch(`${API_URL}/api/play/import-history`, {
          headers: { Authorization: `Bearer ${token3}` },
        })
        if (histRes.ok) {
          const histData = await histRes.json()
          const byPkg = {}
          ;(histData.imports || []).forEach(job => {
            if (!byPkg[job.packageName]) byPkg[job.packageName] = []
            byPkg[job.packageName].push(job)
          })
          setImportHistory(byPkg)
        }
      } catch { /* non-blocking */ }
    }
    loadSettings()
    if (searchParams.get('play') === 'connected') setPlayConnected(true)
  }, [user, profile, searchParams])

  /* ── Play Console handlers ──────────────────────────────────── */
  function handleConnectPlay() { window.location.href = `${API_URL}/api/play/auth/google` }

  async function handleDisconnectPlay() {
    setDisconnectingPlay(true)
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/play/auth/disconnect`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setPlayConnected(false); setPlayApps([]); setPlayEmail('')
    } catch {} finally { setDisconnectingPlay(false) }
  }

  async function handleAddPlayApp(e) {
    e.preventDefault(); if (!newPkgName.trim()) return
    setAddingApp(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${API_URL}/api/play/apps`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageName: newPkgName.trim(), appName: newAppName.trim() || newPkgName.trim() }),
      })
      if (res.ok) { setPlayApps(prev => [...prev, { packageName: newPkgName.trim(), appName: newAppName.trim() || newPkgName.trim() }]); setNewPkgName(''); setNewAppName('') }
    } catch {} finally { setAddingApp(false) }
  }

  async function handleRemovePlayApp(pkgName) {
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/play/apps/${pkgName}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setPlayApps(prev => prev.filter(a => a.packageName !== pkgName))
    } catch {}
  }

  /* ── Save settings — optimistic update ──────────────────────── */
  async function handleSave(e) {
    e.preventDefault()

    // Snapshot current values for rollback
    const snapshot = { businessName, replyTone, replyMode, replyToRatingOnly, customInstructions, previewMode }

    // 1. Show success immediately — feels instant
    setSaving(true)
    setToast({ message: 'Settings saved!', type: 'success' })

    // 2. Re-enable button after 500ms regardless of API result
    const enableTimer = setTimeout(() => setSaving(false), 500)

    // 3. API call in background
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/settings`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sanitizeSettings({
          businessName, tone: replyTone, replyMode,
          replyToRatingOnly, customInstructions, previewMode,
        })),
      })
      if (!res.ok) throw new Error('Save failed')
      // Silent success — toast already shown, just refresh profile in background
      fetchProfile(user.uid).catch(() => {})
    } catch (err) {
      // 4. API failed — rollback state and show error
      clearTimeout(enableTimer)
      setSaving(false)
      setBusinessName(snapshot.businessName)
      setReplyTone(snapshot.replyTone)
      setReplyMode(snapshot.replyMode)
      setReplyToRatingOnly(snapshot.replyToRatingOnly)
      setCustomInstructions(snapshot.customInstructions)
      setPreviewMode(snapshot.previewMode)
      setToast({ message: 'Save failed — changes reverted. Please try again.', type: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="settings animate-fade-in">
        <div className="settings__loading">
          <div className="settings__spinner" />
          <p>Loading settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings animate-fade-in">

      {/* Feedback widget */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', /* above mobile bottom nav */
        right: 16,
        zIndex: 900, /* above bottom nav but below modals */
      }}>
        <FeedbackWidget />
      </div>

      <div className="settings__header">
        <div>
          <h1 className="settings__title">Settings</h1>
          <p className="settings__sub">Manage your reply preferences and business details.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings__form">

        {/* ── Connected Platforms ─────────────────────────────────── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Link2 size={15} />
            Connected Platforms
          </div>
          <div className="settings-section__body">
            {/* Google Business Profile — always connected */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,124,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⭐</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Google Business Profile</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Manage customer reviews for your business</div>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(34,208,138,.1)', color: 'var(--green)', border: '1px solid rgba(34,208,138,.2)' }}>Connected ✅</span>
            </div>

            {/* Google Play Console */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: playConnected ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,92,252,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gamepad2 size={18} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Google Play Console</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{playConnected ? playEmail : 'Manage reviews for your Android apps'}</div>
                  </div>
                </div>
                {!playConnected
                  ? <button onClick={handleConnectPlay} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Gamepad2 size={13} /> Connect Play Console
                    </button>
                  : <button onClick={handleDisconnectPlay} disabled={disconnectingPlay} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Unlink size={12} /> {disconnectingPlay ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                }
              </div>

              {playConnected && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Your Apps</div>
                  {playApps.length === 0
                    ? <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 12 }}>No apps added yet.</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {playApps.map(app => {
                          const plan = subscription?.plan || profile?.plan || 'free'
                          const isGrowthPlus = ['growth', 'pro', 'bundle_growth', 'bundle_suite', 'admin'].includes(plan)
                          const appJobs = importHistory[app.packageName] || []
                          const lastJob = appJobs[0]
                          return (
                            <div key={app.packageName} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                              {/* App header row */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                                <div>
                                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{app.appName}</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{app.packageName}</div>
                                </div>
                                <button onClick={() => handleRemovePlayApp(app.packageName)} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 6 }}>
                                  Remove
                                </button>
                              </div>

                              {/* Historical import section */}
                              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FolderOpen size={13} style={{ color: isGrowthPlus ? 'var(--ink-3)' : 'var(--border)' }} />
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>Historical Reviews</span>
                                    {!isGrowthPlus && (
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: 'rgba(79,124,255,.1)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,.2)' }}>Growth+</span>
                                    )}
                                  </div>
                                  {isGrowthPlus ? (
                                    <button
                                      onClick={() => setImportModalApp({ packageName: app.packageName, appName: app.appName })}
                                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                                    >
                                      <FolderOpen size={12} /> Import from CSV
                                    </button>
                                  ) : (
                                    <a href="/checkout?plan=growth" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                                      Upgrade to Growth →
                                    </a>
                                  )}
                                </div>

                                {/* Import history */}
                                {isGrowthPlus && appJobs.length > 0 && (
                                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Import history</div>
                                    {appJobs.slice(0, 3).map(job => {
                                      const d = job.startedAt?.toDate ? job.startedAt.toDate() : new Date(job.startedAt)
                                      return (
                                        <div key={job.jobId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)' }}>
                                          <span>{job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : '⏳'}</span>
                                          <span>{isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} —</span>
                                          <span style={{ color: 'var(--ink-2)' }}>{job.importedReviews ?? 0} imported</span>
                                          {job.skippedReviews > 0 && <span>, {job.skippedReviews} skipped</span>}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Locked state hint */}
                                {!isGrowthPlus && (
                                  <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
                                    Import your full review history beyond 7 days. Unlock version trends and full sentiment analysis.
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                  }
                  <form onSubmit={handleAddPlayApp} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input type="text" value={newPkgName} onChange={e => setNewPkgName(e.target.value)} placeholder="com.yourcompany.app"
                      style={{ flex: 2, minWidth: 160, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontFamily: 'monospace', fontSize: 13, color: 'var(--ink)', outline: 'none' }} />
                    <input type="text" value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="App name"
                      style={{ flex: 1, minWidth: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', outline: 'none' }} />
                    <button type="submit" disabled={addingApp || !newPkgName.trim()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: !newPkgName.trim() ? 0.5 : 1 }}>
                      {addingApp ? '…' : '+ Add'}
                    </button>
                  </form>
                </div>
              )}

              {!playConnected && <p className="settings__hint" style={{ marginTop: 8 }}>Connect to manage Google Play reviews. No approval needed — works immediately.</p>}
            </div>
          </div>
        </section>

        {/* ── Reply Mode ─────────────────────────────────────────── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Zap size={15} />
            Reply Mode
          </div>
          <div className="settings-section__body">
            <div className="mode-grid">
              {REPLY_MODES.map(({ value, label, badge, badgeColor, icon: Icon, desc, example, recommended, warning }) => (
                <label
                  key={value}
                  className={`mode-card ${replyMode === value ? 'mode-card--active' : ''} ${recommended ? 'mode-card--recommended' : ''}`}
                >
                  <input
                    type="radio"
                    name="replyMode"
                    value={value}
                    checked={replyMode === value}
                    onChange={() => setReplyMode(value)}
                    style={{ display: 'none' }}
                  />
                  <div className="mode-card__top">
                    <div className="mode-card__icon">
                      <Icon size={16} />
                    </div>
                    <div className="mode-card__label">{label}</div>
                    <span className={`mode-card__badge mode-card__badge--${badgeColor}`}>
                      {badge}
                    </span>
                    {replyMode === value && (
                      <div className="mode-card__check"><Check size={12} /></div>
                    )}
                  </div>
                  <div className="mode-card__desc">{desc}</div>
                  <div className="mode-card__example">{example}</div>
                </label>
              ))}
            </div>

            {/* Auto mode warning */}
            {replyMode === 'auto' && (
              <div className="settings-warning">
                <AlertTriangle size={15} />
                <div>
                  <strong>Auto mode posts without your approval.</strong>
                  <span> AI will reply to ALL reviews — including complaints — automatically.
                  Make sure your tone and custom instructions are set correctly before enabling.</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Reply Tone ─────────────────────────────────────────── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Palette size={15} />
            Reply Tone
          </div>
          <div className="settings-section__body">
            <div className="tone-grid">
              {TONES.map(({ value, label, desc, example }) => (
                <label
                  key={value}
                  className={`tone-card ${replyTone === value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    checked={replyTone === value}
                    onChange={() => setReplyTone(value)}
                    style={{ display: 'none' }}
                  />
                  <div className="tone-card__label">{label}</div>
                  <div className="tone-card__desc">{desc}</div>
                  {replyTone === value && (
                    <div className="tone-card__example">{example}</div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ── Business Details ───────────────────────────────────── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Building2 size={15} />
            Business Details
          </div>
          <div className="settings-section__body">
            <Input
              label="Business name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. The Corner Café"
            />
            <p className="settings__hint">
              Used in AI reply prompts to keep responses on-brand and personalised.
            </p>
          </div>
        </section>

        {/* ── Advanced Settings ──────────────────────────────────── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <ChevronRight size={15} />
            Advanced Settings
          </div>
          <div className="settings-section__body">

            {/* Reply to ratings without text */}
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={replyToRatingOnly}
                onChange={(e) => setReplyToRatingOnly(e.target.checked)}
              />
              <div>
                <div className="settings-checkbox__label">
                  Reply to ratings without review text
                </div>
                <div className="settings-checkbox__hint">
                  When enabled, AI will also generate replies for reviews that only have a star rating
                  with no written comment. When disabled, only reviews with text get replies.
                </div>
              </div>
            </label>

            {/* Custom instructions */}
            <div className="settings-instructions">
              <label className="settings-instructions__label">
                Custom AI Instructions
                <span className="settings-instructions__optional">Optional</span>
              </label>
              <textarea
                className="settings-instructions__textarea"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={'Examples:\n• Always mention our award-winning chef\n• If they complain about wait time, mention we\'ve added more staff\n• Always invite them back with "Hope to see you soon!"\n• Never offer discounts in replies'}
                rows={5}
                maxLength={500}
              />
              <div className="settings-instructions__count">
                {customInstructions.length}/500
              </div>
              <p className="settings__hint">
                These instructions are added to every AI reply prompt. Use this to maintain brand voice,
                mention specific details, or handle common complaints consistently.
              </p>
            </div>

          </div>
        </section>

        {/* ── Preview / Test Mode ───────────────────────────────── */}
        <section className="settings-section">
          <div className="settings-section__label">
            <ChevronRight size={15} />
            Preview / Test Mode
          </div>
          <div className="settings-section__body">
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={previewMode}
                onChange={(e) => setPreviewMode(e.target.checked)}
              />
              <div>
                <div className="settings-checkbox__label">
                  Enable Preview Mode
                </div>
                <div className="settings-checkbox__hint">
                  When enabled, Auto mode will generate and show replies in your dashboard
                  but will <strong>not</strong> post them to Google. Use this to safely test
                  your settings before going live. Has no effect in Manual or Semi-Auto mode.
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* ── Save ───────────────────────────────────────────────── */}
        <div className="settings__actions">
          <Button type="submit" disabled={saving} style={{ minWidth: 140, position: 'relative' }}>
            {saving
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff',
                    animation: 'spin .6s linear infinite',
                    flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  Saving
                </span>
              : 'Save changes'
            }
          </Button>
        </div>

      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* CSV Import Modal */}
      {importModalApp && (
        <CSVImportModal
          packageName={importModalApp.packageName}
          appName={importModalApp.appName}
          plan={subscription?.plan || profile?.plan || 'free'}
          onClose={() => setImportModalApp(null)}
          onComplete={() => {
            setImportModalApp(null)
            user.getIdToken().then(token =>
              fetch(`${API_URL}/api/play/import-history`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(data => {
                  const byPkg = {}
                  ;(data.imports || []).forEach(job => {
                    if (!byPkg[job.packageName]) byPkg[job.packageName] = []
                    byPkg[job.packageName].push(job)
                  })
                  setImportHistory(byPkg)
                }).catch(() => {})
            ).catch(() => {})
          }}
        />
      )}

    </div>
  )
}
