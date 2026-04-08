import { useState, useEffect } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../services/firebase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Toast from '../components/ui/Toast'
import FeedbackWidget from '../components/FeedbackWidget'
import { Building2, Palette, Link2, Shield } from 'lucide-react'
import './Settings.css'

const TONES = [
  { value: 'friendly',     label: 'Friendly',    desc: 'Warm, personal, approachable' },
  { value: 'professional', label: 'Professional', desc: 'Formal, measured, brand-forward' },
  { value: 'apologetic',   label: 'Apologetic',   desc: 'Empathetic, accountable, solution-oriented' },
]

export default function Settings() {
  const { user, profile, fetchProfile } = useAuth()

  const [businessName, setBusinessName] = useState('')
  const [replyTone, setReplyTone]       = useState('friendly')
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState(null)

  // Seed form from profile
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.settings?.businessName || '')
      setReplyTone(profile.settings?.replyTone || 'friendly')
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.businessName': businessName.trim(),
        'settings.replyTone':    replyTone,
        updatedAt:               serverTimestamp(),
      })
      await fetchProfile(user.uid)
      setToast({ message: 'Settings saved!', type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Save failed.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings animate-fade-in">

      {/* Floating Feedback Button - Bottom Right */}
      <div style={{ 
        position: 'fixed', 
        bottom: '24px', 
        right: '24px', 
        zIndex: 100 
      }}>
        <FeedbackWidget />
      </div>

      <div className="settings__header">
        <div>
          <h1 className="settings__title">Settings</h1>
          <p className="settings__sub">Manage your account and reply preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings__form">

        {/* Business info */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Building2 size={15} />
            Business
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
              This is included in AI reply prompts to keep responses on-brand.
            </p>
          </div>
        </section>

        {/* Reply tone */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Palette size={15} />
            Reply Tone
          </div>
          <div className="settings-section__body">
            <div className="tone-grid">
              {TONES.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`tone-card ${replyTone === value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    checked={replyTone === value}
                    onChange={(e) => setReplyTone(e.target.value)}
                  />
                  <div className="tone-card__label">{label}</div>
                  <div className="tone-card__desc">{desc}</div>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="settings__actions">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
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