// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Toast from '../components/ui/Toast'
import FeedbackWidget from '../components/FeedbackWidget'
import {
  Building2, Palette, Zap, AlertTriangle,
  Shield, ChevronRight, Check,
} from 'lucide-react'
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
  const { user, profile, fetchProfile } = useAuth()

  const [businessName,        setBusinessName]        = useState('')
  const [replyTone,           setReplyTone]           = useState('friendly')
  const [replyMode,           setReplyMode]           = useState('semi-auto')
  const [replyToRatingOnly,   setReplyToRatingOnly]   = useState(false)
  const [customInstructions,  setCustomInstructions]  = useState('')
  const [saving,              setSaving]              = useState(false)
  const [loading,             setLoading]             = useState(true)
  const [toast,               setToast]               = useState(null)
  const [previewMode,         setPreviewMode]         = useState(false)

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
    }
    loadSettings()
  }, [user, profile])

  /* ── Save settings ───────────────────────────────────────────── */
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/settings`, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify(sanitizeSettings({
          businessName,
          tone:              replyTone,
          replyMode,
          replyToRatingOnly,
          customInstructions,
          previewMode,
        })),
      })
      if (!res.ok) throw new Error('Save failed')
      await fetchProfile(user.uid)
      setToast({ message: 'Settings saved successfully!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Save failed. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
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
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
        <FeedbackWidget />
      </div>

      <div className="settings__header">
        <div>
          <h1 className="settings__title">Settings</h1>
          <p className="settings__sub">Manage your reply preferences and business details.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings__form">

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
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
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

    </div>
  )
}
