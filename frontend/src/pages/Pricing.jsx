// src/pages/Pricing.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Zap, Star } from 'lucide-react'
import './Pricing.css'

/* ─────────────────────────────────────────────────────────────────
   PLAN DATA
───────────────────────────────────────────────────────────────── */
const BETA_FEATURES = [
  'Full access to all Pro features',
  'Unlimited reviews fetched',
  'Unlimited AI replies generated',
  'All 3 tones (Friendly, Professional, Apologetic)',
  'Manual posting with 1-click',
  'AI-powered insights & sentiment analysis',
  'Priority support + free onboarding call',
  'Direct WhatsApp access to founder',
]

const PRO_FEATURES = [
  'Unlimited reviews fetched',
  'Unlimited AI replies generated',
  'All 3 tones (Friendly, Professional, Apologetic)',
  'Manual posting with 1-click',
  'AI-powered insights & sentiment analysis',
  'Email support within 1 business day',
  'Multi-language replies (coming soon)',
  'Auto-reply mode (coming soon)',
]

const FAQS = [
  {
    q: 'Do I need a credit card for the beta offer?',
    a: 'No. The 6-month beta is completely free — no credit card required, no automatic billing. You only pay if you choose to continue after the beta period.',
  },
  {
    q: 'What happens after the 6-month beta?',
    a: 'After your beta period ends, you can continue on the Pro plan at ₹299/month or ₹2,999/year. You\'ll get a heads-up email before any charges.',
  },
  {
    q: 'What happens after my 15-day trial?',
    a: 'After the trial, your account pauses until you add a payment method. No surprise charges — you\'ll always be asked to confirm before billing starts.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, anytime. Go to Settings → Disconnect Google Business. No cancellation fees, no questions asked.',
  },
  {
    q: 'Is there a money-back guarantee?',
    a: 'If you\'re on a paid plan and not satisfied within the first 30 days, email us and we\'ll refund you fully — no questions asked.',
  },
  {
    q: 'What currency are prices in?',
    a: 'All prices are in Indian Rupees (₹). ReviewPilot is built specifically for Indian SMBs.',
  },
]

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function Pricing() {
  const [billing, setBilling]  = useState('monthly') // 'monthly' | 'annual'
  const [openFaq, setOpenFaq]  = useState(null)

  const monthlyPrice = 299
  const annualTotal  = 2999
  const annualMonthly = Math.round(annualTotal / 12) // ₹250/mo
  const annualSaving  = (monthlyPrice * 12) - annualTotal // ₹589 saved

  return (
    <div className="pricing-page">

      {/* ── Hero ── */}
      <div className="pricing-hero">
        <div className="pricing-hero__inner">
          <div className="pricing-beta-badge">
            <Star size={11} fill="currentColor" />
            Beta Offer — First 50 Users Only
          </div>
          <h1 className="pricing-title">Simple, honest pricing</h1>
          <p className="pricing-sub">
            Start free for 6 months. No credit card. No catch.<br />
            Built for Indian small businesses.
          </p>

          {/* Billing toggle — only relevant for Pro */}
          <div className="pricing-toggle">
            <button
              className={`pricing-toggle__btn${billing === 'monthly' ? ' pricing-toggle__btn--active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              className={`pricing-toggle__btn${billing === 'annual' ? ' pricing-toggle__btn--active' : ''}`}
              onClick={() => setBilling('annual')}
            >
              Annual
              <span className="pricing-toggle__save">Save ₹{annualSaving.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Plans grid ── */}
      <div className="pricing-body">
        <div className="pricing-grid">

          {/* ── Beta / Free plan ── */}
          <div className="plan-card plan-card--beta">
            <div className="plan-card__top">
              <div className="plan-card__eyebrow">
                🎁 Limited Beta Offer
              </div>
              <h2 className="plan-card__name">Beta Access</h2>
              <div className="plan-card__price-row">
                <span className="plan-card__currency">₹</span>
                <span className="plan-card__amount">0</span>
                <span className="plan-card__period">&nbsp;/ 6 months</span>
              </div>
              <p className="plan-card__desc">
                Full Pro access completely free for our first 50 beta users.
                Help us shape the product and lock in free access.
              </p>

              {/* Spots counter */}
              <div className="plan-card__spots">
                <div className="plan-card__spots-bar">
                  <div className="plan-card__spots-fill" style={{ width: '62%' }} />
                </div>
                <span className="plan-card__spots-label">~31 of 50 spots taken</span>
              </div>
            </div>

            <Link to="/signup" className="plan-card__cta plan-card__cta--beta">
              <Zap size={15} fill="currentColor" />
              Grab Your Free Spot
            </Link>

            <div className="plan-card__note">No credit card · No auto-billing · Cancel anytime</div>

            <ul className="plan-card__features">
              {BETA_FEATURES.map(f => (
                <li key={f} className="plan-card__feature">
                  <CheckCircle size={14} className="plan-card__check plan-card__check--green" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Pro plan ── */}
          <div className="plan-card plan-card--pro">
            <div className="plan-card__badge">
              <Zap size={11} fill="currentColor" />
              After Beta
            </div>

            <div className="plan-card__top">
              <div className="plan-card__eyebrow" style={{ color: 'var(--teal)' }}>
                ⚡ Pro Plan
              </div>
              <h2 className="plan-card__name">Pro</h2>

              {billing === 'monthly' ? (
                <div className="plan-card__price-row">
                  <span className="plan-card__currency">₹</span>
                  <span className="plan-card__amount">{monthlyPrice.toLocaleString('en-IN')}</span>
                  <span className="plan-card__period">&nbsp;/ month</span>
                </div>
              ) : (
                <>
                  <div className="plan-card__price-row">
                    <span className="plan-card__currency">₹</span>
                    <span className="plan-card__amount">{annualMonthly.toLocaleString('en-IN')}</span>
                    <span className="plan-card__period">&nbsp;/ month</span>
                  </div>
                  <div className="plan-card__annual-note">
                    Billed as <strong>₹{annualTotal.toLocaleString('en-IN')}/year</strong>
                    &nbsp;·&nbsp;
                    <span className="plan-card__saving">Save ₹{annualSaving.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              <p className="plan-card__desc">
                For businesses serious about their online reputation.
                15-day free trial for new users after beta.
              </p>

              <div className="plan-card__trial-note">
                ✅ 15-day free trial · No credit card to start
              </div>
            </div>

            <Link
              to="/signup?plan=pro"
              className="plan-card__cta plan-card__cta--pro"
            >
              Start Free Trial
            </Link>

            <div className="plan-card__note">30-day money-back guarantee. Cancel anytime.</div>

            <ul className="plan-card__features">
              {PRO_FEATURES.map(f => (
                <li key={f} className="plan-card__feature">
                  <CheckCircle size={14} className="plan-card__check plan-card__check--teal" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Comparison note ── */}
        <div className="pricing-compare">
          <div className="pricing-compare__inner">
            <span>🇮🇳</span>
            <span>
              All prices in Indian Rupees (₹). ReviewPilot is built for Indian SMBs —
              cafés, salons, clinics, restaurants, gyms, and more.
            </span>
          </div>
        </div>

        {/* ── Why free? ── */}
        <div className="pricing-why">
          <h2 className="pricing-section-title">Why is the beta free?</h2>
          <div className="pricing-why__grid">
            {[
              { icon: '🛠️', title: 'We\'re building together', desc: 'Beta users shape the product. Your feedback directly decides what we build next.' },
              { icon: '🤝', title: 'You take the risk with us', desc: 'Early adopters trust us before we\'re perfect. That deserves real appreciation.' },
              { icon: '🚀', title: 'We want your success story', desc: 'We\'d rather prove value first and earn your business long-term.' },
            ].map(({ icon, title, desc }) => (
              <div className="pricing-why__card" key={title}>
                <div className="pricing-why__icon">{icon}</div>
                <div className="pricing-why__title">{title}</div>
                <div className="pricing-why__desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="pricing-faq">
          <h2 className="pricing-section-title">Pricing FAQs</h2>
          <div className="pricing-faq__list">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div className="pricing-faq__item" key={i}>
                  <button
                    className="pricing-faq__q"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className={`pricing-faq__chevron${isOpen ? ' pricing-faq__chevron--open' : ''}`}>
                      ›
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pricing-faq__a">{faq.a}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="pricing-cta">
          <div className="pricing-cta__inner">
            <h2 className="pricing-cta__title">Still have questions?</h2>
            <p className="pricing-cta__sub">
              WhatsApp us at <strong>+91 98100 26181</strong> or email <strong>guptarahul07@gmail.com</strong>.
              We respond within 1 business day.
            </p>
            <div className="pricing-cta__actions">
              <Link to="/signup" className="pricing-cta__btn pricing-cta__btn--primary">
                <Zap size={15} fill="currentColor" />
                Grab Your Free Spot
              </Link>
              <Link to="/contact" className="pricing-cta__btn pricing-cta__btn--ghost">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
