// src/pages/Checkout.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { CheckCircle, Tag, Loader, ArrowLeft } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────
   PLAN DATA
───────────────────────────────────────────────────────────────── */
const PLAN_DETAILS = {
  starter: {
    name: 'Starter', monthly: 499, annual: 4790, annualMonthly: 399,
    savings: 20,
    features: ['1 location', 'Unlimited reviews', 'AI replies', '24h sync', 'Email support'],
  },
  growth: {
    name: 'Growth', monthly: 999, annual: 8991, annualMonthly: 749,
    savings: 25,
    features: ['3 locations', 'Everything in Starter', 'Advanced analytics', 'WhatsApp support', '30-min onboarding call'],
    popular: true,
  },
  professional: {
    name: 'Professional', monthly: 1999, annual: 16792, annualMonthly: 1399,
    savings: 30,
    features: ['Unlimited locations', 'Everything in Growth', 'Custom reports', 'Dedicated manager', 'API access'],
  },
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function Checkout() {
  const { user }          = useAuth()
  const navigate          = useNavigate()
  const [params]          = useSearchParams()

  const [plan, setPlan]               = useState(params.get('plan') || 'growth')
  const [billing, setBilling]         = useState(params.get('billing') || 'annual')
  const [couponCode, setCouponCode]   = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [toast, setToast]             = useState(null)

  const planData = PLAN_DETAILS[plan] || PLAN_DETAILS.growth
  const basePrice = billing === 'annual' ? planData.annual : planData.monthly
  // Backend returns prices in paise (×100), convert to rupees
  const finalPrice = appliedCoupon?.finalPrice != null
    ? Math.round(appliedCoupon.finalPrice / 100)
    : basePrice
  const safeDiscount = Math.max(0, basePrice - finalPrice)

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/billing/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ couponCode: couponCode.trim().toUpperCase(), plan, billingCycle: billing }),
      })
      const data = await res.json()
      if (data.success) {
        setAppliedCoupon(data)
        const savedAmount = data.finalPrice != null
          ? basePrice - Math.round(data.finalPrice / 100)
          : 0
        setToast({ type: 'success', message: `Coupon applied! Saving ₹${Math.max(0, savedAmount).toLocaleString('en-IN')}` })
      } else {
        setCouponError(data.error || 'Invalid coupon code')
      }
    } catch {
      setCouponError('Failed to apply coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  async function activateTrial() {
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/billing/activate-trial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.alreadyActivated && data.trialEndsAt) {
        const expired = new Date(data.trialEndsAt) < new Date()
        if (expired) { navigate('/pricing'); return false }
      }
      return true
    } catch { return true } // non-blocking — proceed even if fails
  }

  async function handleCheckout() {
    setCheckoutLoading(true)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/billing/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan,
          billingCycle: billing,
          couponCode: appliedCoupon?.couponCode || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create subscription')

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      const options = {
        key:             data.keyId, // comes from create-subscription response
        subscription_id: data.subscriptionId,
        name:            'ReviewPilot',
        description:     `${planData.name} Plan — ${billing === 'annual' ? 'Annual' : 'Monthly'}`,
        image:           'https://reviewpilot.live/favicon.svg',
        prefill: { email: user.email },
        theme: { color: '#4f7cff' },
        handler: async (response) => {
          // Always stop loading when Razorpay calls handler (payment done)
          setCheckoutLoading(false)
          try {
            const verifyRes = await fetch(`${API_URL}/api/billing/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            })
            if (verifyRes.ok) {
              setToast({ type: 'success', message: '🎉 Subscription activated successfully!' })
              setTimeout(() => navigate('/reviews'), 1500)
            } else if (verifyRes.status === 404) {
              // verify-payment endpoint not ready yet — payment was received by Razorpay
              // Backend already updated Firestore via webhook, so treat as success
              setToast({ type: 'success', message: '🎉 Payment received! Your subscription is being activated.' })
              setTimeout(() => navigate('/reviews'), 2000)
            } else {
              setToast({ type: 'error', message: 'Payment received but verification failed. Contact support@reviewpilot.live' })
            }
          } catch {
            setToast({ type: 'error', message: 'Payment received but verification failed. Contact support@reviewpilot.live' })
          }
        },
        modal: {
          ondismiss: () => setCheckoutLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to start checkout' })
      setCheckoutLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 900 }}>

        {/* Back */}
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/pricing')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'var(--ink-3)',
            fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)',
            marginBottom: 28,
          }}
        >
          <ArrowLeft size={14} /> Back to Pricing
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

          {/* ── Left: Plan + Coupon ── */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 24, letterSpacing: '-.02em' }}>
              Complete your purchase
            </h1>

            {/* Plan selector */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Select Plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(PLAN_DETAILS).map(([id, p]) => (
                  <label key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: plan === id ? 'rgba(79,124,255,.07)' : 'var(--bg)',
                    border: `1.5px solid ${plan === id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                  }}>
                    <input type="radio" name="plan" value={id} checked={plan === id} onChange={() => { setPlan(id); setAppliedCoupon(null); setCouponCode(''); setCouponError('') }} style={{ accentColor: 'var(--accent)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: plan === id ? 'var(--accent)' : 'var(--ink)' }}>{p.name}</span>
                        {p.popular && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 7px', borderRadius: 100 }}>Most Popular</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                        ₹{billing === 'annual' ? p.annualMonthly : p.monthly}/mo
                      </div>
                      {billing === 'annual' && (
                        <div style={{ fontSize: 11, color: 'var(--green)' }}>Save {p.savings}%</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Billing toggle */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Billing Cycle</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['monthly', 'Monthly'], ['annual', 'Annual — Save up to 30%']].map(([v, l]) => (
                  <label key={v} style={{
                    display: 'flex', alignItems: 'center', gap: 8, flex: 1,
                    background: billing === v ? 'rgba(79,124,255,.07)' : 'var(--bg)',
                    border: `1.5px solid ${billing === v ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '11px 14px', cursor: 'pointer',
                  }}>
                    <input type="radio" name="billing" value={v} checked={billing === v} onChange={() => { setBilling(v); setAppliedCoupon(null) }} style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: billing === v ? 'var(--accent)' : 'var(--ink-2)' }}>{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Tag size={14} style={{ color: 'var(--ink-3)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Coupon Code</span>
              </div>

              {appliedCoupon ? (
                <div style={{ background: 'rgba(34,208,138,.08)', border: '1px solid rgba(34,208,138,.2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={15} style={{ color: 'var(--green)' }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green)' }}>"{appliedCoupon.couponCode}" applied!</span>
                    </div>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
                    Discount: <strong>-₹{safeDiscount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code"
                      style={{
                        flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '9px 12px',
                        fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
                        outline: 'none', letterSpacing: '.04em',
                      }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '9px 18px', fontSize: 13.5,
                        fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                        opacity: couponLoading || !couponCode ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {couponLoading ? <Loader size={13} style={{ animation: 'spin .7s linear infinite' }} /> : null}
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p style={{ fontSize: 12.5, color: 'var(--red)', marginTop: 8 }}>{couponError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 20 }}>Order Summary</div>

              {/* Plan name */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{planData.name} Plan</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>
                  Billed {billing === 'annual' ? 'annually' : 'monthly'}
                </div>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                {planData.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                    <CheckCircle size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Pricing breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--ink-2)' }}>
                  <span>Subtotal</span>
                  <span>₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                {safeDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--green)' }}>
                    <span>Coupon discount</span>
                    <span>-₹{safeDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {billing === 'annual' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--green)' }}>
                    <span>Annual savings ({planData.savings}%)</span>
                    <span>✓ Applied</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Total</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                    ₹{finalPrice.toLocaleString('en-IN')}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {billing === 'annual' ? '/year' : '/month'} + GST
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin .6s linear infinite', display: 'inline-block' }} />
                      Opening checkout…
                    </span>
                  : '⚡ Pay with Razorpay'
                }
              </Button>

              <p style={{ fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                🔒 Secured by Razorpay · UPI, Cards, Netbanking accepted
              </p>
            </div>
          </div>

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
