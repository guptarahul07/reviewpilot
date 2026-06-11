// src/pages/PlayOnboarding.jsx
// Onboarding flow shown after user connects Play Console
// Guides them to add their first app package name

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { Gamepad2, Package, Check, ArrowRight, Settings } from 'lucide-react'

export default function PlayOnboarding() {
  const { user }                        = useAuth()
  const navigate                        = useNavigate()
  const [step, setStep]                 = useState(1)
  const [packageName, setPackageName]   = useState('')
  const [appName, setAppName]           = useState('')
  const [adding, setAdding]             = useState(false)
  const [addedApps, setAddedApps]       = useState([])
  const [toast, setToast]               = useState(null)
  const [error, setError]               = useState('')

  async function handleAddApp(e) {
    e.preventDefault()
    if (!packageName.trim()) return
    // Basic package name validation
    const validPkg = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName.trim())
    if (!validPkg) {
      setError('Invalid package name. Format: com.yourcompany.appname')
      return
    }
    setAdding(true)
    setError('')
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/play/apps`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageName: packageName.trim(), appName: appName.trim() || packageName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to add app')
      setAddedApps(prev => [...prev, { packageName: packageName.trim(), appName: appName.trim() || packageName.trim() }])
      setPackageName('')
      setAppName('')
      setToast({ type: 'success', message: `✅ ${appName || packageName} added!` })
      if (step === 1) setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to add app. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 540 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            color: 'var(--ink)', marginBottom: 10, letterSpacing: '-.02em',
          }}>
            Welcome to ReviewPilot!
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.65 }}>
            You've connected Google Play Console.<br />
            Let's set up your first app in 3 quick steps.
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= s ? 'var(--accent)' : 'var(--bg-card)',
                border: `2px solid ${step >= s ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: step >= s ? '#fff' : 'var(--ink-3)',
                transition: 'all .2s',
              }}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {i < 2 && (
                <div style={{
                  width: 60, height: 2,
                  background: step > s ? 'var(--accent)' : 'var(--border)',
                  transition: 'background .3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Add app */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(79,124,255,.1)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                Step 1: Add your first app
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                Enter your app's package name from Play Console
              </div>
            </div>
          </div>

          {/* Added apps list */}
          {addedApps.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {addedApps.map(app => (
                <div key={app.packageName} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(34,208,138,.06)', border: '1px solid rgba(34,208,138,.2)',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 8,
                }}>
                  <Check size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{app.appName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{app.packageName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddApp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>
                Package Name *
              </label>
              <input
                type="text"
                value={packageName}
                onChange={e => { setPackageName(e.target.value); setError('') }}
                placeholder="com.yourcompany.appname"
                required
                style={{
                  width: '100%', background: 'var(--bg)',
                  border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontFamily: 'monospace', fontSize: 14, color: 'var(--ink)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</p>}
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                Find this in Play Console → Your app → Dashboard → Package name
              </p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>
                App Name <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — for your reference)</span>
              </label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="My Fitness App"
                style={{
                  width: '100%', background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px',
                  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <Button type="submit" disabled={adding || !packageName.trim()}>
              {adding ? 'Adding…' : addedApps.length > 0 ? '+ Add Another App' : 'Add App'}
            </Button>
          </form>
        </div>

        {/* Step 2: Reviews info */}
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${step >= 2 ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 16, padding: 24, marginBottom: 16,
          opacity: step < 2 ? 0.5 : 1, transition: 'opacity .3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: step >= 2 ? 'rgba(34,208,138,.1)' : 'var(--bg)',
              color: step >= 2 ? 'var(--green)' : 'var(--ink-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${step >= 2 ? 'rgba(34,208,138,.2)' : 'var(--border)'}`,
            }}>
              <Gamepad2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                Step 2: We'll fetch your latest reviews
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                Reviews from the last 7 days will appear in your inbox
              </div>
            </div>
            {step >= 2 && <Check size={18} style={{ color: 'var(--green)', marginLeft: 'auto' }} />}
          </div>
          {step >= 2 && (
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: 'rgba(34,208,138,.06)', border: '1px solid rgba(34,208,138,.15)',
              borderRadius: 8, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
            }}>
              ℹ️ Play Store API returns reviews from the last 7 days. For older reviews, you can export a CSV from Play Console and we'll import them in a future update.
            </div>
          )}
        </div>

        {/* Step 3: Settings */}
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${step >= 3 ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 16, padding: 24, marginBottom: 28,
          opacity: step < 2 ? 0.5 : 1, transition: 'opacity .3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(79,124,255,.1)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                Step 3: Set your reply preferences
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                Configure tone, reply mode, and custom instructions
              </div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            size="lg"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => navigate('/reviews')}
            disabled={addedApps.length === 0}
          >
            Go to Inbox <ArrowRight size={15} />
          </Button>
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 20px',
              fontSize: 14, fontWeight: 600, color: 'var(--ink-3)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Settings
          </button>
        </div>

        {addedApps.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12 }}>
            Add at least one app to continue
          </p>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
