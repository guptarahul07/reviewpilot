// src/pages/Onboarding.jsx
// 4-step onboarding: Profile → Choose Product → Connect → Success

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { Check, ArrowRight } from 'lucide-react'

const BIZ_TYPES = ['Restaurant', 'Cafe', 'Hotel', 'Salon', 'App Developer', 'Retail', 'Other']

function ProgressBar({ step, total = 4 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: step >= s ? 'var(--accent)' : 'var(--bg-card)',
            border: `2px solid ${step >= s ? 'var(--accent)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            color: step >= s ? '#fff' : 'var(--ink-3)',
            transition: 'all .25s',
            zIndex: 1, position: 'relative',
          }}>
            {step > s ? <Check size={15} /> : s}
          </div>
          {i < total - 1 && (
            <div style={{
              width: 56, height: 2,
              background: step > s ? 'var(--accent)' : 'var(--border)',
              transition: 'background .3s',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function StepLabel({ step }) {
  const labels = ['Your Profile', 'Choose Product', 'Connect Account', 'All Set!']
  return (
    <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 28, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
      Step {step} of 4 — {labels[step - 1]}
    </p>
  )
}

export default function Onboarding() {
  const { user, profile }   = useAuth()
  const navigate             = useNavigate()
  const [step, setStep]      = useState(1)
  const [toast, setToast]    = useState(null)
  const [saving, setSaving]  = useState(false)

  // Step 1 state
  const [name,     setName]     = useState(profile?.name || user?.displayName || '')
  const [bizType,  setBizType]  = useState('')
  const [city,     setCity]     = useState('')
  const [phone,    setPhone]    = useState('')

  // Step 2 state
  const [products, setProducts] = useState([]) // 'gbp' | 'play'

  function toggleProduct(p) {
    setProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: name, phone, businessType: bizType, city, onboardingStep: step }),
      })
    } catch { /* non-blocking */ }
    finally { setSaving(false) }
  }

  async function handleStep1() {
    if (!name.trim() || !bizType) return
    await saveProfile()
    setStep(2)
  }

  async function handleStep2() {
    if (products.length === 0) return
    setSaving(true)
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/user/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 2, data: { products, businessType: bizType } }),
      })
    } catch {} finally { setSaving(false) }
    setStep(3)
  }

  function handleConnectGBP() {
    // Store that we came from onboarding so we can return to step 4
    sessionStorage.setItem('onboarding_return', '1')
    navigate('/connect')
  }

  function handleConnectPlay() {
    sessionStorage.setItem('onboarding_return', '1')
    window.location.href = `${API_URL}/api/play/auth/google`
  }

  async function handleFinish() {
    try {
      const token = await user.getIdToken()
      await fetch(`${API_URL}/api/user/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 4, data: { onboardingCompleted: true } }),
      })
    } catch {}
    navigate('/reviews')
  }

  const card = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 500,
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '11px 14px', fontFamily: 'var(--font-body)',
    fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase',
    letterSpacing: '.05em', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>

      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
        ⚡ ReviewPilot
      </div>

      <div style={card}>
        <ProgressBar step={step} />
        <StepLabel step={step} />

        {/* ── Step 1: Profile ─────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 6, textAlign: 'center' }}>
              Welcome to ReviewPilot! 👋
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Let's set up your account in 4 quick steps.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Gupta" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Business Type *</label>
                <select value={bizType} onChange={e => setBizType(e.target.value)} required style={{ ...inputStyle, color: bizType ? 'var(--ink)' : 'var(--ink-3)' }}>
                  <option value="">Select your business type</option>
                  {BIZ_TYPES.map(t => <option key={t} value={t.toLowerCase().replace(' ', '_')}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Delhi" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optional)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98100..." style={inputStyle} />
                </div>
              </div>
              <Button size="lg" style={{ width: '100%', marginTop: 8 }} onClick={handleStep1} disabled={!name.trim() || !bizType || saving}>
                Continue <ArrowRight size={15} />
              </Button>
              <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Choose Product ───────────────────────────── */}
        {step === 2 && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 6, textAlign: 'center' }}>
              What would you like to manage?
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 24 }}>Select one or both</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { id: 'gbp', emoji: '⭐', title: 'Google Business Reviews', desc: 'For restaurants, salons, clinics, hotels, retail' },
                { id: 'play', emoji: '🎮', title: 'Play Store Reviews', desc: 'For Android app developers' },
              ].map(({ id, emoji, title, desc }) => (
                <label key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: products.includes(id) ? 'rgba(79,124,255,.07)' : 'var(--bg)',
                  border: `2px solid ${products.includes(id) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all .15s',
                }}>
                  <input type="checkbox" checked={products.includes(id)} onChange={() => toggleProduct(id)} style={{ accentColor: 'var(--accent)', width: 18, height: 18 }} />
                  <span style={{ fontSize: 24 }}>{emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: products.includes(id) ? 'var(--accent)' : 'var(--ink)' }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{desc}</div>
                  </div>
                </label>
              ))}

              {/* InsightPilot — Coming Soon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 14, padding: '14px 18px', opacity: 0.6 }}>
                <span style={{ fontSize: 24 }}>📊</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    InsightPilot
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', background: 'rgba(245,166,35,.1)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,.2)', borderRadius: 100 }}>SOON</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Zomato, Swiggy, Reddit analytics</div>
                </div>
              </div>
            </div>

            <Button size="lg" style={{ width: '100%' }} onClick={handleStep2} disabled={products.length === 0 || saving}>
              Continue <ArrowRight size={15} />
            </Button>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', width: '100%', marginTop: 10 }}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Connect Account ──────────────────────────── */}
        {step === 3 && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 6, textAlign: 'center' }}>
              Connect your account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 28 }}>
              {products.length === 2 ? 'Connect both accounts to get started' : 'Connect your account to start syncing reviews'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {products.includes('gbp') && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>⭐</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Google Business Profile</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Sign in with your business Google account</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleConnectGBP}>Connect →</Button>
                  </div>
                </div>
              )}
              {products.includes('play') && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>🎮</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Google Play Console</div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Sign in with your Play Console account</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleConnectPlay}>Connect →</Button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setStep(4)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', padding: '8px 0' }}>
              Skip for now — I'll connect later
            </button>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', width: '100%', marginTop: 4 }}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 4: Success ──────────────────────────────────── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
              You're all set, {name.split(' ')[0] || 'there'}!
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 8, lineHeight: 1.65 }}>
              Your account is ready. Your first reviews are loading...
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 28 }}>
              Your free trial is active. No credit card required.
            </p>
            <Button size="lg" style={{ width: '100%' }} onClick={handleFinish}>
              Go to Dashboard <ArrowRight size={15} />
            </Button>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
