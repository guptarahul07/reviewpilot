import { useState, useEffect } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../services/firebase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Toast from '../components/ui/Toast'
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

      <div className="settings__header">
        <h1 className="settings__title">Settings</h1>
        <p className="settings__sub">Manage your account and reply preferences.</p>
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
            Default reply tone
          </div>
          <div className="settings-section__body">
            <div className="tone-grid">
              {TONES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  className={`tone-option ${replyTone === value ? 'tone-option--active' : ''}`}
                  onClick={() => setReplyTone(value)}
                >
                  <p className="tone-option__label">{label}</p>
                  <p className="tone-option__desc">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Google connection */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Link2 size={15} />
            Google Business Profile
          </div>
          <div className="settings-section__body">
            <div className="settings-connection">
              <div className="settings-connection__info">
                <div className={`settings-connection__dot ${profile?.google?.connected ? 'settings-connection__dot--on' : 'settings-connection__dot--off'}`} />
                <div>
                  <p className="settings-connection__status">
                    {profile?.google?.connected ? 'Connected' : 'Not connected'}
                  </p>
                  {profile?.google?.locationName && (
                    <p className="settings-connection__name">{profile.google.locationName}</p>
                  )}
                </div>
              </div>
              {profile?.google?.connected ? (
                <Button variant="danger" size="sm" type="button">
                  Disconnect
                </Button>
              ) : (
                <a href="/connect">
                  <Button variant="secondary" size="sm" type="button">
                    Connect Google
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="settings-section">
          <div className="settings-section__label">
            <Shield size={15} />
            Account
          </div>
          <div className="settings-section__body">
            <div className="settings-account">
              <div>
                <p className="settings-account__label">Email</p>
                <p className="settings-account__value">{user?.email}</p>
              </div>
              <div>
                <p className="settings-account__label">Plan</p>
                <p className="settings-account__value">
                  {profile?.plan === 'pro' ? (
                    <span className="settings-plan-badge settings-plan-badge--pro">⚡ Pro</span>
                  ) : (
                    <span className="settings-plan-badge settings-plan-badge--free">Free</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="settings__save-row">
          <Button type="submit" loading={saving} size="md">
            Save changes
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
